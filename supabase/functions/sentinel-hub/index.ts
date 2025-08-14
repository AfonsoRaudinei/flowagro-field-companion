import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentinelHubRequest {
  bbox: [number, number, number, number]; // [min_lng, min_lat, max_lng, max_lat]
  date: string; // YYYY-MM-DD
  layerType: 'ndvi' | 'true-color' | 'false-color';
  width?: number;
  height?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🛰️ SENTINEL FUNCTION - Request received:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  try {
    const sentinelApiKey = Deno.env.get('SENTINEL_HUB_API_KEY');
    if (!sentinelApiKey) {
      console.error('🚨 CRITICAL ERROR: SENTINEL_HUB_API_KEY not found in environment variables');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('SENTINEL')));
      return new Response(
        JSON.stringify({ error: 'Sentinel Hub API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 API Key found, length:', sentinelApiKey.length);
    console.log('📥 Parsing request body...');
    
    const requestBody = await req.json();
    const { bbox, date, layerType, width = 512, height = 512 }: SentinelHubRequest = requestBody;
    
    console.log('📋 Request parameters:', {
      bbox,
      bboxFormatted: `[${bbox[0].toFixed(6)}, ${bbox[1].toFixed(6)}, ${bbox[2].toFixed(6)}, ${bbox[3].toFixed(6)}]`,
      date,
      layerType,
      width,
      height,
      bboxValid: Array.isArray(bbox) && bbox.length === 4,
      dateValid: !!date,
      layerTypeValid: ['ndvi', 'true-color', 'false-color'].includes(layerType)
    });

    // Evalscript for different layer types
    const evalscripts = {
      'ndvi': `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B08"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          if (ndvi < -0.5) return [0, 0, 0];
          else if (ndvi < -0.2) return [165/255, 0, 38/255];
          else if (ndvi < -0.1) return [215/255, 48/255, 39/255];
          else if (ndvi < 0) return [244/255, 109/255, 67/255];
          else if (ndvi < 0.025) return [253/255, 174/255, 97/255];
          else if (ndvi < 0.05) return [254/255, 224/255, 139/255];
          else if (ndvi < 0.075) return [255/255, 255/255, 191/255];
          else if (ndvi < 0.1) return [217/255, 240/255, 163/255];
          else if (ndvi < 0.15) return [173/255, 221/255, 142/255];
          else if (ndvi < 0.2) return [120/255, 198/255, 121/255];
          else if (ndvi < 0.25) return [65/255, 171/255, 93/255];
          else if (ndvi < 0.3) return [35/255, 132/255, 67/255];
          else if (ndvi < 0.4) return [0, 104/255, 55/255];
          else if (ndvi < 0.5) return [0, 69/255, 41/255];
          else return [0, 40/255, 26/255];
        }
      `,
      'true-color': `
        //VERSION=3
        function setup() {
          return {
            input: ["B02", "B03", "B04"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
        }
      `,
      'false-color': `
        //VERSION=3
        function setup() {
          return {
            input: ["B03", "B04", "B08"],
            output: { bands: 3 }
          };
        }
        function evaluatePixel(sample) {
          return [sample.B08 * 2.5, sample.B04 * 2.5, sample.B03 * 2.5];
        }
      `
    };

    const sentinelRequestBody = {
      input: {
        bounds: {
          bbox: bbox,
          properties: {
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
          }
        },
        data: [{
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: `${date}T00:00:00Z`,
              to: `${date}T23:59:59Z`
            },
            maxCloudCoverage: 30
          }
        }]
      },
      output: {
        width: width,
        height: height,
        responses: [{
          identifier: "default",
          format: {
            type: "image/png"
          }
        }]
      },
      evalscript: evalscripts[layerType]
    };

    console.log('🌐 Making request to Sentinel Hub API...');
    console.log('🔗 API URL: https://services.sentinel-hub.com/api/v1/process');
    console.log('📤 Request body size:', JSON.stringify(sentinelRequestBody).length, 'characters');
    
    const fetchStartTime = Date.now();
    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sentinelApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sentinelRequestBody)
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`📡 Sentinel Hub API response received in ${fetchDuration}ms:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 Sentinel Hub API error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 1000),
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.status === 401) {
        console.error('🔑 Authentication Error - API Key may be invalid or expired');
        return new Response(
          JSON.stringify({ 
            error: `Authentication failed. Please check your Sentinel Hub API key. Status: ${response.status}`,
            details: errorText.substring(0, 500),
            apiKeyLength: sentinelApiKey.length,
            apiKeyPrefix: sentinelApiKey.substring(0, 8) + '...'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Sentinel Hub API request failed with status ${response.status}`,
          details: errorText.substring(0, 500),
          requestInfo: {
            bbox,
            date,
            layerType,
            processingTime: fetchDuration
          }
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get image data as ArrayBuffer
    console.log('📷 Processing image response...');
    const imageBuffer = await response.arrayBuffer();
    const totalDuration = Date.now() - startTime;
    
    console.log('✅ Image processed successfully:', {
      size: imageBuffer.byteLength,
      contentType: response.headers.get('content-type'),
      fetchDuration,
      totalDuration
    });

    // Return the image data as ArrayBuffer
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.byteLength.toString(),
        'X-Processing-Time': totalDuration.toString(),
        'Cache-Control': 'public, max-age=3600'
      },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('🚨 CRITICAL ERROR in sentinel-hub function:', {
      message: error.message,
      stack: error.stack,
      processingTime: totalDuration,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        processingTime: totalDuration,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});