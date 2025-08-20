import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Edit3, Magnet, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DrawingMode = "polygon" | "rectangle" | "circle" | "freehand" | null;

interface FloatingDrawButtonProps {
  drawingMode: DrawingMode;
  editing: boolean;
  snapOn: boolean;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onEditingChange: (editing: boolean) => void;
  onSnapChange: (snap: boolean) => void;
  onClearGeometry: () => void;
  hasGeometry: boolean;
  disabled?: boolean;
}

const drawingTools = [
  { id: "freehand" as const, label: "Mão Livre", icon: PenTool },
  { id: "polygon" as const, label: "Polígono", icon: PenTool },
  { id: "circle" as const, label: "Pivô", icon: PenTool },
  { id: "rectangle" as const, label: "Retângulo", icon: PenTool },
];

export const FloatingDrawButton: React.FC<FloatingDrawButtonProps> = ({
  drawingMode,
  editing,
  snapOn,
  onDrawingModeChange,
  onEditingChange,
  onSnapChange,
  onClearGeometry,
  hasGeometry,
  disabled = false
}) => {
  const [quickbarOpen, setQuickbarOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Close quickbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setQuickbarOpen(false);
      }
    };

    if (quickbarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [quickbarOpen]);

  // Close quickbar when drawing starts or completes
  useEffect(() => {
    if (drawingMode) {
      setQuickbarOpen(false);
    }
  }, [drawingMode]);

  const handleToolSelect = (mode: DrawingMode) => {
    onDrawingModeChange(mode);
    setQuickbarOpen(false);
  };

  const handleMainButtonClick = () => {
    if (drawingMode) {
      // Stop drawing if currently drawing
      onDrawingModeChange(null);
    } else {
      // Toggle quickbar
      setQuickbarOpen(!quickbarOpen);
    }
  };

  const getButtonVariant = () => {
    if (drawingMode) return "default";
    if (quickbarOpen) return "secondary";
    return "outline";
  };

  return (
    <div ref={buttonRef} className="fixed left-4 bottom-20 z-[1001]">
      {/* Quickbar - appears above the main button */}
      {quickbarOpen && !drawingMode && (
        <div className="absolute bottom-16 left-0 mb-2 animate-fade-in">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 min-w-[280px]">
            {/* Drawing Tools */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {drawingTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToolSelect(tool.id)}
                    className="h-8 justify-start"
                  >
                    <IconComponent className="h-3 w-3 mr-2" />
                    <span className="text-xs">{tool.label}</span>
                  </Button>
                );
              })}
            </div>
            
            {/* Action Tools */}
            <div className="flex items-center gap-1 pt-2 border-t">
              <Button
                variant={editing ? "default" : "ghost"}
                size="sm"
                onClick={() => onEditingChange(!editing)}
                className="flex-1 h-7"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                <span className="text-xs">Editar</span>
              </Button>
              <Button
                variant={snapOn ? "default" : "ghost"}
                size="sm"
                onClick={() => onSnapChange(!snapOn)}
                className="flex-1 h-7"
              >
                <Magnet className="h-3 w-3 mr-1" />
                <span className="text-xs">Snap</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearGeometry();
                  setQuickbarOpen(false);
                }}
                disabled={!hasGeometry}
                className="h-7 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Draw Button */}
      <Button
        variant={getButtonVariant()}
        size="icon"
        onClick={handleMainButtonClick}
        disabled={disabled}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
          drawingMode && "scale-105 shadow-xl",
          "hover:scale-110"
        )}
      >
        <PenTool className={cn("h-6 w-6", drawingMode && "animate-pulse")} />
      </Button>
    </div>
  );
};