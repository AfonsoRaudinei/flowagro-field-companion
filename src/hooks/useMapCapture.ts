import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface MapCaptureOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export const useMapCapture = () => {
  const captureMap = useCallback(async (mapContainer: HTMLElement, options: MapCaptureOptions = {}) => {
    try {
      // Try to use html2canvas if available (would need to be installed)
      // For now, we'll use a simpler approach with modern browser APIs
      
      if ('html2canvas' in window) {
        // @ts-ignore - html2canvas would be dynamically imported
        const canvas = await window.html2canvas(mapContainer, {
          useCORS: true,
          allowTaint: true,
          scale: window.devicePixelRatio || 1,
          width: options.width,
          height: options.height,
        });

        // Convert canvas to blob
        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            `image/${options.format || 'png'}`,
            options.quality || 0.9
          );
        });
      } else {
        // Fallback: Simple screenshot using browser APIs
        toast({
          title: "Captura em desenvolvimento",
          description: "A captura de tela do mapa está sendo implementada",
        });
        return null;
      }
    } catch (error) {
      console.error('Map capture failed:', error);
      toast({
        title: "Erro na captura",
        description: "Não foi possível capturar o mapa",
        variant: "destructive"
      });
      return null;
    }
  }, []);

  const downloadCapture = useCallback(async (blob: Blob, filename: string = 'mapa-tecnico') => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Captura salva",
        description: "O mapa foi salvo na sua pasta de downloads"
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive"
      });
    }
  }, []);

  const shareCapture = useCallback(async (blob: Blob) => {
    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'mapa-tecnico.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Mapa Técnico - FlowAgro',
            text: 'Confira este mapa técnico criado no FlowAgro',
            files: [file]
          });
          return;
        }
      }

      // Fallback: Copy to clipboard
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        
        toast({
          title: "Copiado para área de transferência",
          description: "A imagem do mapa foi copiada"
        });
      } else {
        // Final fallback: Download
        await downloadCapture(blob);
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Tentando fazer download...",
        variant: "destructive"
      });
      await downloadCapture(blob);
    }
  }, [downloadCapture]);

  return {
    captureMap,
    downloadCapture,
    shareCapture
  };
};