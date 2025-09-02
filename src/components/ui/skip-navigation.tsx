import React from 'react';
import { cn } from '@/lib/utils';

interface SkipNavigationProps {
  targetId: string;
  label?: string;
  className?: string;
}

/**
 * Componente de link de navegação acessível
 * Permite que usuários de teclado/screen reader pulem para o conteúdo principal
 */
export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  targetId,
  label = "Pular para conteúdo principal",
  className
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "skip-link",
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4",
        "bg-primary text-primary-foreground",
        "px-4 py-2 rounded-md font-medium",
        "z-50 transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={(e) => {
        // Ensure target element gets focus for screen readers
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      {label}
    </a>
  );
};

/**
 * Hook para criar landmarks de navegação acessíveis
 */
export function useAccessibleLandmarks() {
  const createLandmark = (id: string, label: string, role: string = 'region') => ({
    id,
    'aria-label': label,
    role,
    tabIndex: -1
  });

  return {
    main: createLandmark('main-content', 'Conteúdo principal', 'main'),
    navigation: createLandmark('main-navigation', 'Navegação principal', 'navigation'),
    sidebar: createLandmark('sidebar-content', 'Barra lateral', 'complementary'),
    search: createLandmark('search-section', 'Busca', 'search'),
    banner: createLandmark('page-banner', 'Cabeçalho da página', 'banner'),
    contentinfo: createLandmark('page-footer', 'Rodapé da página', 'contentinfo')
  };
}