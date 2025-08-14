import { useEffect, useRef } from "react";
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
  const handlersSetupRef = useRef(false);

  useEffect(() => {
    const m: any = map as any;

    // Ensure pm is available
    if (!m.pm) {
      console.warn('Geoman not available on map');
      return;
    }

    console.log('Setting up drawing controls:', { enabled, editing, snapping });

    // Helper to collect all drawn layers to a single FeatureCollection
    const collect = () => {
      try {
        const layers: any[] = m.pm?.getGeomanLayers?.() ?? [];
        console.log('Geoman layers found:', layers.length);
        
        if (!layers.length) {
          onChange?.(null);
          return;
        }
        
        const features: Feature<Geometry, any>[] = layers
          .map((l) => {
            try {
              return l.toGeoJSON ? l.toGeoJSON() : null;
            } catch (error) {
              console.warn('Error converting layer to GeoJSON:', error);
              return null;
            }
          })
          .filter(Boolean);
        
        const fc: FeatureCollection = { type: "FeatureCollection", features: features as Feature[] };
        console.log('Generated FeatureCollection:', fc);
        onChange?.(fc);
      } catch (error) {
        console.error('Error collecting geometries:', error);
      }
    };

    // Set up event handlers only once
    if (!handlersSetupRef.current) {
      console.log('Setting up Geoman event handlers');
      
      const createHandler = (e: any) => {
        console.log('Geoman create event:', e);
        collect();
      };
      
      const editHandler = (e: any) => {
        console.log('Geoman edit event:', e);
        collect();
      };
      
      const removeHandler = (e: any) => {
        console.log('Geoman remove event:', e);
        collect();
      };

      map.on("pm:create", createHandler);
      map.on("pm:edit", editHandler);
      map.on("pm:remove", removeHandler);
      
      handlersSetupRef.current = true;

      // Cleanup function to remove handlers
      return () => {
        console.log('Cleaning up Geoman event handlers');
        map.off("pm:create", createHandler);
        map.off("pm:edit", editHandler);
        map.off("pm:remove", removeHandler);
        handlersSetupRef.current = false;
      };
    }

    // Apply global options (snapping)
    try {
      m.pm?.setGlobalOptions?.({ 
        snappable: snapping, 
        snapDistance: snapping ? 20 : 0,
        allowSelfIntersection: false,
        continueDrawing: false
      });
    } catch (error) {
      console.warn('Error setting global options:', error);
    }

    // Controls visibility
    if (enabled) {
      try {
        console.log('Adding Geoman controls');
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
      } catch (error) {
        console.warn('Error adding controls:', error);
      }
    } else {
      try {
        console.log('Removing Geoman controls');
        m.pm?.removeControls?.();
        m.pm?.disableGlobalEditMode?.();
      } catch (error) {
        console.warn('Error removing controls:', error);
      }
    }

    // Editing mode
    try {
      if (editing) {
        console.log('Enabling global edit mode');
        m.pm?.enableGlobalEditMode?.();
      } else {
        console.log('Disabling global edit mode');
        m.pm?.disableGlobalEditMode?.();
      }
    } catch (error) {
      console.warn('Error managing edit mode:', error);
    }

  }, [map, enabled, editing, snapping, onChange]);

  return null;
}