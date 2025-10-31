// components/dashboard/PositionControls.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface PositionControlsProps {
  x: number;
  y: number;
  onPositionChange: (x: number, y: number) => void;
  color?: string;
  elementWidth?: number; // Base width before scaling
  elementHeight?: number; // Base height before scaling
  scale?: number; // Scale factor applied via CSS transform
}

export default function PositionControls({
  x,
  y,
  onPositionChange,
  color = 'purple',
  elementWidth = 200,
  elementHeight = 100,
  scale = 1,
}: PositionControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Screen dimensions (1920x1080)
  const screenWidth = 1920;
  const screenHeight = 1080;

  // Visual dimensions after scaling (what the user sees)
  const visualWidth = elementWidth * scale;
  const visualHeight = elementHeight * scale;

  // Visual preview dimensions
  const previewWidth = 240;
  const previewHeight = 135; // 16:9 ratio

  // Scale factors
  const scaleX = screenWidth / previewWidth;
  const scaleY = screenHeight / previewHeight;

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
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, previewWidth));
    const mouseY = Math.max(0, Math.min(e.clientY - rect.top, previewHeight));

    // Convert preview coordinates to screen coordinates (visual center where user clicked)
    const visualCenterX = Math.round(mouseX * scaleX);
    const visualCenterY = Math.round(mouseY * scaleY);

    // Convert to percentage of screen dimensions for the visual center
    const centerXPercent = visualCenterX / screenWidth;
    const centerYPercent = visualCenterY / screenHeight;

    // Clamp to reasonable bounds (10% to 90% to keep some padding)
    const clampedXPercent = Math.max(0.05, Math.min(centerXPercent, 0.95));
    const clampedYPercent = Math.max(0.05, Math.min(centerYPercent, 0.95));

    // Convert back to pixels for the visual center
    const clampedCenterX = clampedXPercent * screenWidth;
    const clampedCenterY = clampedYPercent * screenHeight;

    // Convert visual center to CSS top-left position for storage
    // Visual center = x + width/2, so x = visualCenter - width/2
    const cssX = clampedCenterX - elementWidth / 2;
    const cssY = clampedCenterY - elementHeight / 2;

    onPositionChange(cssX, cssY);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  // Convert stored top-left coordinates to visual center coordinates for display
  // The CSS box is at (x, y) with size (elementWidth, elementHeight)
  // Its center is at (x + elementWidth/2, y + elementHeight/2)
  // This is also the visual center after scaling
  const centerX = x + elementWidth / 2;
  const centerY = y + elementHeight / 2;

  // Convert screen center coordinates to preview coordinates
  const previewCenterX = centerX / scaleX;
  const previewCenterY = centerY / scaleY;

  // Visual element dimensions in preview scale (what user sees after scaling)
  const previewVisualWidth = visualWidth / scaleX;
  const previewVisualHeight = visualHeight / scaleY;

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
  };

  const elementColor = colorMap[color] || 'bg-purple-500';

  // Snap positions - targets are pixel coordinates for visual center
  const snapToPosition = (targetCenterX: number, targetCenterY: number) => {
    // Convert visual center to CSS top-left position for storage
    // Visual center = x + width/2, so x = visualCenter - width/2
    const cssX = targetCenterX - elementWidth / 2;
    const cssY = targetCenterY - elementHeight / 2;

    onPositionChange(cssX, cssY);
  };

  return (
    <div className='space-y-3 bg-gray-700/20 rounded-lg p-3 border border-gray-600/50'>
      <div>
        <label className='block text-xs text-gray-400 mb-2 font-semibold'>
          Position Preview
        </label>
        <div
          ref={containerRef}
          className='relative bg-gray-900 rounded border border-gray-600 cursor-crosshair select-none'
          style={{ width: previewWidth, height: previewHeight }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onClick={handleMouseMove}
        >
          {/* Preview screen */}
          <div className='absolute inset-0 opacity-30'>
            <div className='absolute top-0 left-0 right-0 h-px bg-gray-600' />
            <div className='absolute bottom-0 left-0 right-0 h-px bg-gray-600' />
            <div className='absolute top-0 bottom-0 left-0 w-px bg-gray-600' />
            <div className='absolute top-0 bottom-0 right-0 w-px bg-gray-600' />
            <div className='absolute top-1/2 left-0 right-0 h-px bg-gray-700' />
            <div className='absolute top-0 bottom-0 left-1/2 w-px bg-gray-700' />
          </div>

          {/* Snap buttons - use percentage-based positions */}
          {/* Corners */}
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.1, screenHeight * 0.1);
            }}
            className='absolute top-0 left-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-tl'
            title='Top Left'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.9, screenHeight * 0.1);
            }}
            className='absolute top-0 right-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-tr'
            title='Top Right'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.1, screenHeight * 0.9);
            }}
            className='absolute bottom-0 left-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-bl'
            title='Bottom Left'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.9, screenHeight * 0.9);
            }}
            className='absolute bottom-0 right-0 w-3 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-br'
            title='Bottom Right'
          />

          {/* Edges */}
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.5, screenHeight * 0.1);
            }}
            className='absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-t'
            title='Top Center'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.5, screenHeight * 0.9);
            }}
            className='absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-b'
            title='Bottom Center'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.1, screenHeight * 0.5);
            }}
            className='absolute top-1/2 left-0 -translate-y-1/2 w-2 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-l'
            title='Left Center'
          />
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.9, screenHeight * 0.5);
            }}
            className='absolute top-1/2 right-0 -translate-y-1/2 w-2 h-3 bg-gray-600 hover:bg-gray-500 transition-colors rounded-r'
            title='Right Center'
          />

          {/* Center */}
          <button
            onClick={e => {
              e.stopPropagation();
              snapToPosition(screenWidth * 0.5, screenHeight * 0.5);
            }}
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-600 hover:bg-gray-500 transition-colors rounded-sm'
            title='Center'
          />

          {/* Draggable element indicator - shows as a rectangle with visual dimensions */}
          <div
            className={`absolute ${elementColor} rounded border-2 border-white transition-opacity ${
              isDragging ? 'opacity-90' : 'opacity-60 hover:opacity-80'
            }`}
            style={{
              left: previewCenterX,
              top: previewCenterY,
              width: previewVisualWidth,
              height: previewVisualHeight,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />

          {/* Crosshair lines when dragging */}
          {isDragging && (
            <>
              <div
                className='absolute top-0 bottom-0 w-px bg-white opacity-30'
                style={{ left: previewCenterX }}
              />
              <div
                className='absolute left-0 right-0 h-px bg-white opacity-30'
                style={{ top: previewCenterY }}
              />
            </>
          )}
        </div>
        <div className='text-xs text-gray-500 mt-1'>
          Click or drag to position element
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-xs text-gray-400 mb-1'>X Position</label>
          <input
            type='number'
            min='0'
            max={screenWidth}
            value={x}
            onChange={e => onPositionChange(parseInt(e.target.value) || 0, y)}
            className='w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'
          />
        </div>
        <div>
          <label className='block text-xs text-gray-400 mb-1'>Y Position</label>
          <input
            type='number'
            min='0'
            max={screenHeight}
            value={y}
            onChange={e => onPositionChange(x, parseInt(e.target.value) || 0)}
            className='w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm focus:border-gray-500 focus:outline-none'
          />
        </div>
      </div>
    </div>
  );
}
