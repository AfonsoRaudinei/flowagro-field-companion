import { supabase } from "@/integrations/supabase/client";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
};

export type ShapeFeature = any; // TODO: refine when schema is defined

// Placeholder service for future map data. Integrate with Supabase tables when available.
export async function fetchPins(): Promise<Pin[]> {
  // TODO: Query your Supabase tables (e.g., public.pins) when schema exists
  // const { data, error } = await supabase.from('pins').select('*');
  // if (error) throw error;
  // return (data || []).map(r => ({ id: r.id, lat: r.lat, lng: r.lng, label: r.name }));
  return [];
}

export async function fetchShapes(): Promise<ShapeFeature[] | null> {
  // TODO: Query shapes/geojson from Supabase storage or tables
  return null;
}

export async function fetchNdviLayerUrl(): Promise<string | null> {
  // TODO: Provide URL template for NDVI tiles if available from Supabase or external service
  return null;
}
