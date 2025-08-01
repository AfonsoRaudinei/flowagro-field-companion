import React from 'react';
import { MapPin, Smartphone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginInitialProps {
  onNavigateToLogin: () => void;
}

const LoginInitial: React.FC<LoginInitialProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Hero Section with Map Visual */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20">
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-12 h-full w-full gap-1 p-4">
              {Array.from({ length: 96 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${
                    Math.random() > 0.7 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col h-full px-6 pt-16 pb-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-xl shadow-ios-lg flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">FlowAgro</h1>
            <p className="text-muted-foreground text-lg">
              Tecnologia Agrícola Avançada
            </p>
          </div>

          {/* Features Grid */}
          <div className="flex-1 flex flex-col justify-center space-y-4 mb-8">
            <Card className="p-4 bg-card/80 backdrop-blur-sm shadow-ios-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Mapeamento Técnico</h3>
                  <p className="text-sm text-muted-foreground">
                    Análise precisa do campo em tempo real
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/80 backdrop-blur-sm shadow-ios-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Uso em Campo</h3>
                  <p className="text-sm text-muted-foreground">
                    Interface otimizada para condições rurais
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/80 backdrop-blur-sm shadow-ios-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Chat Técnico</h3>
                  <p className="text-sm text-muted-foreground">
                    Suporte especializado para produtores
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-card border-t border-border">
        <Button
          onClick={onNavigateToLogin}
          className="w-full h-12 bg-gradient-primary shadow-ios-button transition-all"
          size="lg"
        >
          Começar
        </Button>
      </div>
    </div>
  );
};

export default LoginInitial;