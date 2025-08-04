import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao FlowAgro",
        variant: "default"
      });
      
      // Redirect to technical map
      navigate('/technical-map');
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-6">
      <div className="max-w-sm mx-auto w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
            <img 
              src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png" 
              alt="FlowAgro Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">FlowAgro</h1>
          <p className="text-muted-foreground">Tecnologia para o campo</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 shadow-ios-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-12"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        {/* Alternative Access */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/login-form')}
            className="text-primary"
          >
            Acessar com dados completos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;