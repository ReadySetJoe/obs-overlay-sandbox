// components/dashboard/PositionControls.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface PositionControlsProps {
  x: number;
  y: number;
  onPositionChange: (x: number, y: number) => void;
  color?: string;
  elementWidth?: number;
  elementHeight?: number;
  scale?: number;
  // Optional: show a note about dynamic sizing
  isDynamicSize?: boolean;
}

export default function PositionControls({
  x,
  y,
  onPositionChange,
  color = 'purple',
  elementWidth = 200,
  elementHeight = 100,
  scale = 1,
  isDynamicSize = false,
}: PositionControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stream dimensions (1920x1080)
  const STREAM_WIDTH = 1920;
  const STREAM_HEIGHT = 1080;

  // Preview dimensions (16:9 ratio)
  const PREVIEW_WIDTH = 240;
  const PREVIEW_HEIGHT = 135;

  // Calculate scale factors between stream and preview
  const scaleX = STREAM_WIDTH / PREVIEW_WIDTH;
  const scaleY = STREAM_HEIGHT / PREVIEW_HEIGHT;

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== 'click') return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Get mouse position within preview, clamped to bounds
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, PREVIEW_WIDTH));
    const mouseY = Math.max(0, Math.min(e.clientY - rect.top, PREVIEW_HEIGHT));

    // Convert preview coordinates to stream coordinates
    const streamX = mouseX * scaleX;
    const streamY = mouseY * scaleY;

    // Clamp to keep element fully visible (considering scale)
    const visualWidth = elementWidth * scale;
    const visualHeight = elementHeight * scale;

    const clampedX = Math.max(0, Math.min(streamX, STREAM_WIDTH - visualWidth));
    const clampedY = Math.max(0, Math.min(streamY, STREAM_HEIGHT - visualHeight));

    onPositionChange(Math.round(clampedX), Math.round(clampedY));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  // Convert stream coordinates to preview coordinates for display
  const previewX = x / scaleX;
  const previewY = y / scaleY;
  const previewWidth = (elementWidth * scale) / scaleX;
  const previewHeight = (elementHeight * scale) / scaleY;

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
  };

  const elementColor = colorMap[color] || 'bg-purple-500';

  // Preset snap positions (as percentages of screen)
  const snapToPosition = (xPercent: number, yPercent: number) => {
    const visualWidth = elementWidth * scale;
    const visualHeight = elementHeight * scale;

    const targetX = (STREAM_WIDTH * xPercent) - (visualWidth * xPercent);
    const targetY = (STREAM_HEIGHT * yPercent) - (visualHeight * yPercent);

    const clampedX = Math.max(0, Math.min(targetX, STREAM_WIDTH - visualWidth));
    const clampedY = Math.max(0, Math.min(targetY, STREAM_HEIGHT - visualHeight));

    onPositionChange(Math.round(clampedX), Math.round(clampedY));
  };

  return (
    <div className='space-y-3 bg-gray-700/20 rounded-lg p-3 border border-gray-600/50'>
      <div>
        <label className='block text-xs text-gray-400 mb-2 font-semibold'>
          Position Preview (1920x1080)
        </label>
        <div
          ref={containerRef}
          className='relative bg-gray-900 rounded border border-gray-600 cursor-crosshair select-none'
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onClick={handleMouseMove}
        >
          {/* Grid overlay */}
          <div className='absolute inset-0 opacity-20 pointer-events-none'>
            <div className='absolute top-0 left-0 right-0 h-px bg-gray-600' />
            <div className='absolute bottom-0 left-0 right-0 h-px bg-gray-600' />
            <div className='absolute top-0 bottom-0 left-0 w-px bg-gray-600' />
            <div className='absolute top-0 bottom-0 right-0 w-px bg-gray-600' />
            <div className='absolute top-1/2 left-0 right-0 h-px bg-gray-700' />
            <div className='absolute top-0 bottom-0 left-1/2 w-px bg-gray-700' />
          </div>

          {/* Quick position buttons */}
          {/* Corners */}
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0, 0); }}
            className='absolute top-0 left-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-tl z-10'
            title='Top Left'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(1, 0); }}
            className='absolute top-0 right-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-tr z-10'
            title='Top Right'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0, 1); }}
            className='absolute bottom-0 left-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-bl z-10'
            title='Bottom Left'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(1, 1); }}
            className='absolute bottom-0 right-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-br z-10'
            title='Bottom Right'
          />

          {/* Edges */}
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0.5, 0); }}
            className='absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-t z-10'
            title='Top Center'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0.5, 1); }}
            className='absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-b z-10'
            title='Bottom Center'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0, 0.5); }}
            className='absolute top-1/2 left-0 -translate-y-1/2 w-2 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-l z-10'
            title='Left Center'
          />
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(1, 0.5); }}
            className='absolute top-1/2 right-0 -translate-y-1/2 w-2 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-r z-10'
            title='Right Center'
          />

          {/* Center */}
          <button
            onClick={e => { e.stopPropagation(); snapToPosition(0.5, 0.5); }}
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-sm z-10'
            title='Center'
          />

          {/* Element preview */}
          <div
            className={`absolute ${elementColor} rounded border-2 border-white transition-opacity pointer-events-none ${
              isDragging ? 'opacity-90' : 'opacity-60 hover:opacity-80'
            } ${isDynamicSize ? 'border-dashed' : ''}`}
            style={{
              left: previewX,
              top: previewY,
              width: previewWidth,
              height: previewHeight,
            }}
          >
            {isDynamicSize && (
              <div className='absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold bg-black/30'>
                ~{Math.round(elementHeight)}px
              </div>
            )}
          </div>

          {/* Crosshair when dragging */}
          {isDragging && (
            <>
              <div
                className='absolute top-0 bottom-0 w-px bg-white opacity-30 pointer-events-none'
                style={{ left: previewX }}
              />
              <div
                className='absolute left-0 right-0 h-px bg-white opacity-30 pointer-events-none'
                style={{ top: previewY }}
              />
            </>
          )}
        </div>
        <div className='text-xs text-gray-500 mt-1 flex items-center justify-between'>
          <span>Click or drag to position</span>
        </div>
      </div>

      {/* Coordinate inputs */}
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-xs text-gray-400 mb-1'>X Position</label>
          <input
            type='number'
            min='0'
            max={STREAM_WIDTH}
            value={Math.round(x)}
            onChange={e => onPositionChange(parseInt(e.target.value) || 0, y)}
            className='w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'
          />
        </div>
        <div>
          <label className='block text-xs text-gray-400 mb-1'>Y Position</label>
          <input
            type='number'
            min='0'
            max={STREAM_HEIGHT}
            value={Math.round(y)}
            onChange={e => onPositionChange(x, parseInt(e.target.value) || 0)}
            className='w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'
          />
        </div>
      </div>

      {/* Size info */}
      <div className='text-xs text-gray-500 bg-gray-800/50 rounded px-2 py-1'>
        Element: {elementWidth}×{elementHeight}px × {scale}x scale = {Math.round(elementWidth * scale)}×{Math.round(elementHeight * scale)}px
      </div>
    </div>
  );
}
