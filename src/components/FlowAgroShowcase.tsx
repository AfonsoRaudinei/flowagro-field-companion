import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sprout, Droplets, Sun, AlertTriangle, CheckCircle, Info } from "lucide-react";

export const FlowAgroShowcase = () => {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Typography Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">FlowAgro Typography System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-title">Título Principal - Verde Agrícola</h1>
            <h2 className="text-subtitle">Subtítulo - Informativo e Claro</h2>
            <p className="text-body">Texto corpo - Legível e profissional para uso no campo</p>
            <p className="text-caption">Caption - Informações secundárias e detalhes técnicos</p>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Paleta de Cores FlowAgro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-12 bg-primary rounded-lg shadow-field"></div>
              <p className="text-caption">Primary - Verde Campo</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-info rounded-lg shadow-lg"></div>
              <p className="text-caption">Info - Azul Confiança</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-success rounded-lg"></div>
              <p className="text-caption">Success - Verde Crescimento</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-warning rounded-lg"></div>
              <p className="text-caption">Warning - Amarelo Alerta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button System Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Sistema de Botões FlowAgro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button className="btn-field-action touch-target-lg">
              <Sprout className="h-4 w-4" />
              Ação Principal
            </Button>
            <Button variant="outline" className="btn-info-action">
              <Info className="h-4 w-4" />
              Informação
            </Button>
            <Button variant="secondary" className="touch-target">
              <Droplets className="h-4 w-4" />
              Secundário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status System Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Estados Visuais FlowAgro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg status-success border">
              <CheckCircle className="h-5 w-5" />
              <span>Campo em crescimento saudável</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg status-warning border">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerta climático - monitorar precipitação</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg status-error border">
              <AlertTriangle className="h-5 w-5" />
              <span>Dados críticos detectados</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg status-info border">
              <Info className="h-5 w-5" />
              <span>Informações técnicas disponíveis</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agricultural Cards Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Cards Agrícolas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover-field cursor-pointer premium-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  <CardTitle className="text-subtitle">Fazenda Norte</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-body">125 hectares em produção</p>
                  <Badge className="status-success">Em crescimento</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-field cursor-pointer premium-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-warning" />
                  <CardTitle className="text-subtitle">Fazenda Sul</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-body">87 hectares em monitoramento</p>
                  <Badge className="status-warning">Atenção clima</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Touch Targets Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Touch Targets - Otimizado para Campo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button className="touch-target" size="sm">
              Touch 44px
            </Button>
            <Button className="touch-target-lg" size="lg">
              Touch 56px (com luvas)
            </Button>
          </div>
          <p className="text-caption">
            Touch targets otimizados para uso no campo, incluindo uso com luvas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};