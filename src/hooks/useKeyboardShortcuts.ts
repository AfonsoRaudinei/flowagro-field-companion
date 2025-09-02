import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onLayersOpen?: () => void;
  onLocationOpen?: () => void;
  onNDVIOpen?: () => void;
  onPinsOpen?: () => void;
  onScannerOpen?: () => void;
  onDrawingOpen?: () => void;
  onCameraOpen?: () => void;
  onClose?: () => void;
}

export function useKeyboardShortcuts({
  onLayersOpen,
  onLocationOpen,
  onNDVIOpen,
  onPinsOpen,
  onScannerOpen,
  onDrawingOpen,
  onCameraOpen,
  onClose,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se estiver digitando em input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Atalhos do FAB (case insensitive)
      const key = event.key.toLowerCase();
      
      if (event.ctrlKey || event.metaKey) {
        // Atalhos com Cmd/Ctrl
        switch (key) {
          case 'l':
            event.preventDefault();
            onLayersOpen?.();
            break;
          case 'g':
            event.preventDefault();
            onLocationOpen?.();
            break;
          case 'n':
            event.preventDefault();
            onNDVIOpen?.();
            break;
          case 'p':
            event.preventDefault();
            onPinsOpen?.();
            break;
          case 's':
            event.preventDefault();
            onScannerOpen?.();
            break;
          case 'm':
            event.preventDefault();
            onDrawingOpen?.();
            break;
          case 'c':
            event.preventDefault();
            onCameraOpen?.();
            break;
        }
      } else {
        // Atalhos simples (sem modificadores)
        switch (key) {
          case 'escape':
            onClose?.();
            break;
          case 'l':
            onLayersOpen?.();
            break;
          case 'g':
            onLocationOpen?.();
            break;
          case 'n':
            onNDVIOpen?.();
            break;
          case 'p':
            onPinsOpen?.();
            break;
          case 's':
            onScannerOpen?.();
            break;
          case 'm':
            onDrawingOpen?.();
            break;
          case 'c':
            onCameraOpen?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    onLayersOpen,
    onLocationOpen,
    onNDVIOpen,
    onPinsOpen,
    onScannerOpen,
    onDrawingOpen,
    onCameraOpen,
    onClose,
  ]);
}