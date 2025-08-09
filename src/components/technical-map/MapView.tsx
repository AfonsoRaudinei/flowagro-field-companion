import React from "react";

interface MapViewProps extends React.HTMLAttributes<HTMLDivElement> {
  containerRef: React.RefObject<HTMLDivElement>;
}

const MapView: React.FC<MapViewProps> = ({ containerRef, className = "", ...rest }) => {
  return <div ref={containerRef} className={className} {...rest} />;
};

export default MapView;
