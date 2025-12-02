// components/dashboard/expanded/TextToSpeechExpanded.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TTSConfig,
  ComponentLayouts,
  TTSVisualizerStyle,
  TTSVisualizerPosition,
} from '@/types/overlay';
import PositionControls from '../PositionControls';
import CopyURLButton from '../CopyURLButton';
import { Socket } from 'socket.io-client';
import { TTSIcon } from '../tiles/TileIcons';
import { useOverlayUrl } from '@/hooks/useOriginUrl';

interface TextToSpeechExpandedProps {
  sessionId: string;
  config: TTSConfig | null;
  isVisible: boolean;
  componentLayouts: ComponentLayouts;
  onConfigChange: (config: Partial<TTSConfig>) => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleVisibility: () => void;
  onClose: () => void;
  socket: Socket | null;
}

// Default config for new TTS setups
const getDefaultConfig = () => ({
  voice: 'Google US English',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  maxQueueSize: 5,
  showVisualizer: true,
  visualizerPosition: 'bottom-right' as TTSVisualizerPosition,
  visualizerStyle: 'waveform' as TTSVisualizerStyle,
  backgroundColor: '#000000',
  textColor: '#ffffff',
  filterProfanity: true,
  allowedSources: 'chat,alerts,manual',
  chatPermissions: 'everyone' as const,
  minCharLength: 5,
  maxCharLength: 200,
  cooldownSeconds: 30,
  position: 'custom' as TTSVisualizerPosition | 'center' | 'custom',
  scale: 1.0,
  x: 20,
  y: 20,
});

