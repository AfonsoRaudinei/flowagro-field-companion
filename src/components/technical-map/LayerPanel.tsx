import React from "react";
import SatelliteLayerSelector from "@/components/SatelliteLayerSelector";

interface LayerPanelProps {
  show: boolean;
  currentLayer: string;
  onLayerChange: (layerId: string) => void;
  onClose: () => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ show, currentLayer, onLayerChange, onClose }) => {
  if (!show) return null;
  return (
    <div className="absolute left-20 top-1/2 -translate-y-1/2 z-30">
      <SatelliteLayerSelector
        onLayerChange={onLayerChange}
        currentLayer={currentLayer}
        onClose={onClose}
      />
    </div>
  );
};

export default LayerPanel;
