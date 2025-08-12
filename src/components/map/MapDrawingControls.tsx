import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export type MapDrawingControlsProps = {
  enabled: boolean;
  editing: boolean;
  snapping: boolean;
  onChange?: (fc: FeatureCollection | null) => void;
};

export default function MapDrawingControls({ enabled, editing, snapping, onChange }: MapDrawingControlsProps) {
  const map = useMap();

  useEffect(() => {
    const m: any = map as any;

    // Helper to collect all drawn layers to a single FeatureCollection
    const collect = () => {
      const layers: any[] = m.pm?.getGeomanLayers?.() ?? [];
      if (!layers.length) {
        onChange?.(null);
        return;
      }
      const features: Feature<Geometry, any>[] = layers
        .map((l) => (l.toGeoJSON ? l.toGeoJSON() : null))
        .filter(Boolean);
      const fc: FeatureCollection = { type: "FeatureCollection", features: features as Feature[] };
      onChange?.(fc);
    };

    // Apply global options (snapping)
    m.pm?.setGlobalOptions?.({ snappable: snapping, snapDistance: snapping ? 20 : 0 });

    // Controls visibility
    if (enabled) {
      m.pm?.addControls?.({
        position: "topright",
        drawMarker: false,
        drawPolyline: false,
        drawText: false,
        dragMode: false,
        cutPolygon: false,
        rotateMode: false,
        drawCircleMarker: false,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: true,
        editMode: false,
        removalMode: true,
      });
    } else {
      m.pm?.removeControls?.();
      m.pm?.disableGlobalEditMode?.();
    }

    // Editing mode
    if (editing) {
      m.pm?.enableGlobalEditMode?.();
    } else {
      m.pm?.disableGlobalEditMode?.();
    }

    // Events
    map.on("pm:create", collect);
    map.on("pm:edit", collect);
    map.on("pm:remove", collect);

    return () => {
      map.off("pm:create", collect);
      map.off("pm:edit", collect);
      map.off("pm:remove", collect);
    };
  }, [map, enabled, editing, snapping, onChange]);

  return null;
}
