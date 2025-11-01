// components/overlay/PaintByNumbers.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { PaintByNumbersState, PaintByNumbersLayout } from '@/types/overlay';
import Confetti from 'react-confetti';

interface PaintByNumbersProps {
  paintState: PaintByNumbersState | null;
  layout: PaintByNumbersLayout;
}

export default function PaintByNumbers({
  paintState,
  layout,
}: PaintByNumbersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  // Check if template is complete
  const isComplete = paintState?.regions.every(r => r.filled) || false;

  // Trigger confetti when completed
  useEffect(() => {
    if (isComplete && paintState?.completedAt) {
      const justCompleted = Date.now() - paintState.completedAt < 10000; // Within last 10 seconds
      if (justCompleted) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 10000);
      }
    }
  }, [isComplete, paintState?.completedAt]);

  // Set window size for confetti
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // Render the canvas
  useEffect(() => {
    if (!paintState || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { regions } = paintState;
    const gridSize = layout.gridSize || 20;

    // Find template dimensions from regions
    let maxX = 0;
    let maxY = 0;
    regions.forEach(region => {
      region.pixels.forEach(([x, y]) => {
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    const width = (maxX + 1) * gridSize;
    const height = (maxY + 1) * gridSize;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create a map of coordinates to region IDs for quick lookup
    const pixelToRegion = new Map<string, number>();
    regions.forEach(region => {
      region.pixels.forEach(([x, y]) => {
        pixelToRegion.set(`${x},${y}`, region.id);
      });
    });

    // Helper function to get region ID at a coordinate
    const getRegionAt = (x: number, y: number): number | null => {
      return pixelToRegion.get(`${x},${y}`) ?? null;
    };

    // Draw filled regions
    regions.forEach(region => {
      region.pixels.forEach(([x, y]) => {
        const pixelX = x * gridSize;
        const pixelY = y * gridSize;

        if (region.filled) {
          // Draw filled pixel with custom color if provided, otherwise use template color
          ctx.fillStyle = region.customColor || region.color;
          ctx.fillRect(pixelX, pixelY, gridSize, gridSize);
        } else {
          // Draw unfilled pixel with semi-transparent preview
          ctx.fillStyle = region.color + '20'; // 20 = ~12% opacity
          ctx.fillRect(pixelX, pixelY, gridSize, gridSize);
        }
      });
    });

    // Draw checkmarks on filled regions
    regions.forEach(region => {
      if (region.filled) {
        // Find center pixel of region
        const centerPixel = region.pixels[Math.floor(region.pixels.length / 2)];
        const [cx, cy] = centerPixel;
        const pixelX = cx * gridSize;
        const pixelY = cy * gridSize;

        // Draw checkmark
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pixelX + gridSize * 0.3, pixelY + gridSize * 0.5);
        ctx.lineTo(pixelX + gridSize * 0.45, pixelY + gridSize * 0.65);
        ctx.lineTo(pixelX + gridSize * 0.7, pixelY + gridSize * 0.35);
        ctx.stroke();
      }
    });
  }, [paintState, layout.gridSize]);

  if (!paintState) return null;

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    custom: '',
  };

  const totalRegions = paintState.regions.length;
  const filledRegions = paintState.regions.filter(r => r.filled).length;
  const progress = Math.round((filledRegions / totalRegions) * 100);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <div
        className={`fixed ${positionClasses[layout.position]} transition-all duration-300`}
        style={{
          transform: `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale})`,
          transformOrigin: 'top left',
          zIndex: 12,
        }}
      >
        <div className='bg-gray-900/95 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/50 shadow-2xl'>
          {/* Header */}
          <div className='mb-4 text-center'>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
              Paint by Numbers
            </h3>
            <p className='text-sm text-gray-400 mt-1'>
              Type{' '}
              <span className='text-purple-400 font-mono'>
                !paint [number] [color]
              </span>{' '}
              in chat!
            </p>
          </div>

          {/* Canvas and Legend */}
          <div className='flex gap-4 mb-4'>
            {/* Canvas */}
            <div className='flex-shrink-0'>
              <canvas
                ref={canvasRef}
                className='rounded-lg shadow-lg'
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Legend - sorted by pixel count (largest first) */}
            <div className='flex-1 overflow-y-auto max-h-[600px]'>
              <div className='space-y-2'>
                {[...paintState.regions].map(region => {
                  const displayColor = region.filled
                    ? region.customColor || region.color
                    : region.color;

                  return (
                    <div
                      key={region.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        region.filled
                          ? 'bg-gray-700/50 opacity-60'
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                    >
                      {/* Color swatch */}
                      <div
                        className='w-8 h-8 rounded border-2 border-gray-600 flex-shrink-0'
                        style={{ backgroundColor: displayColor }}
                      />

                      {/* Region number */}
                      <div className='flex items-center gap-2 flex-1'>
                        <span className='font-bold text-lg text-white'>
                          #{region.id}
                        </span>
                        {region.filled && (
                          <span className='text-green-400 text-sm'>✓</span>
                        )}
                      </div>

                      {/* Filled by info */}
                      {region.filled && region.filledBy && (
                        <span className='text-xs text-gray-400'>
                          by {region.filledBy}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-300'>
                {filledRegions} / {totalRegions} regions filled
              </span>
              <span className='text-purple-400 font-bold'>{progress}%</span>
            </div>
            <div className='h-3 bg-gray-700/50 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500'
                style={{ width: `${progress}%` }}
              />
            </div>
            {isComplete && (
              <div className='text-center mt-3'>
                <div className='text-2xl font-bold text-green-400 animate-pulse'>
                  🎉 Complete! 🎉
                </div>
                {paintState.lastFilledBy && (
                  <div className='text-sm text-gray-400 mt-1'>
                    Finished by {paintState.lastFilledBy}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
