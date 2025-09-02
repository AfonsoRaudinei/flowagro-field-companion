// Supabase Edge Function: agromonitoring-api
// Integrates with AgroMonitoring API for polygon management and monitoring

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Polygon {
  id?: string;
  name: string;
  geo_json: {
    type: "Feature";
    properties: Record<string, any>;
    geometry: {
      type: "Polygon";
      coordinates: number[][][];
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AGROMONITORING_API_KEY");
    if (!apiKey) {
      console.error("AGROMONITORING_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AgroMonitoring API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";
    const polygonId = url.searchParams.get("polygon_id");

    console.log(`AgroMonitoring API request: ${action}`);

    const baseUrl = "http://api.agromonitoring.com/agro/1.0";

    switch (action) {
      case "create": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed for create action" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
          );
        }

        const body = await req.json();
        const polygon: Polygon = body.polygon;

        const response = await fetch(`${baseUrl}/polygons?appid=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(polygon),
        });

        const data = await response.json();
        console.log("Polygon created:", data);

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const response = await fetch(`${baseUrl}/polygons?appid=${apiKey}`);
        const data = await response.json();
        
        console.log(`Retrieved ${data.length || 0} polygons`);

        return new Response(JSON.stringify({ success: true, polygons: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!polygonId) {
          return new Response(
            JSON.stringify({ error: "polygon_id required for delete action" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        const response = await fetch(`${baseUrl}/polygons/${polygonId}?appid=${apiKey}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log(`Polygon deleted: ${polygonId}`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const error = await response.text();
          console.error("Delete error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete polygon" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
          );
        }
      }

      case "ndvi": {
        if (!polygonId) {
          return new Response(
            JSON.stringify({ error: "polygon_id required for NDVI data" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        const start = url.searchParams.get("start") || Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        const end = url.searchParams.get("end") || Math.floor(Date.now() / 1000);

        const response = await fetch(
          `${baseUrl}/image/search?polyid=${polygonId}&start=${start}&end=${end}&appid=${apiKey}`
        );

        const data = await response.json();
        console.log(`NDVI data retrieved for polygon ${polygonId}`);

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: create, list, delete, ndvi" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    console.error("AgroMonitoring API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error?.message || String(error) 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});