import React, { useRef } from 'react';
import { ArrowLeft, RefreshCw, Search, FileText, Database, CheckCircle, AlertTriangle, XCircle, FolderOpen, Download, Sparkles, Zap, Code, Layout, Trash2, Terminal } from 'lucide-react';
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
    exportReport,
    searchUpdates
  } = useAuditoria();

  // Refs for scrolling to sections
  const orphansRef = useRef<HTMLDivElement>(null);
  const duplicatesRef = useRef<HTMLDivElement>(null);
  const csvRef = useRef<HTMLDivElement>(null);
  const buildRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getImprovementIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'ui': return <Layout className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'imports': return <Trash2 className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
          <Card 
            className={`${getStatusColor(auditData?.routes.status || 'warning')} border cursor-pointer transition-transform hover:scale-105`}
            onClick={() => scrollToSection(orphansRef)}
          >
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

          <Card 
            className={`${getStatusColor(auditData?.files.status || 'warning')} border cursor-pointer transition-transform hover:scale-105`}
            onClick={() => scrollToSection(duplicatesRef)}
          >
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

          <Card 
            className={`${getStatusColor(auditData?.assets.status || 'warning')} border cursor-pointer transition-transform hover:scale-105`}
            onClick={() => scrollToSection(csvRef)}
          >
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

          <Card 
            className={`${getStatusColor(auditData?.build.status || 'warning')} border cursor-pointer transition-transform hover:scale-105`}
            onClick={() => scrollToSection(buildRef)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4" />
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

      {/* Atualizações Disponíveis */}
      <div className="px-4 mb-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Atualizações disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {auditData?.improvements?.length > 0 ? (
              <>
                {auditData.improvements.slice(0, 3).map((improvement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getImprovementIcon(improvement.category)}
                      <div>
                        <p className="text-sm font-medium">{improvement.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getImpactColor(improvement.impact)}`}>
                            {improvement.impact}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {improvement.effort} • {improvement.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={searchUpdates}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Buscar Atualizações no Lovable
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma atualização disponível</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={searchUpdates}
                >
                  Verificar atualizações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seções Detalhadas */}
      <div className="px-4 space-y-6">
        {/* Órfãos */}
        <div ref={orphansRef}>
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
        <div ref={duplicatesRef}>
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
        <div ref={csvRef}>
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

        <Separator />

        {/* Build Errors/Warnings */}
        <div ref={buildRef}>
          <h3 className="text-base font-semibold mb-3">Build Errors/Warnings</h3>
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Arquivo</TableHead>
                  <TableHead className="text-xs">Mensagem</TableHead>
                  <TableHead className="text-xs w-20">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.buildIssues?.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-mono">
                      {issue.file}
                      {issue.line && <span className="text-muted-foreground">:{issue.line}</span>}
                    </TableCell>
                    <TableCell className="text-xs">{issue.message}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {issue.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-4">
                      Build sem erros ou avisos
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

      {/* Rodapé fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            className="flex-1 mr-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={runAudit}
            disabled={isLoading}
            className="flex-1 ml-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-testar Auditoria
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Espaçamento para o rodapé fixo */}
      <div className="h-20" />
    </div>
  );
};

export default QAAuditoria;