import React, { useState, useEffect, useMemo } from "react";
import { Calendar, TrendingUp, BarChart3, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface NDVIHistoryData {
  date: string;
  ndvi: number;
  temperature: number;
  precipitation: number;
}

interface SeasonalData {
  season: string;
  avgNdvi: number;
  maxNdvi: number;
  minNdvi: number;
}

export const NDVIHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("12m");
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [data, setData] = useState<NDVIHistoryData[]>([]);

  // Generate sample historical data
  const sampleData = useMemo(() => {
    const months = 12;
    return Array.from({ length: months }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        ndvi: 0.3 + Math.random() * 0.5 + Math.sin(i * Math.PI / 6) * 0.2,
        temperature: 20 + Math.random() * 15 + Math.sin(i * Math.PI / 6) * 10,
        precipitation: Math.random() * 100
      };
    });
  }, []);

  const seasonalAnalysis: SeasonalData[] = useMemo(() => [
    { season: 'Verão', avgNdvi: 0.75, maxNdvi: 0.92, minNdvi: 0.58 },
    { season: 'Outono', avgNdvi: 0.62, maxNdvi: 0.78, minNdvi: 0.45 },
    { season: 'Inverno', avgNdvi: 0.48, maxNdvi: 0.65, minNdvi: 0.32 },
    { season: 'Primavera', avgNdvi: 0.68, maxNdvi: 0.85, minNdvi: 0.52 }
  ], []);

  useEffect(() => {
    setData(sampleData);
  }, [sampleData]);

  const refreshData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(sampleData);
    setLoading(false);
  };

  const exportData = () => {
    const exportData = {
      historicalData: data,
      seasonalAnalysis,
      metadata: {
        dateRange,
        chartType,
        exportDate: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ndvi-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Histórico NDVI</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={exportData} variant="secondary" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex space-x-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="12m">12 meses</SelectItem>
                <SelectItem value="24m">24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Gráfico</label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="bar">Barras</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="historical" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historical">Histórico</TabsTrigger>
            <TabsTrigger value="seasonal">Análise Sazonal</TabsTrigger>
          </TabsList>

          <TabsContent value="historical" className="space-y-4">
            {/* Chart Placeholder */}
            <div className="bg-muted/50 p-8 rounded-xl text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-sm font-medium mb-2">Gráfico Temporariamente Indisponível</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Os dados históricos estão disponíveis na tabela abaixo
              </p>
            </div>

            {/* Data Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Dados Históricos NDVI</h4>
              <div className="border rounded-lg">
                <div className="grid grid-cols-4 gap-4 p-3 border-b bg-muted/50 text-xs font-medium">
                  <div>Data</div>
                  <div>NDVI</div>
                  <div>Temperatura (°C)</div>
                  <div>Precipitação (mm)</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {data.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 text-xs">
                      <div>{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      <div className="font-mono">{item.ndvi.toFixed(3)}</div>
                      <div className="font-mono">{item.temperature.toFixed(1)}</div>
                      <div className="font-mono">{item.precipitation.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Análise por Estação</span>
              </h4>
              
              <div className="bg-muted/50 p-4 rounded-xl text-center mb-4">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Análise sazonal indisponível</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {seasonalAnalysis.map((season, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{season.season}</h5>
                        <Badge variant="outline">{season.avgNdvi.toFixed(3)}</Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Máximo:</span>
                          <span className="font-mono text-green-600">{season.maxNdvi.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mínimo:</span>
                          <span className="font-mono text-red-600">{season.minNdvi.toFixed(3)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NDVIHistory;