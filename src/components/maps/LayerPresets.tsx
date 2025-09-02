import React, { useState } from 'react';
import {
  Map,
  Leaf,
  Eye,
  Sprout,
  Wheat,
  Star,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useMapLayers, LayerPreset } from '@/hooks/useMapLayers';
import { cn } from '@/lib/utils';

const PRESET_ICONS = {
  'Map': Map,
  'Leaf': Leaf,
  'Eye': Eye,
  'Seed': Sprout,
  'Wheat': Wheat,
  'Star': Star
};

interface LayerPresetsProps {
  className?: string;
}

export const LayerPresets: React.FC<LayerPresetsProps> = ({ className }) => {
  const {
    presets,
    customFavorites,
    activePreset,
    applyPreset,
    saveFavorite,
    removeFavorite,
    layers
  } = useMapLayers();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [newFavoriteDescription, setNewFavoriteDescription] = useState('');

  const allPresets = [...presets, ...customFavorites];
  const enabledLayerCount = layers.filter(l => l.enabled).length;

  const handleSaveFavorite = () => {
    if (!newFavoriteName.trim()) return;
    
    saveFavorite(newFavoriteName, newFavoriteDescription);
    setNewFavoriteName('');
    setNewFavoriteDescription('');
    setShowSaveDialog(false);
  };

  const PresetCard: React.FC<{ preset: LayerPreset; isActive: boolean }> = ({ 
    preset, 
    isActive 
  }) => {
    const IconComponent = PRESET_ICONS[preset.icon as keyof typeof PRESET_ICONS] || Map;
    const isCustom = preset.id.startsWith('custom-');
    
    return (
      <Card className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isActive 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border/50 hover:border-border"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "p-2 rounded-lg",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <h4 className={cn(
                  "font-medium text-sm",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {preset.name}
                </h4>
                <Badge 
                  variant="outline" 
                  className="text-xs mt-1"
                >
                  {preset.layers.length} camadas
                </Badge>
              </div>
            </div>
            
            {isCustom && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(preset.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {preset.description}
          </p>
          
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => applyPreset(preset.id)}
          >
            {isActive ? 'Ativo' : 'Aplicar'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Presets de Camadas</CardTitle>
          
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={enabledLayerCount === 0}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Favorito
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Salvar como Favorito</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Preset</label>
                  <Input
                    value={newFavoriteName}
                    onChange={(e) => setNewFavoriteName(e.target.value)}
                    placeholder="Ex: Minha Análise Personalizada"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newFavoriteDescription}
                    onChange={(e) => setNewFavoriteDescription(e.target.value)}
                    placeholder="Breve descrição do que este preset faz..."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Salvará as {enabledLayerCount} camadas atualmente ativas
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveFavorite}
                    disabled={!newFavoriteName.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Predefined Presets */}
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-2">
            Presets Padrão
          </h5>
          <div className="grid gap-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={activePreset === preset.id}
              />
            ))}
          </div>
        </div>

        {/* Custom Favorites */}
        {customFavorites.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">
              Seus Favoritos
            </h5>
            <div className="grid gap-3">
              {customFavorites.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={activePreset === preset.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {enabledLayerCount === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Ative algumas camadas para criar presets personalizados
          </div>
        )}
      </CardContent>
    </Card>
  );
};