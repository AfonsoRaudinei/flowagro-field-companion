import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { User, MapPin, Camera, ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  const [formData, setFormData] = useState({
    fullName: '',
    userProfile: '',
    zipCode: ''
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [farmLogo, setFarmLogo] = useState<string | null>(null);
  const [useLogoAsAppIcon, setUseLogoAsAppIcon] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (type: 'profile' | 'logo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${type}.${fileExt}`;
        const filePath = `${type === 'profile' ? 'profiles' : 'logos'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        if (type === 'profile') {
          setProfileImage(data.publicUrl);
        } else {
          setFarmLogo(data.publicUrl);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  const handleSubmit = async () => {
    if (isFormValid) {
      try {
        // Save user data to Supabase
        const userData = {
          full_name: formData.fullName,
          profile: formData.userProfile,
          zip_code: formData.zipCode,
          profile_image: profileImage,
          farm_logo: farmLogo,
          use_logo_as_app_icon: useLogoAsAppIcon,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('users')
          .insert([userData]);

        if (error) throw error;

        // Save user data to context
        setUserData({
          fullName: formData.fullName,
          profile: formData.userProfile as 'consultor' | 'produtor',
          zipCode: formData.zipCode
        });
        
        navigate('/technical-map');
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  };

  const isFormValid = formData.fullName && formData.userProfile && formData.zipCode;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">FlowAgro</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-6">
          <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Bem-vindo ao FlowAgro
              </h2>
              <p className="text-muted-foreground">
                Preencha seus dados para acessar a plataforma
              </p>
            </div>

            {/* Profile Photo Upload */}
            <Card className="p-6 shadow-ios-md">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div 
                    onClick={() => handleImageUpload('profile')}
                    className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Foto de perfil (opcional)
                </p>
              </div>
            </Card>

            {/* Farm Logo Upload */}
            <Card className="p-6 shadow-ios-md">
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    onClick={() => handleImageUpload('logo')}
                    className="w-32 h-20 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    {farmLogo ? (
                      <img 
                        src={farmLogo} 
                        alt="Farm Logo" 
                        className="w-full h-full rounded-lg object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Logo da fazenda (opcional)
                  </p>
                </div>
                
                {farmLogo && (
                  <div className="flex items-center space-x-2 justify-center">
                    <Switch
                      checked={useLogoAsAppIcon}
                      onCheckedChange={setUseLogoAsAppIcon}
                      id="app-icon"
                    />
                    <Label htmlFor="app-icon" className="text-sm">
                      Usar logo como ícone do app na navegação
                    </Label>
                  </div>
                )}
              </div>
            </Card>

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
              disabled={!isFormValid || isUploading}
              className={`w-full h-12 text-base font-semibold shadow-ios-button transition-all ${
                isFormValid && !isUploading
                  ? 'bg-success hover:bg-success/90 text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              size="lg"
            >
              {isUploading ? 'Enviando...' : 'Entrar no FlowAgro'}
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