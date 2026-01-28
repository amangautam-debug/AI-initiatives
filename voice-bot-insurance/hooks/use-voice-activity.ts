"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceActivityOptions {
  /** Threshold for voice detection (0-1). Default 0.08 */
  threshold?: number;
  /** How many consecutive frames must be above threshold. Default 8 */
  consecutiveFrames?: number;
  /** Callback when voice activity starts */
  onVoiceStart?: () => void;
  /** Callback when voice activity ends */
  onVoiceEnd?: () => void;
  /** Callback with current audio level (0-1) */
  onLevelChange?: (level: number) => void;
  /** Enable debug logging */
  debug?: boolean;
}

interface UseVoiceActivityReturn {
  isActive: boolean;
  isListening: boolean;
  level: number;
  rawLevel: number;
  start: () => Promise<boolean>;
  stop: () => void;
  isSupported: boolean;
  updateSettings: (settings: { threshold?: number; consecutiveFrames?: number }) => void;
}

/**
 * Robust Voice Activity Detection using Web Audio API
 * Requires sustained voice levels across multiple frames to trigger
 */
export function useVoiceActivity(
  options: UseVoiceActivityOptions = {}
): UseVoiceActivityReturn {
  const {
    threshold: initialThreshold = 0.08,
    consecutiveFrames: initialConsecutiveFrames = 8,
    onVoiceStart,
    onVoiceEnd,
    onLevelChange,
    debug = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [rawLevel, setRawLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Settings refs (can be updated dynamically)
  const thresholdRef = useRef(initialThreshold);
  const consecutiveFramesRef = useRef(initialConsecutiveFrames);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Track consecutive frames above threshold
  const framesAboveThresholdRef = useRef(0);
  const isActiveRef = useRef(false);
  
  // Track baseline noise level
  const baselineRef = useRef(0);
  const baselineSamplesRef = useRef<number[]>([]);

  // Callback refs
  const onVoiceStartRef = useRef(onVoiceStart);
  const onVoiceEndRef = useRef(onVoiceEnd);
  const onLevelChangeRef = useRef(onLevelChange);

  useEffect(() => {
    onVoiceStartRef.current = onVoiceStart;
    onVoiceEndRef.current = onVoiceEnd;
    onLevelChangeRef.current = onLevelChange;
  }, [onVoiceStart, onVoiceEnd, onLevelChange]);

  const log = useCallback((message: string) => {
    if (debug) {
      console.log(`[VAD] ${message}`);
    }
  }, [debug]);

  useEffect(() => {
    const supported = typeof window !== "undefined" && 
      !!(navigator.mediaDevices?.getUserMedia) && 
      !!(window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    setIsSupported(supported);
  }, []);

  // Update settings dynamically
  const updateSettings = useCallback((settings: { threshold?: number; consecutiveFrames?: number }) => {
    if (settings.threshold !== undefined) {
      thresholdRef.current = settings.threshold;
    }
    if (settings.consecutiveFrames !== undefined) {
      consecutiveFramesRef.current = settings.consecutiveFrames;
    }
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Focus on human voice frequencies (300Hz - 3000Hz)
    const voiceStartBin = 6;
    const voiceEndBin = 64;
    
    let sum = 0;
    let count = 0;
    for (let i = voiceStartBin; i < Math.min(voiceEndBin, dataArray.length); i++) {
      const normalized = dataArray[i] / 255;
      sum += normalized * normalized;
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    
    setRawLevel(rms);
    
    // Update baseline (moving average of quiet moments)
    if (rms < 0.03) {
      baselineSamplesRef.current.push(rms);
      if (baselineSamplesRef.current.length > 30) {
        baselineSamplesRef.current.shift();
      }
      baselineRef.current = baselineSamplesRef.current.reduce((a, b) => a + b, 0) / 
        baselineSamplesRef.current.length;
    }
    
    // Calculate level relative to baseline
    const adjustedLevel = Math.max(0, rms - baselineRef.current);
    
    setLevel(adjustedLevel);
    onLevelChangeRef.current?.(adjustedLevel);

    // Check if above threshold (use current ref value)
    const isAboveThreshold = adjustedLevel > thresholdRef.current;
    
    if (isAboveThreshold) {
      framesAboveThresholdRef.current++;
      
      // Trigger voice start after consecutive frames
      if (framesAboveThresholdRef.current >= consecutiveFramesRef.current && !isActiveRef.current) {
        log(`VOICE START - ${framesAboveThresholdRef.current} frames above ${thresholdRef.current}`);
        isActiveRef.current = true;
        setIsActive(true);
        onVoiceStartRef.current?.();
      }
    } else {
      if (framesAboveThresholdRef.current > 0) {
        framesAboveThresholdRef.current = 0;
      }
      
      if (isActiveRef.current) {
        log("VOICE END");
        isActiveRef.current = false;
        setIsActive(false);
        onVoiceEndRef.current?.();
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [log]);

  const start = useCallback(async (): Promise<boolean> => {
    if (isListening) return true;

    try {
      log("Starting VAD...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || 
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      framesAboveThresholdRef.current = 0;
      baselineSamplesRef.current = [];
      baselineRef.current = 0;
      
      setIsListening(true);
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      
      log("VAD started");
      return true;
    } catch (error) {
      log(`Error: ${error}`);
      return false;
    }
  }, [isListening, analyzeAudio, log]);

  const stop = useCallback(() => {
    log("Stopping VAD");
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    framesAboveThresholdRef.current = 0;
    isActiveRef.current = false;
    
    setIsListening(false);
    setIsActive(false);
    setLevel(0);
    setRawLevel(0);
  }, [log]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    isActive,
    isListening,
    level,
    rawLevel,
    start,
    stop,
    isSupported,
    updateSettings,
  };
}
