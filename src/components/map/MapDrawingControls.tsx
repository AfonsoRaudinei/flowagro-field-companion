import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { logger } from "@/lib/logger";
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

  // Memoized collect function to avoid recreation on each render
  const collect = useCallback(() => {
    try {
      const m = map as L.Map & { pm?: any };
      if (!m.pm?.getGeomanLayers) {
        logger.warn('Geoman getGeomanLayers not available');
        return;
      }

      const layers = m.pm.getGeomanLayers() ?? [];
      logger.debug('Collecting Geoman layers', { count: layers.length });
      
      if (!layers.length) {
        onChange?.(null);
        return;
      }
      
      const features: Feature[] = layers
        .map((layer: any) => {
          try {
            return layer.toGeoJSON ? layer.toGeoJSON() : null;
          } catch (error) {
            logger.warn('Error converting layer to GeoJSON', { error });
            return null;
          }
        })
        .filter(Boolean);
      
      const featureCollection: FeatureCollection = { 
        type: "FeatureCollection", 
        features 
      };
      
      logger.debug('Generated FeatureCollection', { featureCount: features.length });
      onChange?.(featureCollection);
    } catch (error) {
      logger.error('Error collecting geometries', { error });
    }
  }, [map, onChange]);

  useEffect(() => {
    const m = map as L.Map & { pm?: any };

    // Ensure pm is available
    if (!m.pm) {
      logger.warn('Geoman not available on map');
      return;
    }

    logger.debug('Setting up drawing controls', { enabled, editing, snapping });

    // Set up event handlers only once
    if (!handlersSetupRef.current) {
      logger.debug('Setting up Geoman event handlers');
      
      const createHandler = () => collect();
      const editHandler = () => collect();
      const removeHandler = () => collect();

      map.on("pm:create", createHandler);
      map.on("pm:edit", editHandler);
      map.on("pm:remove", removeHandler);
      
      handlersSetupRef.current = true;

      // Cleanup function to remove handlers
      return () => {
        logger.debug('Cleaning up Geoman event handlers');
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
      logger.warn('Error setting global options', { error });
    }

    // Controls visibility
    if (enabled) {
      try {
        logger.debug('Adding Geoman controls');
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
        logger.warn('Error adding controls', { error });
      }
    } else {
      try {
        logger.debug('Removing Geoman controls');
        m.pm?.removeControls?.();
        m.pm?.disableGlobalEditMode?.();
      } catch (error) {
        logger.warn('Error removing controls', { error });
      }
    }

    // Editing mode
    try {
      if (editing) {
        logger.debug('Enabling global edit mode');
        m.pm?.enableGlobalEditMode?.();
      } else {
        logger.debug('Disabling global edit mode');
        m.pm?.disableGlobalEditMode?.();
      }
    } catch (error) {
      logger.warn('Error managing edit mode', { error });
    }

  }, [map, enabled, editing, snapping, collect]);

  return null;
}