import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://supabase.com/dist/module/esm/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface WebhookPayload {
  user_id: string;
  event_type: string;
  data: any;
  timestamp: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendWebhook = async (webhook: any, payload: WebhookPayload, attempt: number = 1): Promise<boolean> => {
  try {
    console.log(`Sending webhook ${webhook.id} (attempt ${attempt})`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FlowAgro-Webhook/1.0',
    };

    // Add signature if secret token is configured
    if (webhook.secret_token) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhook.secret_token),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
      const hex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      headers['x-webhook-signature'] = `sha256=${hex}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhook.timeout_seconds * 1000),
    });

    const responseText = await response.text();

    // Log the attempt
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: payload.event_type,
        payload: payload,
        response_status: response.status,
        response_body: responseText.substring(0, 1000), // Limit response body length
        attempt_number: attempt
      });

    if (response.ok) {
      console.log(`Webhook ${webhook.id} sent successfully`);
      return true;
    } else {
      console.error(`Webhook ${webhook.id} failed with status ${response.status}: ${responseText}`);
      return false;
    }

  } catch (error) {
    console.error(`Webhook ${webhook.id} attempt ${attempt} failed:`, error);

    // Log the error
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: payload.event_type,
        payload: payload,
        response_status: 0,
        error_message: error.message,
        attempt_number: attempt
      });

    return false;
  }
};

const sendWebhookWithRetry = async (webhook: any, payload: WebhookPayload) => {
  for (let attempt = 1; attempt <= webhook.retry_count; attempt++) {
    const success = await sendWebhook(webhook, payload, attempt);
    
    if (success) {
      return;
    }

    // Wait before retry with exponential backoff
    if (attempt < webhook.retry_count) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
      await sleep(delay);
    }
  }

  console.error(`Webhook ${webhook.id} failed after ${webhook.retry_count} attempts`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, event_type, data } = await req.json();

    if (!user_id || !event_type || !data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing webhook event: ${event_type} for user: ${user_id}`);

    // Get active webhooks for this user that listen to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .contains('events', [event_type]);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`No active webhooks found for event ${event_type}`);
      return new Response(JSON.stringify({ message: 'No webhooks configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: WebhookPayload = {
      user_id,
      event_type,
      data,
      timestamp: new Date().toISOString()
    };

    // Send webhooks in parallel with background processing
    const webhookPromises = webhooks.map(webhook => 
      sendWebhookWithRetry(webhook, payload)
    );

    // Use background task to handle webhook sending
    EdgeRuntime.waitUntil(Promise.all(webhookPromises));

    return new Response(JSON.stringify({ 
      message: `Processing ${webhooks.length} webhook(s)`,
      webhooks_count: webhooks.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in webhook-sender:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});