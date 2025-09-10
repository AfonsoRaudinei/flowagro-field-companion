import { useEffect } from 'react';

interface KeyboardShortcuts {
  onBackToList: () => void;
  onSmartBack: () => void;
  onSearch: () => void;
  onToggleFilter: () => void;
}

/**
 * Custom hook for dashboard keyboard shortcuts
 * Provides intuitive keyboard navigation for better UX
 */
export function useDashboardKeyboards({
  onBackToList,
  onSmartBack,
  onSearch,
  onToggleFilter
}: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Handle shortcuts
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onBackToList();
          break;
          
        case 'Backspace':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            onSmartBack();
          }
          break;
          
        case '/':
          event.preventDefault();
          onSearch();
          break;
          
        case 't':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            onToggleFilter();
          }
          break;
          
        case 'ArrowLeft':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            onSmartBack();
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBackToList, onSmartBack, onSearch, onToggleFilter]);

  // Return keyboard shortcuts info for help UI
  return {
    shortcuts: [
      { key: 'Esc', description: 'Voltar para lista' },
      { key: 'Cmd/Ctrl + ←', description: 'Navegação inteligente' },
      { key: '/', description: 'Buscar' },
      { key: 'Cmd/Ctrl + T', description: 'Alternar filtro' }
    ]
  };
}