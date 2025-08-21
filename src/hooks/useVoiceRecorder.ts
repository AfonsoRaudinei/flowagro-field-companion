import { useEffect, useRef, useState, useCallback } from "react";
import { logger } from '@/lib/logger';

export interface UseVoiceRecorder {
  isRecording: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export default function useVoiceRecorder(): UseVoiceRecorder {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Cleanup function for media resources
  const cleanup = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [audioUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(async () => {
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mr = new MediaRecorder(stream);

      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      logger.info('Voice recording started');
    } catch (error) {
      logger.error('Failed to start voice recording', { error });
      cleanup();
    }
  }, [isRecording, cleanup]);

  const stop = useCallback(async () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    logger.info('Voice recording stopped');
  }, [isRecording]);

  const reset = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    logger.debug('Voice recording reset');
  }, [audioUrl]);

  return { isRecording, audioUrl, audioBlob, start, stop, reset };
}
