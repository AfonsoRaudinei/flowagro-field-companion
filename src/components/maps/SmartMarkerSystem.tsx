import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSmartMarkers, SmartMarkerCategory, SmartMarkerData } from '@/hooks/useSmartMarkers';
import { 
  MapPin, 
  Zap, 
  Brain,
  Filter,
  Settings,
  ChevronDown,
  Plus,
  Download,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layers,
  Eye,
  X
} from 'lucide-react';

interface SmartMarkerSystemProps {
  className?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<SmartMarkerCategory, string> = {
  irrigation: '💧',
  equipment: '🚜',
  crop_health: '🌱',
  weather: '🌤️',
  soil: '🌍',
  pest_disease: '🐛',
  harvest: '🌾',
  planting: '🌱',
  maintenance: '🔧',
  observation: '👁️'
};

const PRIORITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-500'
};

const PRIORITY_LABELS = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo'
};

export const SmartMarkerSystem: React.FC<SmartMarkerSystemProps> = ({
  className = '',
  position = 'left',
  onClose
}) => {
  const {
    markers,
    clusters,
    isAnalyzing,
    suggestMarkers,
    categorizeMarker,
    addSmartMarker,
    removeMarker,
    enableClustering,
    setEnableClustering,
    clusteringDistance,
    setClusteringDistance,
    activeCategories,
    toggleCategory,
    priorityFilter,
    setPriorityFilter,
    contextualFilter,
    setContextualFilter,
    getMarkersByCategory,
    getCriticalMarkers,
    getSeasonalMarkers,
    exportMarkers
  } = useSmartMarkers();

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMarkersList, setShowMarkersList] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SmartMarkerCategory>('observation');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const criticalMarkers = getCriticalMarkers();
  const seasonalMarkers = getSeasonalMarkers();
  const aiSuggestedMarkers = markers.filter(m => m.aiSuggested);
  const totalMarkers = markers.length;
  const visibleMarkers = enableClustering ? 
    clusters.reduce((sum, cluster) => sum + cluster.markers.length, 0) : 
    markers.filter(m => activeCategories.has(m.category) && priorityFilter.includes(m.priority)).length;

  const handleCategoryToggle = (category: SmartMarkerCategory) => {
    toggleCategory(category);
  };

  const handlePriorityToggle = (priority: SmartMarkerData['priority']) => {
    const newFilter = priorityFilter.includes(priority) 
      ? priorityFilter.filter(p => p !== priority)
      : [...priorityFilter, priority];
    setPriorityFilter(newFilter);
  };

  const handleSuggestMarkers = async () => {
    // This would normally get the current viewport bounds
    const mockArea: [number, number][] = [
      [-47.8825, -15.7942], // Coordinates around Brasília
      [-47.8625, -15.7942],
      [-47.8625, -15.7742],
      [-47.8825, -15.7742]
    ];
    
    await suggestMarkers(mockArea, 'agricultura de precisão');
  };

  const getCategoryStats = () => {
    const stats: Record<SmartMarkerCategory, number> = {} as Record<SmartMarkerCategory, number>;
    Object.keys(CATEGORY_ICONS).forEach(cat => {
      stats[cat as SmartMarkerCategory] = getMarkersByCategory(cat as SmartMarkerCategory).length;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <Card className={`${className} w-80`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Marcadores Inteligentes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{totalMarkers}</Badge>
            {criticalMarkers.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalMarkers.length}
              </Badge>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critical Alerts */}
        {criticalMarkers.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {criticalMarkers.length} Marcador{criticalMarkers.length !== 1 ? 'es' : ''} Crítico{criticalMarkers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {criticalMarkers.slice(0, 3).map(marker => (
                <div key={marker.id} className="text-xs text-red-700">
                  {CATEGORY_ICONS[marker.category]} {marker.title}
                </div>
              ))}
              {criticalMarkers.length > 3 && (
                <div className="text-xs text-red-600">
                  +{criticalMarkers.length - 3} outros
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {aiSuggestedMarkers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {aiSuggestedMarkers.length} Sugestão{aiSuggestedMarkers.length !== 1 ? 'ões' : ''} da IA
                </span>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="h-6 p-1 text-amber-600"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showAISuggestions ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            {showAISuggestions && (
              <div className="space-y-1">
                {aiSuggestedMarkers.map(marker => (
                  <div key={marker.id} className="text-xs text-amber-700 flex items-center justify-between">
                    <span>{CATEGORY_ICONS[marker.category]} {marker.title}</span>
                    <span className="text-amber-600">{Math.round(marker.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleSuggestMarkers}
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            IA Sugerir
          </Button>
          <Button 
            onClick={exportMarkers}
            size="sm"
            variant="outline"
            disabled={totalMarkers === 0}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 animate-pulse text-primary" />
              <span className="text-sm">Analisando área com IA...</span>
            </div>
            <Progress value={75} className="w-full" />
          </div>
        )}

        <Separator />

        {/* Display Settings */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Clustering */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Layers className="w-3 h-3" />
                  <span>Agrupamento</span>
                </Label>
                <Switch
                  checked={enableClustering}
                  onCheckedChange={setEnableClustering}
                />
              </div>
              
              {enableClustering && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Distância de Agrupamento: {clusteringDistance}m
                  </Label>
                  <Slider
                    value={[clusteringDistance]}
                    onValueChange={(value) => setClusteringDistance(value[0])}
                    min={50}
                    max={500}
                    step={25}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Contextual Filter */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span>Filtro Sazonal</span>
              </Label>
              <Switch
                checked={contextualFilter}
                onCheckedChange={setContextualFilter}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(activeCategories).length}/{Object.keys(CATEGORY_ICONS).length}
                </Badge>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Category Filters */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Categorias</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_ICONS) as SmartMarkerCategory[]).map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={activeCategories.has(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label htmlFor={category} className="text-xs flex items-center space-x-1 flex-1">
                      <span>{CATEGORY_ICONS[category]}</span>
                      <span className="truncate">{category.replace('_', ' ')}</span>
                      <Badge variant="outline" className="text-[10px] px-1">
                        {categoryStats[category]}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Priority Filters */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Prioridade</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['critical', 'high', 'medium', 'low'] as SmartMarkerData['priority'][]).map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={priority}
                      checked={priorityFilter.includes(priority)}
                      onCheckedChange={() => handlePriorityToggle(priority)}
                    />
                    <Label htmlFor={priority} className="text-xs flex items-center space-x-1 flex-1">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority]}`} />
                      <span>{PRIORITY_LABELS[priority]}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Markers List */}
        {totalMarkers > 0 && (
          <>
            <Separator />
            
            <Collapsible open={showMarkersList} onOpenChange={setShowMarkersList}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Marcadores ({visibleMarkers}/{totalMarkers})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMarkersList ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {markers
                    .filter(m => activeCategories.has(m.category) && priorityFilter.includes(m.priority))
                    .slice(0, 20) // Limit to 20 for performance
                    .map((marker) => (
                    <div
                      key={marker.id}
                      className={`p-2 rounded-lg border-l-4 ${
                        marker.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        marker.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        marker.priority === 'medium' ? 'border-blue-500 bg-blue-50' :
                        'border-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{CATEGORY_ICONS[marker.category]}</span>
                            <span className="text-sm font-medium truncate">{marker.title}</span>
                            {marker.aiSuggested && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Sugestão da IA" />
                            )}
                          </div>
                          {marker.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {marker.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span className={`px-1 py-0.5 rounded text-white ${PRIORITY_COLORS[marker.priority]}`}>
                              {PRIORITY_LABELS[marker.priority]}
                            </span>
                            <span>{marker.category.replace('_', ' ')}</span>
                            {marker.aiSuggested && (
                              <span className="text-yellow-600">
                                {Math.round(marker.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMarker(marker.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {markers.length > 20 && (
                    <div className="text-xs text-center text-muted-foreground py-2">
                      E mais {markers.length - 20} marcadores...
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Stats Summary */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">{totalMarkers}</span>
            </div>
            <div className="flex justify-between">
              <span>Visíveis:</span>
              <span className="font-medium">{visibleMarkers}</span>
            </div>
            {enableClustering && (
              <div className="flex justify-between">
                <span>Agrupamentos:</span>
                <span className="font-medium">{clusters.length}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Críticos:</span>
              <span className={`font-medium ${criticalMarkers.length > 0 ? 'text-red-600' : ''}`}>
                {criticalMarkers.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IA:</span>
              <span className={`font-medium ${aiSuggestedMarkers.length > 0 ? 'text-amber-600' : ''}`}>
                {aiSuggestedMarkers.length}
              </span>
            </div>
            {contextualFilter && (
              <div className="flex justify-between">
                <span>Sazonais:</span>
                <span className="font-medium">{seasonalMarkers.length}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};