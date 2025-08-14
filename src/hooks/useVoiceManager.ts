import { useEffect, useState, useCallback } from 'react';
import VoiceManager, { VoiceState } from '@/managers/VoiceManager';

export interface UseVoiceManager {
  state: VoiceState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ blob: Blob; url: string } | null>;
  cleanup: () => void;
}

export default function useVoiceManager(): UseVoiceManager {
  const [state, setState] = useState<VoiceState>('idle');
  const voiceManager = VoiceManager.getInstance();

  useEffect(() => {
    const unsubscribe = voiceManager.subscribe((newState) => {
      setState(newState);
    });

    // Set initial state
    setState(voiceManager.getState());

    return () => {
      unsubscribe();
    };
  }, [voiceManager]);

  const startRecording = useCallback(async () => {
    await voiceManager.startRecording();
  }, [voiceManager]);

  const stopRecording = useCallback(async () => {
    return await voiceManager.stopRecording();
  }, [voiceManager]);

  const cleanup = useCallback(() => {
    voiceManager.cleanup();
  }, [voiceManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceManager.cleanup();
    };
  }, [voiceManager]);

  return {
    state,
    startRecording,
    stopRecording,
    cleanup
  };
}