export default function TextToSpeechExpanded({
  sessionId,
  config: initialConfig,
  isVisible,
  componentLayouts,
  onConfigChange,
  onPositionChange,
  onScaleChange,
  onToggleVisibility,
  onClose,
  socket,
}: TextToSpeechExpandedProps) {
  const overlayUrl = useOverlayUrl(sessionId, 'tts');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState(
    'Hello! This is a test of the text to speech system.'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    'idle' | 'saving' | 'saved'
  >('idle');

  // Local state for config - initialized from prop or defaults
  const [localConfig, setLocalConfig] = useState(() => {
    if (initialConfig) {
      const { id, layoutId, createdAt, updatedAt, ...configData } =
        initialConfig as any;
      return { ...getDefaultConfig(), ...configData };
    }
    return getDefaultConfig();
  });

  // Refs for debouncing auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load TTS config from API
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tts/load?sessionId=${sessionId}`);
        if (response.ok) {
          const { ttsConfig } = await response.json();
          if (ttsConfig) {
            // Merge with defaults, excluding id and layoutId
            const { id, layoutId, createdAt, updatedAt, ...configData } =
              ttsConfig;
            setLocalConfig({ ...getDefaultConfig(), ...configData });
          }
        }
      } catch (error) {
        console.error('Error loading TTS config:', error);
      } finally {
        setIsLoading(false);
        // Mark that initial load is complete
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadConfig();
  }, [sessionId]);

  // Auto-save effect with debouncing
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoadRef.current || isLoading) {
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set status to idle immediately
    setAutoSaveStatus('idle');

    // Debounce the save for 1 second
    saveTimeoutRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');

      try {
        const response = await fetch('/api/tts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            ...localConfig,
          }),
        });

        if (response.ok) {
          // Broadcast config update via socket
          if (socket && socket.connected) {
            socket.emit('tts-config-update', localConfig);
          }
          setAutoSaveStatus('saved');
          // Reset to idle after 2 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          console.error('Failed to auto-save TTS config');
          setAutoSaveStatus('idle');
        }
      } catch (error) {
        console.error('Error auto-saving TTS config:', error);
        setAutoSaveStatus('idle');
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localConfig, sessionId, socket, isLoading]);

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // If no voice is selected yet or voice not found, select first available
        if (availableVoices.length > 0) {
          const currentVoiceExists = availableVoices.find(
            v => v.name === localConfig.voice
          );
          if (!currentVoiceExists) {
            handleChange({ voice: availableVoices[0].name });
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleChange = (updates: Partial<typeof localConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(updates);
  };

  const handleTestTTS = async () => {
    if (!testText.trim()) {
      alert('Please enter some text to test!');
      return;
    }

    setIsTesting(true);

    try {
      // Test locally first (direct browser TTS)
      const words = testText.split(' ').length;
      const rate = localConfig.rate;
      const baseSeconds = (words / 150) * 60; // seconds at 1x speed
      const adjustedSeconds = baseSeconds / rate;
      const durationMs = Math.max(adjustedSeconds * 1000, 2000); // minimum 2 seconds

      setTimeout(() => {
        setIsTesting(false);
      }, durationMs);

      // Always emit socket event if socket is connected (don't check isVisible)
      if (socket && socket.connected) {
        const ttsMessage = {
          id: Date.now().toString(),
          text: testText,
          voice: localConfig.voice,
          rate: localConfig.rate,
          pitch: localConfig.pitch,
          volume: localConfig.volume,
          priority: 'normal',
          timestamp: Date.now(),
        };
        socket.emit('tts-speak', ttsMessage);
      }
    } catch (error) {
      console.error('Error testing TTS:', error);
      alert('Failed to test TTS: ' + error);
      setIsTesting(false);
    }
  };

  // Parse allowed sources
  const allowedSources = localConfig.allowedSources.split(',').filter(Boolean);

  const handleSourceToggle = (source: string) => {
    const sources = allowedSources.includes(source)
      ? allowedSources.filter((s: string) => s !== source)
      : [...allowedSources, source];
    handleChange({ allowedSources: sources.join(',') });
  };

  if (isLoading) {
    return (
      <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl min-h-[400px] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4' />
          <p className='text-gray-400'>Loading TTS settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl max-h-[90vh] overflow-y-auto'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <button
          onClick={onClose}
          className='w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white'
          aria-label='Back'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
        </button>
        <TTSIcon />
        <div className='flex-1'>
          <h2 className='text-xl font-bold'>Text to Speech</h2>
          <p className='text-sm text-gray-400'>
            Configure voice settings and visualizer
          </p>
        </div>
        {autoSaveStatus !== 'idle' && (
          <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 text-sm'>
            {autoSaveStatus === 'saving' && (
              <>
                <div className='w-3 h-3 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin' />
                <span className='text-gray-300'>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <span className='text-green-400'>✓</span>
                <span className='text-gray-300'>Saved</span>
              </>
            )}
          </div>
        )}
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>

      {/* Position & Scale */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Position & Scale
        </h4>
        <PositionControls
          x={localConfig.x || 20}
          y={localConfig.y || 20}
          onPositionChange={(x, y) => {
            handleChange({ x, y, position: 'custom' });
            // Also update componentLayouts for immediate visual feedback
            onPositionChange(x, y);
          }}
          color='blue'
          elementWidth={400}
          elementHeight={100}
          scale={localConfig.scale || 1}
          isDynamicSize={true}
        />
        <div className='mt-3'>
          <label className='block text-xs text-gray-400 mb-1'>
            Scale: {(localConfig.scale || 1).toFixed(1)}x
          </label>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            value={localConfig.scale || 1}
            onChange={e => {
              const scale = parseFloat(e.target.value);
              handleChange({ scale });
              // Also update componentLayouts for immediate visual feedback
              onScaleChange(scale);
            }}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
        </div>
      </div>

      {/* Voice Settings */}
      <div className='mb-6 bg-gray-800 rounded-lg p-4'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Voice Settings
        </h4>

        {/* Voice Selection */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Voice {voices.length > 0 && `(${voices.length} available)`}
          </label>
          <select
            value={localConfig.voice}
            onChange={e => handleChange({ voice: e.target.value })}
            className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
          >
            {voices.length === 0 ? (
              <option>Loading voices...</option>
            ) : (
              voices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Rate */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Speed: {localConfig.rate.toFixed(1)}x
          </label>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            value={localConfig.rate}
            onChange={e => handleChange({ rate: parseFloat(e.target.value) })}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
        </div>

        {/* Pitch */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Pitch: {localConfig.pitch.toFixed(1)}
          </label>
          <input
            type='range'
            min='0'
            max='2'
            step='0.1'
            value={localConfig.pitch}
            onChange={e => handleChange({ pitch: parseFloat(e.target.value) })}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
        </div>

        {/* Volume */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Volume: {Math.round(localConfig.volume * 100)}%
          </label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.1'
            value={localConfig.volume}
            onChange={e => handleChange({ volume: parseFloat(e.target.value) })}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
        </div>
      </div>

      {/* Visualizer Settings */}
      <div className='mb-6 bg-gray-800 rounded-lg p-4'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Visualizer Settings
        </h4>

        {/* Show Visualizer */}
        <div className='mb-4'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={localConfig.showVisualizer}
              onChange={e => handleChange({ showVisualizer: e.target.checked })}
              className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
            />
            <span className='text-sm text-gray-300'>
              Show visual indicator when speaking
            </span>
          </label>
        </div>

        {localConfig.showVisualizer && (
          <>
            {/* Visualizer Style */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Visualizer Style
              </label>
              <select
                value={localConfig.visualizerStyle}
                onChange={e =>
                  handleChange({
                    visualizerStyle: e.target.value as TTSVisualizerStyle,
                  })
                }
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
              >
                <option value='waveform'>Waveform</option>
                <option value='bars'>Bars</option>
                <option value='circle'>Circle</option>
                <option value='text-only'>Text Only</option>
              </select>
            </div>

            {/* Visualizer Position */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Visualizer Position
              </label>
              <select
                value={localConfig.visualizerPosition}
                onChange={e =>
                  handleChange({
                    visualizerPosition: e.target.value as TTSVisualizerPosition,
                  })
                }
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
              >
                <option value='top-left'>Top Left</option>
                <option value='top-right'>Top Right</option>
                <option value='bottom-left'>Bottom Left</option>
                <option value='bottom-right'>Bottom Right</option>
                <option value='center'>Center</option>
              </select>
            </div>

            {/* Colors */}
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Background Color
                </label>
                <input
                  type='color'
                  value={localConfig.backgroundColor}
                  onChange={e =>
                    handleChange({ backgroundColor: e.target.value })
                  }
                  className='w-full h-10 rounded-lg cursor-pointer'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Text Color
                </label>
                <input
                  type='color'
                  value={localConfig.textColor}
                  onChange={e => handleChange({ textColor: e.target.value })}
                  className='w-full h-10 rounded-lg cursor-pointer'
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Queue & Filters */}
      <div className='mb-6 bg-gray-800 rounded-lg p-4'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Queue & Filters
        </h4>

        {/* Max Queue Size */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Max Queue Size: {localConfig.maxQueueSize}
          </label>
          <input
            type='range'
            min='1'
            max='20'
            step='1'
            value={localConfig.maxQueueSize}
            onChange={e =>
              handleChange({ maxQueueSize: parseInt(e.target.value) })
            }
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
          <p className='text-xs text-gray-400 mt-1'>
            Maximum number of messages to queue before dropping old ones
          </p>
        </div>

        {/* Profanity Filter */}
        <div className='mb-4'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={localConfig.filterProfanity}
              onChange={e =>
                handleChange({ filterProfanity: e.target.checked })
              }
              className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
            />
            <span className='text-sm text-gray-300'>Filter profanity</span>
          </label>
        </div>

        {/* Allowed Sources */}
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Allowed Sources
          </label>
          <div className='flex flex-wrap gap-2'>
            {['chat', 'alerts', 'manual'].map(source => (
              <label
                key={source}
                className='flex items-center gap-2 cursor-pointer bg-gray-700 px-3 py-2 rounded-lg'
              >
                <input
                  type='checkbox'
                  checked={allowedSources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                  className='w-4 h-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-300 capitalize'>
                  {source}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chat TTS Settings */}
      <div className='mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4'>
        <h4 className='text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2'>
          <span>💬</span>
          <span>Chat TTS Settings</span>
        </h4>

        <div className='space-y-4'>
          {/* Permissions */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Who can trigger TTS
            </label>
            <select
              value={localConfig.chatPermissions}
              onChange={e =>
                handleChange({ chatPermissions: e.target.value as any })
              }
              className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
            >
              <option value='everyone'>Everyone</option>
              <option value='subscribers'>Subscribers & VIPs</option>
              <option value='vips'>VIPs & Mods</option>
              <option value='moderators'>Moderators Only</option>
            </select>
          </div>

          {/* Character Limits */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Min Length: {localConfig.minCharLength}
              </label>
              <input
                type='range'
                min='1'
                max='50'
                value={localConfig.minCharLength}
                onChange={e =>
                  handleChange({ minCharLength: parseInt(e.target.value) })
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Max Length: {localConfig.maxCharLength}
              </label>
              <input
                type='range'
                min='50'
                max='500'
                value={localConfig.maxCharLength}
                onChange={e =>
                  handleChange({ maxCharLength: parseInt(e.target.value) })
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
              />
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Cooldown per user: {localConfig.cooldownSeconds}s
            </label>
            <input
              type='range'
              min='0'
              max='300'
              step='5'
              value={localConfig.cooldownSeconds}
              onChange={e =>
                handleChange({ cooldownSeconds: parseInt(e.target.value) })
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Test Section */}
      <div className='mb-6 bg-gray-800 rounded-lg p-4'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>Test TTS</h4>
        <textarea
          value={testText}
          onChange={e => setTestText(e.target.value)}
          placeholder='Enter text to test...'
          className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white mb-3 resize-none'
          rows={3}
        />
        <button
          onClick={handleTestTTS}
          disabled={isTesting}
          className='w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors'
        >
          {isTesting ? '🔊 Speaking...' : '🎤 Test Speech'}
        </button>
      </div>

      {/* Copy URL */}
      <CopyURLButton
        url={overlayUrl}
        label='Copy TTS Overlay URL'
      />
    </div>
  );
}
