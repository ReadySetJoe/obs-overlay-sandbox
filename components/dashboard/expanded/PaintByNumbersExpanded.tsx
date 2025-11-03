// components/dashboard/expanded/PaintByNumbersExpanded.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  PaintByNumbersState,
  ComponentLayouts,
  PaintTemplate,
} from '@/types/overlay';
import { paintTemplates, mergeTemplates } from '@/lib/paintTemplates';
import CopyURLButton from '../CopyURLButton';
import PositionControls from '../PositionControls';

interface PaintByNumbersExpandedProps {
  sessionId: string;
  paintState: PaintByNumbersState | null;
  isVisible: boolean;
  componentLayouts: ComponentLayouts;
  onToggleVisibility: () => void;
  onTemplateSelect: (templateId: string) => void;
  onReset: () => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onGridSizeChange: (size: number) => void;
  onClose: () => void;
}

export default function PaintByNumbersExpanded({
  sessionId,
  paintState,
  isVisible,
  componentLayouts,
  onToggleVisibility,
  onTemplateSelect,
  onReset,
  onPositionChange,
  onScaleChange,
  onGridSizeChange,
  onClose,
}: PaintByNumbersExpandedProps) {
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<PaintTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNumColors, setUploadNumColors] = useState(10);
  const [uploadMaxDimension, setUploadMaxDimension] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Merge built-in and custom templates
  const allTemplates = mergeTemplates(customTemplates);
  const totalRegions = paintState?.regions.length || 0;
  const filledRegions = paintState?.regions.filter(r => r.filled).length || 0;
  const progress =
    totalRegions > 0 ? Math.round((filledRegions / totalRegions) * 100) : 0;
  const isComplete = totalRegions > 0 && filledRegions === totalRegions;

  const layout = componentLayouts.paintByNumbers || {
    position: 'top-left' as const,
    x: 0,
    y: 0,
    scale: 1,
    gridSize: 20,
  };

  // Load custom templates on mount
  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await fetch('/api/paint-templates/list');
      if (response.ok) {
        const data = await response.json();
        setCustomTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile || !uploadName) {
      setUploadError('Please provide a name and select a file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('description', uploadDescription);
      formData.append('numColors', uploadNumColors.toString());
      formData.append('maxDimension', uploadMaxDimension.toString());

      const response = await fetch('/api/paint-templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Template uploaded:', data);

      // Reset form and reload templates
      setShowUploadForm(false);
      setUploadName('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadNumColors(10);
      setUploadMaxDimension(100);

      await loadCustomTemplates();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/paint-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Reload templates
      await loadCustomTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete template');
    }
  };

  const isCustomTemplate = (templateId: string) => {
    return customTemplates.some(t => t.id === templateId);
  };

  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
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
          <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
            🎨
          </div>
          <h2 className='text-xl font-bold'>Paint by Numbers</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>

      {/* Template Selection */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-3'>
          <label className='block text-sm font-semibold text-gray-300'>
            Select Template
          </label>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className='px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition'
          >
            {showUploadForm ? '✕ Cancel' : '+ Upload Custom'}
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <form
            onSubmit={handleUpload}
            className='bg-gray-700/30 rounded-xl p-4 border border-purple-500/30 mb-4'
          >
            <h3 className='text-sm font-semibold text-purple-400 mb-3'>
              Upload Custom Template
            </h3>
            <div className='space-y-3'>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Template Name *
                </label>
                <input
                  type='text'
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className='w-full px-3 py-2 bg-gray-800 rounded-lg text-sm border border-gray-600 focus:border-purple-500 focus:outline-none'
                  placeholder='My Custom Template'
                  required
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Description
                </label>
                <input
                  type='text'
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  className='w-full px-3 py-2 bg-gray-800 rounded-lg text-sm border border-gray-600 focus:border-purple-500 focus:outline-none'
                  placeholder='Optional description'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Image File * (JPG, PNG, WebP - Max 10MB)
                </label>
                <input
                  type='file'
                  accept='image/jpeg,image/jpg,image/png,image/webp'
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className='w-full px-3 py-2 bg-gray-800 rounded-lg text-sm border border-gray-600 focus:border-purple-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-500'
                  required
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs text-gray-400 mb-1'>
                    Number of Colors: {uploadNumColors}
                  </label>
                  <input
                    type='range'
                    min='5'
                    max='50'
                    value={uploadNumColors}
                    onChange={e => setUploadNumColors(parseInt(e.target.value))}
                    className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-400 mb-1'>
                    Max Dimension: {uploadMaxDimension}px
                  </label>
                  <input
                    type='range'
                    min='50'
                    max='500'
                    value={uploadMaxDimension}
                    onChange={e =>
                      setUploadMaxDimension(parseInt(e.target.value))
                    }
                    className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
                  />
                </div>
              </div>
              {uploadError && (
                <div className='text-xs text-red-400 bg-red-900/20 p-2 rounded'>
                  {uploadError}
                </div>
              )}
              <button
                type='submit'
                disabled={isUploading}
                className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isUploading ? 'Generating...' : 'Upload & Generate'}
              </button>
            </div>
          </form>
        )}

        <div className='grid grid-cols-2 gap-3'>
          {isLoadingTemplates && (
            <div className='col-span-2 text-center text-gray-400 py-4'>
              Loading templates...
            </div>
          )}
          {allTemplates.map(template => (
            <div key={template.id} className='relative group'>
              <button
                onClick={() => onTemplateSelect(template.id)}
                className={`w-full rounded-xl px-4 py-4 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl overflow-hidden border ${
                  paintState?.templateId === template.id
                    ? 'bg-gradient-to-br from-purple-600/80 to-pink-600/80 border-purple-500'
                    : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 border-gray-600 hover:border-gray-500'
                }`}
                disabled={paintState?.templateId === template.id}
              >
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
                <div className='relative flex flex-col items-center gap-2'>
                  {/* Show image preview for both custom and built-in templates */}
                  <div className='w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-600 flex-shrink-0'>
                    <img
                      src={
                        template.imageUrl ||
                        `/paint-templates/${template.id}.png`
                      }
                      alt={template.name}
                      className='w-full h-full object-cover'
                      style={{ imageRendering: 'pixelated' }}
                      onError={e => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling;
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                    {/* Fallback emoji (hidden by default, shown if image fails) */}
                    <div
                      className='w-full h-full flex items-center justify-center text-2xl'
                      style={{ display: 'none' }}
                    >
                      {template.id === 'heart'
                        ? '❤️'
                        : template.id === 'pokeball'
                          ? '⚪️'
                          : template.id === 'mario'
                            ? '🍄'
                            : template.id === 'mario-and-luigi'
                              ? '👨‍🍳👨‍🍳'
                              : template.id === 'falco'
                                ? '🦅'
                                : template.id === 'mona-lisa'
                                  ? '🖼️'
                                  : '🎨'}
                    </div>
                  </div>
                  <span className='text-md'>{template.name}</span>
                  {template.description && (
                    <span className='text-sm text-gray-300'>
                      {template.description}
                    </span>
                  )}
                  <span className='text-xs text-gray-400'>
                    {template.regions.length} regions
                  </span>
                  {isCustomTemplate(template.id) && (
                    <span className='text-xs text-purple-400 font-semibold'>
                      Custom
                    </span>
                  )}
                </div>
              </button>
              {isCustomTemplate(template.id) && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className='absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                  title='Delete template'
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Progress */}
      {paintState && (
        <div className='mb-6 bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
          <h3 className='text-sm font-semibold text-purple-400 mb-3'>
            Current Progress
          </h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-300'>
                {filledRegions} / {totalRegions} regions filled
              </span>
              <span className='text-purple-400 font-bold'>{progress}%</span>
            </div>
            <div className='h-4 bg-gray-700/50 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500'
                style={{ width: `${progress}%` }}
              />
            </div>
            {isComplete && (
              <div className='text-center text-green-400 font-bold animate-pulse'>
                🎉 Complete! 🎉
              </div>
            )}
            <div className='flex gap-2 mt-3'>
              <button
                onClick={onReset}
                className='flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                🔄 Reset Canvas
              </button>
            </div>
            {paintState.lastFilledBy && (
              <div className='text-xs text-gray-400 text-center mt-2'>
                Last filled by:{' '}
                <span className='text-purple-400'>
                  {paintState.lastFilledBy}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Instructions */}
      <div className='mb-6 bg-purple-900/20 rounded-xl p-4 border border-purple-500/30'>
        <h3 className='text-sm font-semibold text-purple-400 mb-2'>
          How to Use
        </h3>
        <ul className='text-xs text-gray-300 space-y-1'>
          <li>
            • Type{' '}
            <code className='bg-gray-800 px-1 rounded text-purple-400'>
              !paint [number] [color]
            </code>{' '}
            in chat
          </li>
          <li>• Examples:</li>
          <li className='ml-4'>
            <code className='bg-gray-800 px-1 rounded text-purple-400'>
              !paint 1 red
            </code>{' '}
            - use color name
          </li>
          <li className='ml-4'>
            <code className='bg-gray-800 px-1 rounded text-purple-400'>
              !paint 2 #FF00FF
            </code>{' '}
            - use hex code
          </li>
          <li className='ml-4'>
            <code className='bg-gray-800 px-1 rounded text-purple-400'>
              !paint 3
            </code>{' '}
            - use template color
          </li>
          <li>
            • Supported colors: red, blue, green, yellow, orange, purple, pink,
            cyan, white, black, and more!
          </li>
          <li>• Each region can only be filled once</li>
        </ul>
      </div>

      {/* Position & Size Controls */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-300 mb-3'>
          Position & Size
        </h4>
        <PositionControls
          x={layout.x}
          y={layout.y}
          onPositionChange={onPositionChange}
          color='purple'
          elementWidth={400}
          elementHeight={400}
          scale={layout.scale}
        />
        <div className='grid grid-cols-2 gap-3 mt-3'>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Scale: {layout.scale.toFixed(1)}x
            </label>
            <input
              type='range'
              min='0.5'
              max='2'
              step='0.1'
              value={layout.scale}
              onChange={e => onScaleChange(parseFloat(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Grid Size: {layout.gridSize}px
            </label>
            <input
              type='range'
              min='1'
              max='40'
              step='1'
              value={layout.gridSize}
              onChange={e => onGridSizeChange(parseInt(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
            />
          </div>
        </div>
      </div>

      {/* Copy URL for OBS */}
      <CopyURLButton
        url={`${window.location.origin}/overlay/${sessionId}/paint-by-numbers`}
      />
    </div>
  );
}
