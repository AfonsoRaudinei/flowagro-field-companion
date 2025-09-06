import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

type VoiceState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceListener {
  (state: VoiceState, audioBlob?: Blob, audioUrl?: string): void;
}

class VoiceManager {
  private static instance: VoiceManager;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private currentState: VoiceState = 'idle';
  private listeners: Set<VoiceListener> = new Set();
  private stream: MediaStream | null = null;
  private audioUrl: string | null = null;

  private constructor() {}

  static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager();
    }
    return VoiceManager.instance;
  }

  subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => 
      listener(this.currentState, undefined, this.audioUrl)
    );
  }

  async startRecording(): Promise<void> {
    if (this.currentState === 'recording') return;

    try {
      this.setState('processing');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.start();
      this.setState('recording');
    } catch (error) {
      logger.error('Recording error', { error });
      this.setState('error');
      this.cleanup();
    }
  }

  async stopRecording(): Promise<{ blob: Blob; url: string } | null> {
    if (this.currentState !== 'recording' || !this.mediaRecorder) return null;

    this.setState('processing');
    this.mediaRecorder.stop();

    return new Promise((resolve) => {
      const onStop = () => {
        const result = this.processRecording();
        resolve(result);
      };
      
      this.mediaRecorder!.addEventListener('stop', onStop, { once: true });
    });
  }

  private processRecording(): { blob: Blob; url: string } | null {
    if (this.chunks.length === 0) {
      this.setState('error');
      return null;
    }

    const blob = new Blob(this.chunks, { type: "audio/webm" });
    
    // Cleanup previous URL
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    
    this.audioUrl = URL.createObjectURL(blob);
    this.setState('idle');
    this.cleanupRecording();

    return { blob, url: this.audioUrl };
  }

  private setState(state: VoiceState) {
    this.currentState = state;
    this.notify();
  }

  private cleanupRecording() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  getState(): VoiceState {
    return this.currentState;
  }

  cleanup() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.cleanupRecording();
    this.setState('idle');
  }
}

export default VoiceManager;
export type { VoiceState, VoiceListener };