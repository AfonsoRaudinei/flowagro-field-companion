import React from 'react';
import { ArrowLeft, RefreshCw, Search, FileText, Database, CheckCircle, AlertTriangle, XCircle, ExternalLink, FolderOpen, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuditoria } from '@/hooks/useAuditoria';

const QAAuditoria = () => {
  const navigate = useNavigate();
  const { 
    auditData, 
    isLoading, 
    runAudit, 
    openRoute, 
    openFolder, 
    exportReport 
  } = useAuditoria();

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Auditoria do Projeto</h1>
            <p className="text-sm text-muted-foreground">Ferramentas QA</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Banner Informativo */}
      <Alert className="mx-4 mt-4 border-blue-200 bg-blue-50">
        <AlertDescription className="text-sm text-blue-700">
          Arquivos marcados como órfãos podem ser usados futuramente
        </AlertDescription>
      </Alert>

      {/* Cards de Status */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className={`${getStatusColor(auditData?.routes.status || 'warning')} border`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Rotas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{auditData?.routes.count || 0}</div>
              <div className="flex items-center gap-1 mt-1">
                {getStatusIcon(auditData?.routes.status || 'warning')}
                <span className="text-xs text-muted-foreground">órfãs encontradas</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getStatusColor(auditData?.files.status || 'warning')} border`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{auditData?.files.count || 0}</div>
              <div className="flex items-center gap-1 mt-1">
                {getStatusIcon(auditData?.files.status || 'warning')}
                <span className="text-xs text-muted-foreground">duplicados</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getStatusColor(auditData?.assets.status || 'warning')} border`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Assets/Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{auditData?.assets.count || 0}</div>
              <div className="flex items-center gap-1 mt-1">
                {getStatusIcon(auditData?.assets.status || 'warning')}
                <span className="text-xs text-muted-foreground">problemas CSV</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getStatusColor(auditData?.build.status || 'warning')} border`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Build
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{auditData?.build.count || 0}</div>
              <div className="flex items-center gap-1 mt-1">
                {getStatusIcon(auditData?.build.status || 'warning')}
                <span className="text-xs text-muted-foreground">erros/avisos</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seções Detalhadas */}
      <div className="px-4 space-y-6">
        {/* Órfãos */}
        <div>
          <h3 className="text-base font-semibold mb-3">Órfãos</h3>
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Caminho</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.orphans?.map((orphan, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-mono">{orphan.path}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">órfão</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openFolder(orphan.path)}
                        >
                          <FolderOpen className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-4">
                      Nenhum arquivo órfão encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Duplicados */}
        <div>
          <h3 className="text-base font-semibold mb-3">Duplicados</h3>
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Caminho</TableHead>
                  <TableHead className="text-xs">Hash MD5</TableHead>
                  <TableHead className="text-xs w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.duplicates?.map((duplicate, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-mono">{duplicate.path}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {duplicate.hash.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openFolder(duplicate.path)}
                        >
                          <FolderOpen className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-4">
                      Nenhum arquivo duplicado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* CSV Issues */}
        <div>
          <h3 className="text-base font-semibold mb-3">CSV Issues</h3>
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nome CSV</TableHead>
                  <TableHead className="text-xs">Problema</TableHead>
                  <TableHead className="text-xs w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.csvIssues?.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-mono">{issue.file}</TableCell>
                    <TableCell className="text-xs">
                      <Badge 
                        variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {issue.problem}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openFolder(issue.file)}
                        >
                          <FolderOpen className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-4">
                      Todos os CSVs estão corretos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Espaçamento para o botão flutuante */}
        <div className="h-20" />
      </div>

      {/* Botão Re-testar Flutuante */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={runAudit}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-medium shadow-lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Re-testar
            </>
          )}
        </Button>
      </div>

      {/* Rodapé com ajuda */}
      <div className="px-4 py-8 text-center">
        <Button
          variant="link"
          className="text-sm text-muted-foreground"
          onClick={exportReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar relatório
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Como esta auditoria funciona?
        </p>
        <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
          Verifica rotas órfãs, arquivos duplicados, CSVs obrigatórios e validações de build para garantir a qualidade do projeto.
        </p>
      </div>
    </div>
  );
};

export default QAAuditoria;