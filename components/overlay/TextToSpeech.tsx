// components/overlay/TextToSpeech.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  TTSConfig,
  TTSLayout,
  TTSMessage,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';
import { Socket } from 'socket.io-client';

interface TextToSpeechProps {
  config: TTSConfig;
  layout: TTSLayout;
  colorScheme: ColorScheme;
  customColors: CustomColors | null;
  socket: Socket | null;
}

// Simple profanity filter (can be expanded)
const filterProfanity = (text: string): string => {
  const profanityList = [
    'fuck',
    'shit',
    'bitch',
    'ass',
    'damn',
    'crap',
    'piss',
    'dick',
    'cock',
    'pussy',
    'bastard',
  ];

  let filtered = text;
  profanityList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });

  return filtered;
};

export default function TextToSpeech({
  config,
  layout,
  colorScheme,
  customColors,
  socket,
}: TextToSpeechProps) {
  const theme = useThemeColors(colorScheme, customColors);
  const [queue, setQueue] = useState<TTSMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  // Helper to finish speaking and move to next message
  const finishSpeaking = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setIsSpeaking(false);
    setCurrentMessage('');
    setQueue(prev => prev.slice(1));
  }, []);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Socket listener for TTS requests
  useEffect(() => {
    if (!socket) return;

    const handleTTSSpeak = (message: TTSMessage) => {
      // Filter profanity if enabled
      let text = message.text;
      if (config.filterProfanity) {
        text = filterProfanity(text);
      }

      setQueue(prev => {
        const newQueue = [...prev, { ...message, text }];

        // Limit queue size
        if (newQueue.length > config.maxQueueSize) {
          return newQueue.slice(-config.maxQueueSize);
        }

        return newQueue;
      });
    };

    socket.on('tts-speak', handleTTSSpeak);

    return () => {
      socket.off('tts-speak', handleTTSSpeak);
    };
  }, [socket, config.maxQueueSize, config.filterProfanity]);

  // Process TTS queue
  useEffect(() => {
    if (isSpeaking || queue.length === 0) {
      return;
    }

    const nextMessage = queue[0];
    setCurrentMessage(nextMessage.text);
    setIsSpeaking(true);

    // Calculate estimated duration based on text length and rate
    // Average speaking rate is ~150 words per minute
    const words = nextMessage.text.split(' ').length;
    const rate = nextMessage.rate || config.rate;
    const baseSeconds = (words / 150) * 60; // seconds at 1x speed
    const adjustedSeconds = baseSeconds / rate;
    const durationMs = Math.max(adjustedSeconds * 1000, 3000); // minimum 3 seconds

    // Track if we've already finished to prevent double-calling
    let hasFinished = false;
    const safeFinish = () => {
      if (hasFinished) return;
      hasFinished = true;
      finishSpeaking();
    };

    // Try to speak using Web Speech API
    if (synthRef.current && availableVoices.length > 0) {
      try {
        // Cancel any ongoing speech first
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(nextMessage.text);
        utteranceRef.current = utterance;

        // Find the configured voice
        const voice = availableVoices.find(v => v.name === config.voice);
        if (voice) {
          utterance.voice = voice;
        } else if (availableVoices.length > 0) {
          // Fall back to first available voice
          utterance.voice = availableVoices[0];
        }

        utterance.rate = rate;
        utterance.pitch = nextMessage.pitch || config.pitch;
        utterance.volume = nextMessage.volume || config.volume;

        // When speech ends naturally, finish speaking
        utterance.onend = () => {
          console.log('[TTS] Speech ended naturally');
          safeFinish();
        };

        // On error, also finish (don't leave it stuck)
        utterance.onerror = event => {
          console.error('[TTS] Speech error:', event.error);
          safeFinish();
        };

        console.log(
          '[TTS] Starting speech:',
          nextMessage.text.substring(0, 50)
        );
        synthRef.current.speak(utterance);
      } catch (error) {
        console.error('[TTS] Failed to speak:', error);
        // Fall through to fallback timer
      }
    }

    // Fallback timer in case speech events don't fire (e.g., in OBS browser source)
    fallbackTimerRef.current = setTimeout(() => {
      console.log('[TTS] Fallback timer triggered');
      safeFinish();
    }, durationMs + 1000); // Add 1 second buffer

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [
    queue,
    isSpeaking,
    availableVoices,
    config.rate,
    config.pitch,
    config.volume,
    config.voice,
    finishSpeaking,
  ]);

  if (!config.showVisualizer || !isSpeaking) {
    return null;
  }

  const renderVisualizer = () => {
    switch (config.visualizerStyle) {
      case 'text-only':
        return (
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
            {currentMessage}
          </p>
        );

      case 'waveform':
        return (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              {/* Animated waveform bars */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='tts-wave-bar'
                  style={{
                    width: '4px',
                    height: '20px',
                    backgroundColor: theme.accentText,
                    borderRadius: '2px',
                    animation: `tts-pulse 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {currentMessage}
            </p>
          </>
        );

      case 'bars':
        return (
          <>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '8px',
                justifyContent: 'center',
              }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: `${20 + Math.sin(Date.now() / 200 + i) * 10}px`,
                    backgroundColor: theme.accentText,
                    borderRadius: '3px',
                    animation: `tts-bar-bounce 0.6s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9,
                textAlign: 'center',
              }}
            >
              {currentMessage}
            </p>
          </>
        );

      case 'circle':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `3px solid ${theme.accentText}`,
                borderTopColor: 'transparent',
                animation: 'tts-spin 1s linear infinite',
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9,
                textAlign: 'center',
              }}
            >
              {currentMessage}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className='fixed transition-all duration-500'
        style={{
          zIndex: 1000,
          left: `${layout.x || 0}px`,
          top: `${layout.y || 0}px`,
        }}
      >
        <div
          style={{
            transform: `scale(${layout.scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: hexToRgba(theme.primaryDark, 0.85),
              color: theme.primaryText,
              borderRadius: '12px',
              maxWidth: '400px',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${hexToRgba(theme.primary, 0.3)}`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: hexToRgba(theme.accent, 0.4),
            }}
          >
            {renderVisualizer()}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes tts-pulse {
          0%,
          100% {
            transform: scaleY(1);
            opacity: 0.7;
          }
          50% {
            transform: scaleY(2);
            opacity: 1;
          }
        }

        @keyframes tts-bar-bounce {
          0%,
          100% {
            transform: scaleY(0.6);
          }
          50% {
            transform: scaleY(1.2);
          }
        }

        @keyframes tts-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
