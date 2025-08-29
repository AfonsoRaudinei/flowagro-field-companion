import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useNDVILayer } from '@/hooks/useNDVILayer';
import { DataExportDialog } from './DataExportDialog';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Download,
  Calculator,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Clock,
  Map
} from 'lucide-react';

export interface NDVIStats {
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  median: number;
  area: number;
  healthyVegetation: number;
  moderateVegetation: number;
  poorVegetation: number;
  bareGround: number;
}

export interface NDVITimeSeriesData {
  date: string;
  ndvi: number;
  temperature?: number;
  precipitation?: number;
}

export const NDVIAnalysis: React.FC = () => {
  const { map, isReady } = useMapInstance();
  const { config } = useNDVILayer();
  const [stats, setStats] = useState<NDVIStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<NDVITimeSeriesData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Generate sample NDVI data for demonstration
  const generateSampleData = useMemo(() => {
    const sampleStats: NDVIStats = {
      mean: 0.65,
      min: -0.2,
      max: 0.92,
      stdDev: 0.18,
      median: 0.68,
      area: 450.5, // hectares
      healthyVegetation: 78.5, // percentage
      moderateVegetation: 15.2,
      poorVegetation: 4.8,
      bareGround: 1.5
    };

    const sampleTimeSeries: NDVITimeSeriesData[] = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - 11 + i);
      return {
        date: date.toISOString().split('T')[0],
        ndvi: 0.4 + Math.random() * 0.4 + Math.sin(i * Math.PI / 6) * 0.2,
        temperature: 20 + Math.random() * 15 + Math.sin(i * Math.PI / 6) * 10,
        precipitation: Math.random() * 100
      };
    });

    return { sampleStats, sampleTimeSeries };
  }, []);

  const analyzeNDVI = async () => {
    if (!map || !isReady) return;

    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would analyze the NDVI data from the map layer
    setStats(generateSampleData.sampleStats);
    setTimeSeries(generateSampleData.sampleTimeSeries);
    
    setIsAnalyzing(false);
  };

  // Chart data preparation
  const vegetationDistribution = useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: 'Vegetação Saudável', value: stats.healthyVegetation, color: '#22c55e' },
      { name: 'Vegetação Moderada', value: stats.moderateVegetation, color: '#eab308' },
      { name: 'Vegetação Pobre', value: stats.poorVegetation, color: '#f97316' },
      { name: 'Solo Descoberto', value: stats.bareGround, color: '#6b7280' }
    ];
  }, [stats]);

  const timeSeriesChart = useMemo(() => {
    return timeSeries.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      ndvi: Math.round(item.ndvi * 100) / 100
    }));
  }, [timeSeries]);

  const getHealthStatus = (mean: number) => {
    if (mean >= 0.7) return { status: 'Excelente', color: 'text-green-600', icon: CheckCircle };
    if (mean >= 0.5) return { status: 'Bom', color: 'text-yellow-600', icon: CheckCircle };
    if (mean >= 0.3) return { status: 'Regular', color: 'text-orange-600', icon: AlertTriangle };
    return { status: 'Crítico', color: 'text-red-600', icon: AlertTriangle };
  };

  const exportReport = () => {
    if (!stats) return;

    const reportData = {
      title: 'Relatório de Análise NDVI',
      date: new Date().toLocaleDateString('pt-BR'),
      area: `${stats.area} hectares`,
      statistics: stats,
      timeSeries,
      summary: `Análise NDVI realizada em ${stats.area} hectares. NDVI médio de ${stats.mean.toFixed(3)} indica ${getHealthStatus(stats.mean).status.toLowerCase()} condições de vegetação.`
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ndvi-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Análise NDVI</span>
          </div>
          {stats && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Map className="w-3 h-3" />
              <span>{stats.area} ha</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Controls */}
        <div className="flex space-x-2">
          <Button 
            onClick={analyzeNDVI}
            className="flex-1"
            disabled={isAnalyzing || !config.visible}
          >
            {isAnalyzing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Analisar NDVI
              </>
            )}
          </Button>
          
          {stats && (
            <>
              <Button
                onClick={exportReport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                variant="secondary"
                size="sm"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={66} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              Processando dados satelitais...
            </p>
          </div>
        )}

        {!config.visible && (
          <div className="bg-muted/50 p-3 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Ative a camada NDVI para realizar análises
            </p>
          </div>
        )}

        {stats && (
          <Tabs defaultValue="statistics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="report">Relatório</TabsTrigger>
            </TabsList>

            <TabsContent value="statistics" className="space-y-4">
              {/* Health Status */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    <span className="font-medium">Status da Vegetação</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const { status, color, icon: Icon } = getHealthStatus(stats.mean);
                      return (
                        <>
                          <Icon className={`w-4 h-4 ${color}`} />
                          <Badge variant="outline" className={color}>
                            {status}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">NDVI Médio</p>
                  <p className="text-lg font-semibold text-primary">{stats.mean.toFixed(3)}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Desvio Padrão</p>
                  <p className="text-lg font-semibold">{stats.stdDev.toFixed(3)}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Mínimo</p>
                  <p className="text-lg font-semibold text-destructive">{stats.min.toFixed(3)}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Máximo</p>
                  <p className="text-lg font-semibold text-green-600">{stats.max.toFixed(3)}</p>
                </div>
              </div>

              {/* Coverage Distribution */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Distribuição da Cobertura</h4>
                {vegetationDistribution.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.value.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={item.value} 
                      className="h-2"
                      style={{ 
                        '--progress-background': item.color,
                      } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              {/* Time Series Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Evolução Temporal NDVI</span>
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        fontSize={10}
                        stroke="hsl(var(--muted-foreground))"
                        domain={[0, 1]}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ndvi" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />

              {/* Distribution Pie Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Distribuição por Categoria</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vegetationDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {vegetationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Relatório Executivo NDVI</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Período Analisado:</p>
                    <p>{config.dateRange.start} a {config.dateRange.end}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-muted-foreground">Área Total:</p>
                    <p>{stats.area} hectares</p>
                  </div>

                  <div>
                    <p className="font-medium text-muted-foreground">Resumo Executivo:</p>
                    <p className="text-justify">
                      A análise NDVI da área monitorada indica um NDVI médio de {stats.mean.toFixed(3)}, 
                      classificado como {getHealthStatus(stats.mean).status.toLowerCase()}. A distribuição 
                      da cobertura vegetal mostra {stats.healthyVegetation.toFixed(1)}% de vegetação saudável, 
                      {stats.moderateVegetation.toFixed(1)}% de vegetação moderada, e {stats.poorVegetation.toFixed(1)}% 
                      de vegetação em condições pobres. Apenas {stats.bareGround.toFixed(1)}% da área apresenta 
                      solo descoberto.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-muted-foreground">Recomendações:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {stats.mean >= 0.7 ? (
                        <>
                          <li>Manter práticas atuais de manejo</li>
                          <li>Monitorar continuamente para detecção precoce de mudanças</li>
                        </>
                      ) : stats.mean >= 0.5 ? (
                        <>
                          <li>Considerar otimização da irrigação</li>
                          <li>Avaliar necessidade de fertilização</li>
                          <li>Monitorar pragas e doenças</li>
                        </>
                      ) : (
                        <>
                          <li>Intervenção urgente necessária</li>
                          <li>Investigar causas do baixo vigor vegetal</li>
                          <li>Implementar plano de recuperação</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <Button onClick={exportReport} className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Relatório Completo
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Export Dialog */}
        <DataExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          ndviStats={stats}
          ndviTimeSeries={timeSeries}
        />
      </CardContent>
    </Card>
  );
};