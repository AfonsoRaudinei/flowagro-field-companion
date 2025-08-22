import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Shield, 
  Zap, 
  HardDrive, 
  Wifi, 
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getSystemHealth, 
  getLastHealthResults, 
  type SystemHealth, 
  type HealthCheckResult, 
  type HealthStatus 
} from '@/lib/healthCheck';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

const getStatusIcon = (status: HealthStatus) => {
  switch (status) {
    case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: HealthStatus) => {
  switch (status) {
    case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const ServiceIcon = ({ service }: { service: string }) => {
  switch (service) {
    case 'database': return <Database className="h-4 w-4" />;
    case 'authentication': return <Shield className="h-4 w-4" />;
    case 'performance': return <Zap className="h-4 w-4" />;
    case 'memory': return <HardDrive className="h-4 w-4" />;
    case 'network': return <Wifi className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

export function SystemHealthDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshHealth = async () => {
    setIsLoading(true);
    try {
      const health = await getSystemHealth();
      setSystemHealth(health);
      logger.debug('System health refreshed', { health: health.overall });
    } catch (error) {
      logger.error('Failed to refresh system health', { error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    refreshHealth();

    // Auto refresh every 30 seconds
    const interval = autoRefresh ? setInterval(refreshHealth, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const exportHealthData = () => {
    const data = {
      systemHealth,
      metrics: metrics.getMetricsSummary(),
      logs: logger.getLogs({ since: new Date(Date.now() - 60 * 60 * 1000) }) // Last hour
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-health-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!systemHealth) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando dados de saúde do sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">System Health Dashboard</h2>
          <Badge className={getStatusColor(systemHealth.overall)}>
            {getStatusIcon(systemHealth.overall)}
            <span className="ml-1 capitalize">{systemHealth.overall}</span>
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshHealth} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportHealthData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="text-2xl font-bold">{systemHealth.summary.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{systemHealth.summary.healthy}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{systemHealth.summary.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{systemHealth.summary.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Health Score</span>
              <span>{Math.round((systemHealth.summary.healthy / systemHealth.summary.total) * 100)}%</span>
            </div>
            <Progress 
              value={(systemHealth.summary.healthy / systemHealth.summary.total) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {systemHealth.services.map((service) => (
              <ServiceHealthCard key={service.service} service={service} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <MetricsPanel />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <LogsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ServiceHealthCard({ service }: { service: HealthCheckResult }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(service.status).replace('text-', 'text-').replace('border-', 'border-')}`}>
              <ServiceIcon service={service.service} />
            </div>
            <div>
              <h3 className="font-semibold capitalize">{service.service}</h3>
              <p className="text-sm text-muted-foreground">{service.message}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(service.status)}
              <span className="text-sm capitalize">{service.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">{service.responseTime}ms</p>
          </div>
        </div>
        
        {service.metadata && (
          <div className="mt-3 p-2 bg-muted rounded text-xs">
            <pre>{JSON.stringify(service.metadata, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricsPanel() {
  const [metricsData, setMetricsData] = useState<any>(null);

  useEffect(() => {
    const data = metrics.getMetricsSummary();
    setMetricsData(data);
  }, []);

  if (!metricsData) return <div>Loading metrics...</div>;

  return (
    <div className="grid gap-4">
      {Object.entries(metricsData).map(([name, data]: [string, any]) => (
        <Card key={name}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{name}</h3>
              <Badge variant="outline">{data.unit}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Count</p>
                <p className="font-mono">{data.count}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average</p>
                <p className="font-mono">{Math.round(data.avg * 100) / 100}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Min</p>
                <p className="font-mono">{Math.round(data.min * 100) / 100}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max</p>
                <p className="font-mono">{Math.round(data.max * 100) / 100}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const recentLogs = logger.getLogs({ since: new Date(Date.now() - 30 * 60 * 1000) }); // Last 30 minutes
    setLogs(recentLogs.slice(0, 50)); // Show only last 50 logs
  }, []);

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(filter.toLowerCase()) ||
    log.level.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button variant="outline" size="sm" onClick={() => setLogs(logger.getLogs({ since: new Date(Date.now() - 30 * 60 * 1000) }).slice(0, 50))}>
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.map((log, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-3">
              <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'default'}>
                {log.level}
              </Badge>
              <div className="flex-1">
                <p className="text-sm">{log.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </p>
                {log.context && (
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer">Context</summary>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}