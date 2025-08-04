import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { User, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationHeader } from '@/components/ui/navigation';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  const [formData, setFormData] = useState({
    fullName: '',
    userProfile: '',
    zipCode: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (isFormValid) {
      // Save user data to context
      setUserData({
        fullName: formData.fullName,
        profile: formData.userProfile as 'consultor' | 'produtor',
        zipCode: formData.zipCode
      });
      navigate('/technical-map');
    }
  };

  const isFormValid = formData.fullName && formData.userProfile && formData.zipCode;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader
        title="FlowAgro"
        onBack={() => navigate('/')}
        showBackButton={true}
      />

      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <img 
                src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png" 
                alt="FlowAgro Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Bem-vindo ao FlowAgro
            </h2>
            <p className="text-muted-foreground">
              Preencha seus dados para acessar a plataforma
            </p>
          </div>

          <Card className="p-6 shadow-ios-md">
            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Nome completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="pl-11 h-12 text-base border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* User Profile Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Perfil do usuário *
                </Label>
                <Select value={formData.userProfile} onValueChange={(value) => handleInputChange('userProfile', value)}>
                  <SelectTrigger className="h-12 text-base border-border focus:ring-2 focus:ring-primary">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-muted-foreground mr-3" />
                      <SelectValue placeholder="Selecione seu perfil" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-ios-lg z-50">
                    <SelectItem value="consultor" className="text-base py-3 hover:bg-accent focus:bg-accent">
                      Consultor
                    </SelectItem>
                    <SelectItem value="produtor" className="text-base py-3 hover:bg-accent focus:bg-accent">
                      Produtor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm font-medium text-foreground">
                  CEP *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="00000-000"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="pl-11 h-12 text-base border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                    maxLength={9}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full h-12 text-base font-semibold shadow-ios-button transition-all ${
                isFormValid 
                  ? 'bg-success hover:bg-success/90 text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              size="lg"
            >
              Acessar FlowAgro
            </Button>
          </div>

          {/* Required fields notice */}
          <p className="text-xs text-muted-foreground text-center">
            * Campos obrigatórios
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;