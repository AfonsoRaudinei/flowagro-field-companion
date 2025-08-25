import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { SecurityService } from '@/lib/securityService';
import { Button } from '@/components/ui/button';

interface SecurityAlertProps {
  className?: string;
}

export function SecurityAlert({ className }: SecurityAlertProps) {
  const [suspiciousActivity, setSuspiciousActivity] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const checkSecurity = async () => {
      const count = await SecurityService.checkSuspiciousActivity(60); // Últimos 60 minutos
      setSuspiciousActivity(count);
      setShowAlert(count > 3);
    };

    // Verificar imediatamente
    checkSecurity();

    // Verificar a cada 5 minutos
    const interval = setInterval(checkSecurity, 300000);

    return () => clearInterval(interval);
  }, []);

  if (!showAlert) {
    return null;
  }

  const handleSecureAccount = async () => {
    // Limpar dados sensíveis
    SecurityService.clearSensitiveData();
    
    // Log da ação de segurança
    await SecurityService.logSecurityEvent({
      eventType: 'user_initiated_security_cleanup',
      details: { suspiciousActivityCount: suspiciousActivity }
    });

    setShowAlert(false);
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Atividade Suspeita Detectada
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Detectamos {suspiciousActivity} tentativas suspeitas de acesso nos últimos 60 minutos. 
          Por segurança, recomendamos que você:
        </p>
        <ul className="list-disc list-inside mb-3 text-sm">
          <li>Verifique se todas as sessões ativas são suas</li>
          <li>Considere alterar sua senha</li>
          <li>Revise atividades recentes na sua conta</li>
        </ul>
        <Button 
          onClick={handleSecureAccount}
          variant="outline" 
          size="sm"
          className="bg-background hover:bg-muted"
        >
          Proteger Conta
        </Button>
      </AlertDescription>
    </Alert>
  );
}