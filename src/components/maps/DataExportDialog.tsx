import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useMapPins } from '@/hooks/useMapPins';
import { DataExporter } from '@/lib/dataExport';
import { NDVIStats, NDVITimeSeriesData } from './NDVIAnalysis';
import { 
  Download, 
  FileText, 
  Map,
  Leaf,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DataExportDialogProps {
  open: boolean;
  onClose: () => void;
  ndviStats?: NDVIStats | null;
  ndviTimeSeries?: NDVITimeSeriesData[];
}

type ExportFormat = 'csv' | 'geojson' | 'json';
type DataType = 'pins' | 'ndvi' | 'both';

export const DataExportDialog: React.FC<DataExportDialogProps> = ({
  open,
  onClose,
  ndviStats = null,
  ndviTimeSeries = []
}) => {
  const { allPins } = useMapPins();
  const [dataType, setDataType] = useState<DataType>('pins');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [dateFormat, setDateFormat] = useState<'iso' | 'locale'>('locale');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const getAvailableFormats = (): ExportFormat[] => {
    switch (dataType) {
      case 'pins':
        return ['csv', 'geojson', 'json'];
      case 'ndvi':
        return ['csv', 'json'];
      case 'both':
        return ['csv', 'json'];
      default:
        return ['csv'];
    }
  };

  const getDataTypeLabel = (type: DataType): string => {
    switch (type) {
      case 'pins':
        return 'Pins do Mapa';
      case 'ndvi':
        return 'Dados NDVI';
      case 'both':
        return 'Pins + NDVI';
      default:
        return type;
    }
  };

  const getFormatLabel = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'csv':
        return 'CSV (Planilha)';
      case 'geojson':
        return 'GeoJSON (SIG)';
      case 'json':
        return 'JSON (Dados)';
      default:
        return 'Unknown Format';
    }
  };

  const getEstimatedSize = (): string => {
    const pinsSize = allPins.length * 0.2; // ~0.2KB per pin
    const ndviSize = ndviTimeSeries.length * 0.1 + (ndviStats ? 0.5 : 0); // ~0.1KB per time point + stats
    
    let totalSize = 0;
    if (dataType === 'pins' || dataType === 'both') totalSize += pinsSize;
    if (dataType === 'ndvi' || dataType === 'both') totalSize += ndviSize;
    
    if (totalSize < 1) return `${Math.round(totalSize * 1000)} bytes`;
    return `${totalSize.toFixed(1)} KB`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      let content = '';
      let filename = '';

      if (dataType === 'pins') {
        content = DataExporter.exportPins(allPins, {
          format,
          includeMetadata,
          dateFormat
        });
        filename = DataExporter.generateFilename('flowagro_pins', format);
      } else if (dataType === 'ndvi') {
        content = DataExporter.exportNDVIData(ndviStats, ndviTimeSeries, {
          format: format as 'csv' | 'json',
          includeMetadata,
          dateFormat
        });
        filename = DataExporter.generateFilename('flowagro_ndvi', format);
      } else if (dataType === 'both') {
        // Combined export
        if (format === 'json') {
          const combinedData = {
            metadata: includeMetadata ? {
              title: 'FlowAgro Complete Data Export',
              exportDate: new Date().toISOString(),
              pins: { count: allPins.length },
              ndvi: { hasStats: !!ndviStats, timeSeriesPoints: ndviTimeSeries.length }
            } : undefined,
            pins: allPins,
            ndvi: {
              statistics: ndviStats,
              timeSeries: ndviTimeSeries
            }
          };
          content = JSON.stringify(combinedData, null, 2);
        } else {
          // CSV format - combine both datasets
          const pinsCSV = DataExporter.exportPins(allPins, {
            format: 'csv',
            includeMetadata: false,
            dateFormat
          });
          const ndviCSV = DataExporter.exportNDVIData(ndviStats, ndviTimeSeries, {
            format: 'csv',
            includeMetadata: false,
            dateFormat
          });
          
          content = [
            includeMetadata ? `# FlowAgro Complete Data Export\n# Export Date: ${new Date().toLocaleString('pt-BR')}\n` : '',
            'PINS DATA\n',
            pinsCSV,
            '\n\nNDVI DATA\n',
            ndviCSV
          ].join('');
        }
        filename = DataExporter.generateFilename('flowagro_complete', format);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Small delay to show 100% progress
      setTimeout(() => {
        DataExporter.downloadFile(
          content, 
          filename, 
          DataExporter.getMimeType(format)
        );
        
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const canExport = () => {
    if (dataType === 'pins' && allPins.length === 0) return false;
    if (dataType === 'ndvi' && !ndviStats && ndviTimeSeries.length === 0) return false;
    if (dataType === 'both' && allPins.length === 0 && !ndviStats && ndviTimeSeries.length === 0) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exportar Dados</span>
          </DialogTitle>
          <DialogDescription>
            Exporte seus dados em diferentes formatos para análise externa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Dados</Label>
            <RadioGroup value={dataType} onValueChange={(value: DataType) => setDataType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pins" id="pins" />
                <Label htmlFor="pins" className="flex items-center space-x-2 flex-1">
                  <Map className="w-4 h-4" />
                  <span>Pins do Mapa</span>
                  <Badge variant="outline">{allPins.length}</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ndvi" id="ndvi" />
                <Label htmlFor="ndvi" className="flex items-center space-x-2 flex-1">
                  <Leaf className="w-4 h-4" />
                  <span>Análise NDVI</span>
                  <Badge variant="outline">
                    {ndviStats ? 'Stats' : 'Sem dados'} + {ndviTimeSeries.length} pts
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="flex items-center space-x-2 flex-1">
                  <FileText className="w-4 h-4" />
                  <span>Dados Completos</span>
                  <Badge variant="outline">Tudo</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              {getAvailableFormats().map(fmt => (
                <div key={fmt} className="flex items-center space-x-2">
                  <RadioGroupItem value={fmt} id={fmt} />
                  <Label htmlFor={fmt} className="flex-1">
                    {getFormatLabel(fmt)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Opções</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
              />
              <Label htmlFor="metadata" className="text-sm">
                Incluir metadados
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Formato de Data</Label>
              <RadioGroup value={dateFormat} onValueChange={(value: 'iso' | 'locale') => setDateFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="locale" id="locale" />
                  <Label htmlFor="locale" className="text-sm">Brasileiro (DD/MM/AAAA)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="iso" id="iso" />
                  <Label htmlFor="iso" className="text-sm">ISO 8601 (AAAA-MM-DD)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Export Info */}
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dados:</span>
                  <span className="font-medium">{getDataTypeLabel(dataType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <span className="font-medium">{getFormatLabel(format)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho estimado:</span>
                  <span className="font-medium">{getEstimatedSize()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-sm">Preparando exportação...</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              className="flex-1"
              disabled={!canExport() || isExporting}
            >
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>

          {!canExport() && !isExporting && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Nenhum dado disponível para exportação
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};