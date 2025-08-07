import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanetRequest {
  bbox: [number, number, number, number];
  date: string;
  layerType: 'ndvi' | 'visual' | 'analytic';
  cloudCover?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const planetApiKey = Deno.env.get('PLANET_API_KEY');
    if (!planetApiKey) {
      return new Response(
        JSON.stringify({ error: 'Planet Labs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bbox, date, layerType, cloudCover = 0.3 }: PlanetRequest = await req.json();

    // Search for imagery
    const searchBody = {
      item_types: ["PSScene"],
      filter: {
        type: "AndFilter",
        config: [
          {
            type: "GeometryFilter",
            field_name: "geometry",
            config: {
              type: "Polygon",
              coordinates: [[
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]], 
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]]
              ]]
            }
          },
          {
            type: "DateRangeFilter",
            field_name: "acquired",
            config: {
              gte: `${date}T00:00:00.000Z`,
              lte: `${date}T23:59:59.999Z`
            }
          },
          {
            type: "RangeFilter",
            field_name: "cloud_cover",
            config: {
              lte: cloudCover
            }
          }
        ]
      }
    };

    console.log('Planet search request:', JSON.stringify(searchBody, null, 2));

    const searchResponse = await fetch('https://api.planet.com/data/v1/quick-search', {
      method: 'POST',
      headers: {
        'Authorization': `api-key ${planetApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Planet search error:', errorText);
      return new Response(
        JSON.stringify({ error: `Planet search failed: ${searchResponse.status}` }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Planet search results:', searchData.features?.length || 0, 'images found');

    if (!searchData.features || searchData.features.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Planet imagery found for this date and location' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the best quality image (lowest cloud cover)
    const bestImage = searchData.features.sort((a: any, b: any) => 
      a.properties.cloud_cover - b.properties.cloud_cover
    )[0];

    console.log('Selected image:', bestImage.id, 'cloud cover:', bestImage.properties.cloud_cover);

    // For NDVI calculation, we need analytic assets
    const assetType = layerType === 'ndvi' ? 'analytic_sr' : 'visual';
    
    // Get download link for the asset
    const assetResponse = await fetch(
      `https://api.planet.com/data/v1/item-types/PSScene/items/${bestImage.id}/assets`,
      {
        headers: {
          'Authorization': `api-key ${planetApiKey}`
        }
      }
    );

    if (!assetResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to get asset information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assets = await assetResponse.json();
    const asset = assets[assetType];

    if (!asset) {
      return new Response(
        JSON.stringify({ error: `Asset type ${assetType} not available` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Activate asset if needed
    if (asset.status !== 'active') {
      await fetch(asset._links.activate, {
        method: 'GET',
        headers: {
          'Authorization': `api-key ${planetApiKey}`
        }
      });

      return new Response(
        JSON.stringify({ 
          message: 'Asset activation initiated. Please try again in a few minutes.',
          status: 'activating'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return metadata for now (actual image processing would require more complex setup)
    return new Response(
      JSON.stringify({
        imageId: bestImage.id,
        cloudCover: bestImage.properties.cloud_cover,
        acquisitionDate: bestImage.properties.acquired,
        assetType: assetType,
        downloadUrl: asset.location,
        bbox: bbox,
        layerType: layerType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in planet-labs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});