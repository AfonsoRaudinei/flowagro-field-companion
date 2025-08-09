import React from "react";
import DrawingToolsPanel from "@/components/ui/drawing-tools-panel";

interface ToolbarsProps {
  show: boolean;
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  onRemoveSelected: () => void;
  onImportKML: () => void;
  hasSelectedShape: boolean;
  onClose: () => void;
}

const Toolbars: React.FC<ToolbarsProps> = ({ show, selectedTool, onToolSelect, onRemoveSelected, onImportKML, hasSelectedShape, onClose }) => {
  if (!show) return null;
  return (
    <div className="absolute left-20 top-1/2 -translate-y-1/2 z-30">
      <DrawingToolsPanel
        selectedTool={selectedTool}
        onToolSelect={(toolId) => {
          onToolSelect(toolId);
          setTimeout(() => onClose(), 200);
        }}
        onRemoveSelected={() => {
          onRemoveSelected();
          onClose();
        }}
        onImportKML={onImportKML}
        hasSelectedShape={hasSelectedShape}
        className="w-72"
      />
    </div>
  );
};

export default Toolbars;
