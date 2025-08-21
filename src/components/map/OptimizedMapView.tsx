import React, { memo } from "react";
import MapView, { type MapViewProps } from "./MapView";

// Memoized MapView to prevent unnecessary re-renders
const OptimizedMapView = memo(MapView, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.center?.[0] === nextProps.center?.[0] &&
    prevProps.center?.[1] === nextProps.center?.[1] &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.baseLayerId === nextProps.baseLayerId &&
    JSON.stringify(prevProps.markers) === JSON.stringify(nextProps.markers) &&
    JSON.stringify(prevProps.geojson) === JSON.stringify(nextProps.geojson)
  );
});

OptimizedMapView.displayName = 'OptimizedMapView';

export default OptimizedMapView;