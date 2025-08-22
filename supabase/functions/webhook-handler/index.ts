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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`Webhook received: ${req.method} ${req.url}`);

    // Extract webhook ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const webhookId = pathParts[pathParts.length - 1];

    if (!webhookId || webhookId === 'webhook-handler') {
      return new Response(JSON.stringify({ error: 'Webhook ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      console.error('Webhook not found or inactive:', webhookError);
      return new Response(JSON.stringify({ error: 'Webhook not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature if secret token is set
    if (webhook.secret_token) {
      const signature = req.headers.get('x-webhook-signature');
      if (!signature) {
        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const bodyText = await req.text();
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhook.secret_token),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== `sha256=${expectedHex}`) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Parse body from text
      const payload = JSON.parse(bodyText);
      
      // Process webhook payload here
      console.log('Processing webhook payload:', payload);

      // Log the webhook call
      const { error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          webhook_id: webhook.id,
          event_type: payload.event_type || 'unknown',
          payload: payload,
          response_status: 200,
          response_body: 'Success',
          attempt_number: 1
        });

      if (logError) {
        console.error('Error logging webhook:', logError);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // No signature verification needed
      const payload = await req.json();
      
      console.log('Processing webhook payload:', payload);

      // Log the webhook call
      const { error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          webhook_id: webhook.id,
          event_type: payload.event_type || 'unknown',
          payload: payload,
          response_status: 200,
          response_body: 'Success',
          attempt_number: 1
        });

      if (logError) {
        console.error('Error logging webhook:', logError);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in webhook-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});