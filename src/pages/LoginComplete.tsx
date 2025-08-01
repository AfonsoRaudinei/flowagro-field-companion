import React, { useState } from 'react';
import { User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationHeader } from '@/components/ui/navigation';

interface LoginCompleteProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const LoginComplete: React.FC<LoginCompleteProps> = ({ onBack, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader
        title="FlowAgro"
        onBack={onBack}
        showBackButton={true}
      />

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-xl shadow-ios-lg flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Acesse sua conta
            </h2>
            <p className="text-muted-foreground mt-2">
              Entre ou registre-se para continuar
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Card className="p-6 shadow-ios-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={onLoginSuccess}
                    className="w-full h-12 bg-gradient-primary shadow-ios-button"
                    size="lg"
                  >
                    Entrar
                  </Button>

                  <div className="text-center">
                    <button className="text-sm text-primary hover:underline">
                      Esqueceu sua senha?
                    </button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Card className="p-6 shadow-ios-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Crie uma senha segura"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={onLoginSuccess}
                    className="w-full h-12 bg-gradient-secondary shadow-ios-button"
                    size="lg"
                  >
                    Criar conta
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao criar uma conta, você concorda com nossos{' '}
                    <button className="text-primary underline">
                      Termos de Uso
                    </button>
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoginComplete;