import React, { useState, useMemo } from "react";
import { Calendar, TrendingUp, BarChart3, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { format, subMonths, subDays, differenceInDays } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Mock data para histórico NDVI
const generateNDVIHistory = (startDate: Date, endDate: Date) => {
  const days = differenceInDays(endDate, startDate);
  const data = [];
  
  for (let i = 0; i <= days; i += 7) { // Dados semanais
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Simulação de variação sazonal
    const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
    const seasonalFactor = 0.3 * Math.sin((dayOfYear / 365) * 2 * Math.PI) + 0.7;
    
    const baseNDVI = 0.6 + (Math.random() - 0.5) * 0.3;
    const ndvi = Math.max(0.1, Math.min(0.9, baseNDVI * seasonalFactor));
    
    data.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      dateLabel: format(currentDate, 'dd/MM'),
      ndvi: parseFloat(ndvi.toFixed(3)),
      health: ndvi > 0.6 ? 'Alta' : ndvi > 0.4 ? 'Média' : 'Baixa',
      rainfall: Math.random() * 50, // mm simulados
      temperature: 20 + Math.random() * 15, // °C simulados
    });
  }
  
  return data;
};

const NDVIHistory: React.FC = () => {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  
  const [analysisType, setAnalysisType] = useState<'trend' | 'seasonal' | 'comparison'>('trend');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [isLoading, setIsLoading] = useState(false);

  // Gerar dados históricos baseado no período selecionado
  const historyData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    return generateNDVIHistory(dateRange.from, dateRange.to);
  }, [dateRange]);

  // Análise estatística dos dados
  const statistics = useMemo(() => {
    if (historyData.length === 0) return null;
    
    const ndviValues = historyData.map(d => d.ndvi);
    const avgNDVI = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const maxNDVI = Math.max(...ndviValues);
    const minNDVI = Math.min(...ndviValues);
    
    // Calcular tendência (regressão linear simples)
    const n = historyData.length;
    const sumX = historyData.reduce((sum, _, i) => sum + i, 0);
    const sumY = ndviValues.reduce((sum, val) => sum + val, 0);
    const sumXY = historyData.reduce((sum, data, i) => sum + i * data.ndvi, 0);
    const sumXX = historyData.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trend = slope > 0.001 ? 'Crescimento' : slope < -0.001 ? 'Declínio' : 'Estável';
    
    return {
      avg: avgNDVI,
      max: maxNDVI,
      min: minNDVI,
      trend,
      slope: slope * 100, // Percentual
      dataPoints: n
    };
  }, [historyData]);

  // Análise sazonal
  const seasonalAnalysis = useMemo(() => {
    const seasons = {
      'Verão': historyData.filter(d => {
        const month = new Date(d.date).getMonth();
        return month === 11 || month <= 1; // Dez, Jan, Fev
      }),
      'Outono': historyData.filter(d => {
        const month = new Date(d.date).getMonth();
        return month >= 2 && month <= 4; // Mar, Abr, Mai
      }),
      'Inverno': historyData.filter(d => {
        const month = new Date(d.date).getMonth();
        return month >= 5 && month <= 7; // Jun, Jul, Ago
      }),
      'Primavera': historyData.filter(d => {
        const month = new Date(d.date).getMonth();
        return month >= 8 && month <= 10; // Set, Out, Nov
      })
    };

    return Object.entries(seasons).map(([season, data]) => ({
      season,
      avgNDVI: data.length > 0 ? data.reduce((sum, d) => sum + d.ndvi, 0) / data.length : 0,
      count: data.length
    })).filter(s => s.count > 0);
  }, [historyData]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Dados atualizados",
      description: "Histórico NDVI foi atualizado com sucesso",
    });
  };

  const handleExport = () => {
    const csvContent = [
      'Data,NDVI,Saúde da Vegetação,Chuva (mm),Temperatura (°C)',
      ...historyData.map(d => 
        `${d.date},${d.ndvi},${d.health},${d.rainfall.toFixed(1)},${d.temperature.toFixed(1)}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ndvi-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação concluída",
      description: "Histórico NDVI exportado para CSV",
    });
  };

  const renderChart = () => {
    const commonProps = {
      data: historyData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="dateLabel" 
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              domain={[0, 1]}
              className="text-xs text-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(value: number) => [value.toFixed(3), 'NDVI']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="ndvi" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="dateLabel" 
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              domain={[0, 1]}
              className="text-xs text-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(value: number) => [value.toFixed(3), 'NDVI']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="ndvi" fill="hsl(var(--primary))" />
          </BarChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="dateLabel" 
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              domain={[0, 1]}
              className="text-xs text-muted-foreground"
            />
            <Tooltip 
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(value: number) => [value.toFixed(3), 'NDVI']}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="ndvi" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico NDVI - Análise Temporal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(range) => range && range.from && range.to && setDateRange({from: range.from, to: range.to})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Análise</label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trend">Tendência</SelectItem>
                  <SelectItem value="seasonal">Sazonal</SelectItem>
                  <SelectItem value="comparison">Comparação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Gráfico</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linha</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="bar">Barras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {statistics.avg.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">NDVI Médio</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statistics.max.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">NDVI Máximo</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.min.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">NDVI Mínimo</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    statistics.trend === 'Crescimento' ? 'default' : 
                    statistics.trend === 'Declínio' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {statistics.trend}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Tendência</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {statistics.slope > 0 ? '+' : ''}{statistics.slope.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Taxa de Variação</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {statistics.dataPoints}
              </div>
              <p className="text-xs text-muted-foreground">Pontos de Dados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Evolução do NDVI ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise Sazonal */}
      {analysisType === 'seasonal' && seasonalAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Sazonal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {seasonalAnalysis.map((season, index) => (
                <Card key={season.season}>
                  <CardContent className="pt-6">
                    <div className="text-xl font-semibold text-primary">
                      {season.avgNDVI.toFixed(3)}
                    </div>
                    <p className="text-sm font-medium">{season.season}</p>
                    <p className="text-xs text-muted-foreground">
                      {season.count} medições
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="season" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip 
                    formatter={(value: number) => [value.toFixed(3), 'NDVI Médio']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="avgNDVI" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NDVIHistory;