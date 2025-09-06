import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BackButtonConfig {
  fallbackRoute?: string;
  hapticFeedback?: boolean;
  confirmBeforeLeave?: boolean;
  customHandler?: () => void | Promise<void>;
  preventDefaultBehavior?: boolean;
}

interface BackButtonData {
  canGoBack: boolean;
  backText: string;
  backIcon: 'arrow' | 'close' | 'cancel';
  destination: string;
}

/**
 * Hook para gerenciar comportamento consistente do botão voltar
 * 
 * Características:
 * - Detecta se há histórico de navegação
 * - Fallback para rota específica se não há histórico
 * - Suporte a haptic feedback
 * - Confirmação antes de sair (opcional)
 * - Handlers customizados
 */
export const useBackButton = (config: BackButtonConfig = {}): BackButtonData & { 
  goBack: () => void | Promise<void>;
  shouldShowBackButton: boolean;
} => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerHaptic } = useHapticFeedback();
  
  const {
    fallbackRoute = '/dashboard',
    hapticFeedback = true,
    confirmBeforeLeave = false,
    customHandler,
    preventDefaultBehavior = false
  } = config;

  // Determinar se pode voltar baseado no histórico
  const canGoBack = window.history.length > 1;
  
  // Mapear rotas para contextos específicos
  const getBackContext = useCallback(() => {
    const currentPath = location.pathname;
    
    // Rotas que sempre mostram "Fechar" ao invés de "Voltar"
    const modalRoutes = ['/login-form', '/recover', '/reset-password'];
    if (modalRoutes.includes(currentPath)) {
      return {
        text: 'Fechar',
        icon: 'close' as const,
        destination: fallbackRoute
      };
    }
    
    // Rotas de configuração que voltam para dashboard
    const settingsRoutes = ['/settings', '/settings/security', '/settings/webhooks', '/profile'];
    if (settingsRoutes.some(route => currentPath.startsWith(route))) {
      return {
        text: 'Dashboard',
        icon: 'arrow' as const,
        destination: '/dashboard'
      };
    }
    
    // Rotas de ferramentas que voltam para dashboard
    const toolRoutes = ['/calculator', '/phenological-stages', '/consultoria', '/map-test', '/technical-map'];
    if (toolRoutes.some(route => currentPath.startsWith(route))) {
      return {
        text: canGoBack ? 'Voltar' : 'Dashboard',
        icon: 'arrow' as const,
        destination: canGoBack ? 'history' : '/dashboard'
      };
    }
    
    // Default behavior
    return {
      text: canGoBack ? 'Voltar' : 'Início',
      icon: 'arrow' as const,
      destination: canGoBack ? 'history' : fallbackRoute
    };
  }, [location.pathname, canGoBack, fallbackRoute]);

  const backContext = getBackContext();
  
  // Handler principal do botão voltar
  const goBack = useCallback(async () => {
    if (preventDefaultBehavior && customHandler) {
      await customHandler();
      return;
    }
    
    // Haptic feedback
    if (hapticFeedback) {
      triggerHaptic('light');
    }
    
    // Confirmação antes de sair (para formulários, etc.)
    if (confirmBeforeLeave) {
      const confirmed = window.confirm('Tem certeza que deseja sair? Alterações não salvas serão perdidas.');
      if (!confirmed) return;
    }
    
    // Handler customizado
    if (customHandler) {
      await customHandler();
      return;
    }
    
    // Comportamento padrão
    if (backContext.destination === 'history' && canGoBack) {
      window.history.back();
    } else {
      navigate(backContext.destination);
    }
  }, [
    preventDefaultBehavior,
    customHandler,
    hapticFeedback,
    triggerHaptic,
    confirmBeforeLeave,
    backContext.destination,
    canGoBack,
    navigate
  ]);

  // Determinar se deve mostrar o botão (algumas rotas podem não precisar)
  const shouldShowBackButton = useCallback(() => {
    const hiddenRoutes = ['/', '/dashboard'];
    return !hiddenRoutes.includes(location.pathname);
  }, [location.pathname]);

  return {
    canGoBack,
    backText: backContext.text,
    backIcon: backContext.icon,
    destination: backContext.destination,
    goBack,
    shouldShowBackButton: shouldShowBackButton()
  };
};