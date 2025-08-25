import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MapPin, 
  Tractor, 
  Ruler, 
  Settings,
  Save,
  X 
} from 'lucide-react';
import { MapPin as MapPinType } from '@/hooks/useMapPins';

interface PinEditDialogProps {
  pin: MapPinType | null;
  open: boolean;
  onClose: () => void;
  onSave: (pinId: string, updates: Partial<MapPinType>) => void;
}

const PIN_TYPES = [
  { value: 'default', label: 'Padrão', icon: MapPin, description: 'Pin genérico' },
  { value: 'farm', label: 'Fazenda', icon: Tractor, description: 'Localização da fazenda' },
  { value: 'measurement', label: 'Medição', icon: Ruler, description: 'Ponto de medição' },
  { value: 'custom', label: 'Personalizado', icon: Settings, description: 'Pin personalizado' },
] as const;

const PRESET_COLORS = [
  '#0057FF', // FlowAgro Blue
  '#00C4B4', // FlowAgro Green
  '#FF4444', // Red
  '#FF8800', // Orange
  '#8844FF', // Purple
  '#44FF88', // Light Green
  '#FFAA00', // Yellow
  '#FF0088', // Pink
];

export const PinEditDialog: React.FC<PinEditDialogProps> = ({
  pin,
  open,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(pin?.title || '');
  const [description, setDescription] = useState(pin?.description || '');
  const [color, setColor] = useState(pin?.color || '#0057FF');
  const [type, setType] = useState(pin?.type || 'default');

  React.useEffect(() => {
    if (pin) {
      setTitle(pin.title || '');
      setDescription(pin.description || '');
      setColor(pin.color || '#0057FF');
      setType(pin.type || 'default');
    }
  }, [pin]);

  const handleSave = () => {
    if (!pin) return;
    
    onSave(pin.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      color,
      type: type as MapPinType['type'],
    });
    
    onClose();
  };

  const selectedType = PIN_TYPES.find(t => t.value === type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {selectedType && <selectedType.icon className="w-5 h-5 text-primary" />}
            <span>Editar Pin</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pin Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo do Pin</Label>
            <Select value={type} onValueChange={(value) => setType(value as MapPinType['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIN_TYPES.map((pinType) => {
                  const Icon = pinType.icon;
                  return (
                    <SelectItem key={pinType.value} value={pinType.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{pinType.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {pinType.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do pin"
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada (opcional)"
              rows={3}
              className="rounded-xl"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <Label>Cor do Pin</Label>
            <div className="space-y-3">
              {/* Preset Colors */}
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === presetColor 
                        ? 'border-foreground scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setColor(presetColor)}
                  />
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-8 rounded-lg border border-input cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#0057FF"
                  className="flex-1 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-xl p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: color }}
              />
              <div>
                <div className="font-medium text-sm">
                  {title || 'Pin sem título'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedType?.label} • {pin?.coordinates[1].toFixed(4)}, {pin?.coordinates[0].toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};