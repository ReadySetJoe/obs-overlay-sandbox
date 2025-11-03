// components/dashboard/expanded/BackgroundExpanded.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import CopyURLButton from '../CopyURLButton';

interface BackgroundExpandedProps {
  sessionId: string;
  backgroundImageUrl: string | null;
  backgroundImageName: string | null;
  backgroundColors: string | null;
  backgroundOpacity: number;
  backgroundBlur: number;
  onBackgroundChange: (data: {
    backgroundImageUrl: string | null;
    backgroundOpacity: number;
    backgroundBlur: number;
  }) => void;
  onClose: () => void;
}

interface ExtractedColors {
  palette: string[];
  primary: string;
  secondary: string;
  accent: string;
}

export default function BackgroundExpanded({
  sessionId,
  backgroundImageUrl,
  backgroundImageName,
  backgroundColors,
  backgroundOpacity,
  backgroundBlur,
  onBackgroundChange,
  onClose,
}: BackgroundExpandedProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractingColors, setExtractingColors] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedColors: ExtractedColors | null = backgroundColors
    ? JSON.parse(backgroundColors)
    : null;

  // Clear extracting state when colors are received
  useEffect(() => {
    if (backgroundColors && extractingColors) {
      setExtractingColors(false);
    }
  }, [backgroundColors, extractingColors]);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        file.type
      )
    ) {
      setError('Invalid file type. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      // Simulate progress (since we can't track real progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/backgrounds/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();

      // Show color extraction loading state
      setExtractingColors(true);

      // Background change will be handled via socket event
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this background?')) {
      return;
    }

    try {
      const response = await fetch('/api/backgrounds/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete background');
      }

      // Background removal will be handled via socket event
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApplyColors = async () => {
    if (!parsedColors) return;

    try {
      const response = await fetch('/api/backgrounds/apply-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          primary: parsedColors.primary,
          secondary: parsedColors.secondary,
          accent: parsedColors.accent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply colors');
      }

      // Color change will be handled via socket event
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpacityChange = (value: number) => {
    onBackgroundChange({
      backgroundImageUrl,
      backgroundOpacity: value,
      backgroundBlur,
    });
  };

  const handleBlurChange = (value: number) => {
    onBackgroundChange({
      backgroundImageUrl,
      backgroundOpacity,
      backgroundBlur: value,
    });
  };

  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
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
          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Custom Background</h3>
            <p className='text-sm text-gray-400'>
              Upload an image for your overlay background
            </p>
          </div>
        </div>
        <CopyURLButton
          url={`${window.location.origin}/overlay/${sessionId}/background`}
        />
      </div>

      {/* Upload Area */}
      {!backgroundImageUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/jpg,image/png,image/webp'
            onChange={handleFileInputChange}
            className='hidden'
          />

          {uploading ? (
            <div className='space-y-3'>
              <div className='text-purple-400 text-4xl'>⏳</div>
              <div className='text-white font-medium'>Uploading...</div>
              <div className='w-full bg-gray-700 rounded-full h-2'>
                <div
                  className='bg-purple-500 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className='text-sm text-gray-400'>{uploadProgress}%</div>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='text-gray-400 text-4xl'>📁</div>
              <div className='text-white font-medium'>
                Drop image here or click to browse
              </div>
              <div className='text-sm text-gray-400'>
                Supported: PNG, JPG, WebP (max 10MB)
                <br />
                Recommended: 1920x1080
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Section */
        <div className='bg-gray-800 rounded-lg p-4 space-y-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-start gap-4'>
              <img
                src={backgroundImageUrl}
                alt='Background preview'
                className='w-32 h-18 object-cover rounded'
              />
              <div>
                <div className='text-white font-medium'>
                  {backgroundImageName}
                </div>
                <div className='text-sm text-gray-400'>Background uploaded</div>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors'
            >
              ❌ Remove
            </button>
          </div>

          {/* Opacity Control */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-300'>
                Opacity
              </label>
              <span className='text-sm text-gray-400'>
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
            <input
              type='range'
              min='0'
              max='100'
              value={backgroundOpacity * 100}
              onChange={e => handleOpacityChange(Number(e.target.value) / 100)}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
            />
          </div>

          {/* Blur Control */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-300'>Blur</label>
              <span className='text-sm text-gray-400'>{backgroundBlur}px</span>
            </div>
            <input
              type='range'
              min='0'
              max='20'
              value={backgroundBlur}
              onChange={e => handleBlurChange(Number(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
            />
          </div>
        </div>
      )}

      {/* Extracted Colors - Loading State */}
      {extractingColors && !parsedColors && (
        <div className='bg-gray-800 rounded-lg p-4 space-y-4'>
          <div className='flex items-center gap-3'>
            <div className='w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
            <h4 className='text-sm font-semibold text-white'>
              Extracting Color Palette...
            </h4>
          </div>

          {/* Skeleton loader */}
          <div className='space-y-4'>
            <div className='flex gap-2'>
              {[...Array(8)].map((_, idx) => (
                <div
                  key={idx}
                  className='w-10 h-10 rounded border-2 border-gray-600 bg-gray-700 animate-pulse'
                />
              ))}
            </div>

            <div className='space-y-2'>
              <div className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                Analyzing image colors...
              </div>
              <div className='grid grid-cols-3 gap-3'>
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className='space-y-1'>
                    <div className='w-full h-8 rounded border border-gray-600 bg-gray-700 animate-pulse' />
                    <div className='h-3 w-16 bg-gray-700 rounded animate-pulse' />
                    <div className='h-3 w-20 bg-gray-700 rounded animate-pulse' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className='text-xs text-gray-400 text-center'>
            Using k-means clustering to find dominant colors...
          </p>
        </div>
      )}

      {/* Extracted Colors - Loaded State */}
      {parsedColors && (
        <div className='bg-gray-800 rounded-lg p-4 space-y-4'>
          <h4 className='text-sm font-semibold text-white'>
            Extracted Color Palette
          </h4>

          {/* Palette Colors */}
          <div className='flex gap-2'>
            {parsedColors.palette.map((color, idx) => (
              <div
                key={idx}
                className='w-10 h-10 rounded border-2 border-gray-600'
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Selected Theme Colors */}
          <div className='space-y-2'>
            <div className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
              Selected Theme Colors
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <div
                  className='w-full h-8 rounded border border-gray-600'
                  style={{ backgroundColor: parsedColors.primary }}
                />
                <div className='text-xs text-gray-400'>Primary</div>
                <div className='text-xs font-mono text-gray-300'>
                  {parsedColors.primary}
                </div>
              </div>
              <div className='space-y-1'>
                <div
                  className='w-full h-8 rounded border border-gray-600'
                  style={{ backgroundColor: parsedColors.secondary }}
                />
                <div className='text-xs text-gray-400'>Secondary</div>
                <div className='text-xs font-mono text-gray-300'>
                  {parsedColors.secondary}
                </div>
              </div>
              <div className='space-y-1'>
                <div
                  className='w-full h-8 rounded border border-gray-600'
                  style={{ backgroundColor: parsedColors.accent }}
                />
                <div className='text-xs text-gray-400'>Accent</div>
                <div className='text-xs font-mono text-gray-300'>
                  {parsedColors.accent}
                </div>
              </div>
            </div>
          </div>

          {/* Apply Colors Button */}
          <button
            onClick={handleApplyColors}
            className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors'
          >
            Apply Colors to Theme
          </button>
          <p className='text-xs text-gray-400 text-center'>
            This will set your color scheme to "Custom" with these colors
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded'>
          {error}
        </div>
      )}
    </div>
  );
}
