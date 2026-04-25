'use client';

import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  blob: Blob | null;
  previewUrl: string | null;
  error: string | null;
}

export function useScreenRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    blob: null,
    previewUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setState(s => ({ ...s, error: null, blob: null, previewUrl: null }));

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as MediaTrackConstraints,
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Choose best available codec
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setState(s => ({
          ...s,
          isRecording: false,
          isPaused: false,
          blob,
          previewUrl: url,
        }));
        // Stop all tracks
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          mediaRecorderRef.current?.stop();
        }
      };

      recorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, duration: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
      }, 1000);

      setState(s => ({ ...s, isRecording: true, duration: 0 }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      // User cancelled the screen picker — not an error
      if (message.includes('Permission denied') || message.includes('AbortError')) {
        return;
      }
      setState(s => ({ ...s, error: message }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  }, []);

  const discardRecording = useCallback(() => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      blob: null,
      previewUrl: null,
      error: null,
    });
  }, [state.previewUrl]);

  const formatDuration = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    discardRecording,
    formatDuration,
  };
}
