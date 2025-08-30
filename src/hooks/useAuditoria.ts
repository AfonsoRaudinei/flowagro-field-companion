import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AuditResult {
  routes: {
    count: number;
    status: 'success' | 'warning' | 'error';
  };
  files: {
    count: number;
    status: 'success' | 'warning' | 'error';
  };
  assets: {
    count: number;
    status: 'success' | 'warning' | 'error';
  };
  build: {
    count: number;
    status: 'success' | 'warning' | 'error';
  };
  orphans: Array<{
    path: string;
    type: string;
  }>;
  duplicates: Array<{
    path: string;
    hash: string;
  }>;
  csvIssues: Array<{
    file: string;
    problem: string;
    severity: 'error' | 'warning';
    tip?: string;
  }>;
}

const mockAuditData: AuditResult = {
  routes: { count: 0, status: 'success' },
  files: { count: 0, status: 'success' },
  assets: { count: 0, status: 'success' },
  build: { count: 0, status: 'success' },
  orphans: [],
  duplicates: [],
  csvIssues: []
};

export const useAuditoria = () => {
  const [auditData, setAuditData] = useState<AuditResult>(mockAuditData);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runAudit = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simular execução da auditoria
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock de dados simulados para demonstração
      const newAuditData: AuditResult = {
        routes: { 
          count: Math.floor(Math.random() * 3), 
          status: Math.random() > 0.7 ? 'warning' : 'success' 
        },
        files: { 
          count: Math.floor(Math.random() * 5), 
          status: Math.random() > 0.8 ? 'warning' : 'success' 
        },
        assets: { 
          count: Math.floor(Math.random() * 2), 
          status: Math.random() > 0.9 ? 'error' : 'success' 
        },
        build: { 
          count: Math.floor(Math.random() * 4), 
          status: Math.random() > 0.6 ? 'warning' : 'success' 
        },
        orphans: [
          { path: 'src/components/unused/OldComponent.tsx', type: 'component' },
          { path: 'src/utils/deprecatedHelper.ts', type: 'utility' }
        ].slice(0, Math.floor(Math.random() * 3)),
        duplicates: [
          { path: 'src/assets/image1.png', hash: 'a1b2c3d4e5f6g7h8' },
          { path: 'public/images/copy.png', hash: 'a1b2c3d4e5f6g7h8' }
        ].slice(0, Math.floor(Math.random() * 3)),
        csvIssues: [
          { 
            file: 'por_autor_extracao_exportacao.csv', 
            problem: 'Cabeçalho ausente', 
            severity: 'error' as const 
          },
          { 
            file: 'lista_cultivares.csv', 
            problem: 'Poucos registros', 
            severity: 'warning' as const 
          }
        ].slice(0, Math.floor(Math.random() * 3))
      };
      
      setAuditData(newAuditData);
      
      toast({
        title: "Auditoria concluída",
        description: "Verificação de qualidade executada com sucesso",
      });
      
    } catch (error) {
      toast({
        title: "Erro na auditoria",
        description: "Não foi possível executar a verificação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const openRoute = useCallback((route: string) => {
    toast({
      title: "Abrir rota",
      description: `Navegando para: ${route}`,
    });
  }, [toast]);

  const openFolder = useCallback((path: string) => {
    toast({
      title: "Abrir pasta",
      description: `Visualizando: ${path}`,
    });
  }, [toast]);

  const exportReport = useCallback(() => {
    const reportData = {
      timestamp: new Date().toISOString(),
      audit: auditData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-flowagro-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Relatório exportado",
      description: "Arquivo JSON salvo com sucesso",
    });
  }, [auditData, toast]);

  return {
    auditData,
    isLoading,
    runAudit,
    openRoute,
    openFolder,
    exportReport
  };
};