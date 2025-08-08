import { useEffect, useRef, useState } from "react";

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
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const start = async () => {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current = mr;
    mr.start();
    setIsRecording(true);
  };

  const stop = async () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const reset = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return { isRecording, audioUrl, audioBlob, start, stop, reset };
}
