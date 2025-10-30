// hooks/useAudioAnalyzer.ts
import { useEffect, useState, useRef } from 'react';

export interface AudioFrequencyData {
  bass: number; // 20-200Hz - deep bass frequencies
  lowMid: number; // 200-600Hz - low mid frequencies
  mid: number; // 600-2000Hz - mid frequencies
  highMid: number; // 2000-6000Hz - high mid frequencies
  treble: number; // 6000-20000Hz - high frequencies
  overall: number; // overall volume
  frequencies: Uint8Array; // raw frequency data for custom visualizations
}

export function useAudioAnalyzer() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<AudioFrequencyData>({
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    treble: 0,
    overall: 0,
    frequencies: new Uint8Array(0),
  });
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const startListening = async () => {
    try {
      // Request microphone or system audio access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.7; // Smooth out the data

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const sampleRate = audioContext.sampleRate;

      const analyze = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate frequency ranges
        const getFrequencyRangeAverage = (
          startFreq: number,
          endFreq: number
        ) => {
          const startIndex = Math.floor(
            (startFreq / sampleRate) * analyser.fftSize
          );
          const endIndex = Math.floor((endFreq / sampleRate) * analyser.fftSize);

          let sum = 0;
          let count = 0;
          for (let i = startIndex; i <= endIndex && i < dataArray.length; i++) {
            sum += dataArray[i];
            count++;
          }
          return count > 0 ? (sum / count / 255) * 100 : 0;
        };

        const bass = getFrequencyRangeAverage(20, 200);
        const lowMid = getFrequencyRangeAverage(200, 600);
        const mid = getFrequencyRangeAverage(600, 2000);
        const highMid = getFrequencyRangeAverage(2000, 6000);
        const treble = getFrequencyRangeAverage(6000, 20000);

        // Calculate overall average volume
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 255) * 100 * 2.5);

        setAudioLevel(normalizedLevel);
        setFrequencyData({
          bass: Math.min(100, bass * 1.5),
          lowMid: Math.min(100, lowMid * 1.3),
          mid: Math.min(100, mid * 1.2),
          highMid: Math.min(100, highMid * 1.3),
          treble: Math.min(100, treble * 1.5),
          overall: normalizedLevel,
          frequencies: new Uint8Array(dataArray),
        });

        animationRef.current = requestAnimationFrame(analyze);
      };

      analyze();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing audio:', error);
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return {
    audioLevel,
    frequencyData,
    isListening,
    startListening,
    stopListening,
  };
}
