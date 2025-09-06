import React from 'react';
import { ArrowLeft, X, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBackButton } from '@/hooks/useBackButton';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'ios';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  fallbackRoute?: string;
  hapticFeedback?: boolean;
  confirmBeforeLeave?: boolean;
  customHandler?: () => void | Promise<void>;
  showText?: boolean;
  iconOnly?: boolean;
}

/**
 * Componente BackButton consistente e reutilizável
 * 
 * Características:
 * - Detecta contexto automaticamente
 * - Ícones apropriados por situação
 * - Haptic feedback
 * - Totalmente customizável
 */
export const BackButton: React.FC<BackButtonProps> = ({
  className,
  variant = 'ghost',
  size = 'default',
  fallbackRoute,
  hapticFeedback,
  confirmBeforeLeave,
  customHandler,
  showText = true,
  iconOnly = false
}) => {
  const {
    backText,
    backIcon,
    goBack,
    shouldShowBackButton
  } = useBackButton({
    fallbackRoute,
    hapticFeedback,
    confirmBeforeLeave,
    customHandler
  });

  // Não renderizar se não deve mostrar
  if (!shouldShowBackButton) {
    return null;
  }

  // Escolher ícone baseado no contexto
  const getIcon = () => {
    switch (backIcon) {
      case 'close':
        return <X className="h-4 w-4" />;
      case 'cancel':
        return <X className="h-4 w-4" />;
      case 'arrow':
      default:
        return <ArrowLeft className="h-4 w-4" />;
    }
  };

  // Variante iOS específica
  if (variant === 'ios') {
    return (
      <button
        onClick={goBack}
        className={cn(
          "inline-flex items-center gap-2 px-2 py-1 rounded-lg",
          "text-primary hover:bg-primary/10 active:scale-95",
          "transition-all duration-200 touch-target",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
      >
        {getIcon()}
        {showText && !iconOnly && (
          <span className="text-sm font-medium">{backText}</span>
        )}
      </button>
    );
  }

  // Botão padrão com sistema de variants
  return (
    <Button
      variant={variant}
      size={iconOnly ? 'icon' : size}
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-2",
        iconOnly && "w-9 h-9 p-0",
        className
      )}
    >
      {getIcon()}
      {showText && !iconOnly && (
        <span>{backText}</span>
      )}
    </Button>
  );
};