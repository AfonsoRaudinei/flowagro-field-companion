import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShapeEditControlsProps {
  position: { x: number; y: number };
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

const ShapeEditControls: React.FC<ShapeEditControlsProps> = ({ 
  position, 
  onEdit, 
  onDelete, 
  canEdit 
}) => {
  if (!canEdit) return null;

  return (
    <div 
      className="absolute z-50 flex space-x-2"
      style={{
        left: position.x + 10,
        top: position.y - 40,
        pointerEvents: 'auto'
      }}
    >
      <Button
        onClick={onEdit}
        size="sm"
        className="w-10 h-10 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg border border-border"
        variant="ghost"
      >
        <Edit3 className="h-4 w-4 text-white" />
      </Button>
      
      <Button
        onClick={onDelete}
        size="sm"
        className="w-10 h-10 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg border border-border"
        variant="ghost"
      >
        <Trash2 className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
};

export default ShapeEditControls;