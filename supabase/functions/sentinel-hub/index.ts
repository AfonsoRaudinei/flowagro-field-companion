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

  try {
    console.log('=== Sentinel Hub Function Called ===');
    
    const sentinelHubKey = Deno.env.get('SENTINEL_HUB_API_KEY');
    console.log('API Key available:', !!sentinelHubKey);
    console.log('API Key length:', sentinelHubKey?.length || 0);
    
    if (!sentinelHubKey) {
      console.error('Sentinel Hub API key not configured');
      return new Response(
        JSON.stringify({ error: 'Sentinel Hub API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bbox, date, layerType, width = 512, height = 512 }: SentinelHubRequest = await req.json();
    console.log('Request parameters:', { bbox, date, layerType, width, height });

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

    const requestBody = {
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

    console.log('Sentinel Hub request body:', JSON.stringify(requestBody, null, 2));

    console.log('Making request to Sentinel Hub...');
    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sentinelHubKey}`,
        'Content-Type': 'application/json',
        'Accept': 'image/png'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sentinel Hub API error:', errorText);
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      
      return new Response(
        JSON.stringify({ 
          error: `Sentinel Hub API error: ${response.status}`,
          details: errorText,
          status: response.status
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the image as blob with proper CORS headers
    const imageBuffer = await response.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength);
    console.log('Successfully returning image data');
    
    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error in sentinel-hub function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});