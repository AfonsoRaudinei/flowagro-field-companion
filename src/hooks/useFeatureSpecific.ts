import { useCallback, useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { logger } from '@/lib/logger';

/**
 * Collection of specialized hooks for specific features
 */

// Voice recording hook with proper cleanup
export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      performanceMonitor.startTimer('voice-recording');
    } catch (error) {
      logger.error('Failed to start recording', { error });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      performanceMonitor.endTimer('voice-recording');
    }
  }, [isRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearAudio: () => setAudioBlob(null)
  };
}

// Image processing hook
export function useImageProcessing() {
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const processImage = useCallback(async (file: File, options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }) => {
    return performanceMonitor.measureAsync('image-processing', async () => {
      setProcessing(true);
      
      try {
        const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options || {};
        
        return new Promise<Blob>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d')!;
            
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to process image'));
              }
            }, 'image/jpeg', quality);
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      } finally {
        setProcessing(false);
      }
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, []);

  return {
    processing,
    processImage
  };
}

// Search optimization hook
export function useOptimizedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performanceMonitor.measure('search-filter', () => {
        if (!query.trim()) {
          setFilteredItems(items);
          return;
        }

        const searchLower = query.toLowerCase();
        const filtered = items.filter(item =>
          searchFields.some(field => {
            const value = item[field];
            return typeof value === 'string' && 
                   value.toLowerCase().includes(searchLower);
          })
        );
        
        setFilteredItems(filtered);
      });
    }, debounceMs);
  }, [items, searchFields, debounceMs]);

  useEffect(() => {
    search(searchQuery);
  }, [search, searchQuery]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    search
  };
}