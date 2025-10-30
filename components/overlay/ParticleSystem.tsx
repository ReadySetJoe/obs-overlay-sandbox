// components/overlay/ParticleSystem.tsx
'use client';

import { useEffect, useRef } from 'react';
import { AudioFrequencyData } from '@/hooks/useAudioAnalyzer';

interface ParticleSystemProps {
  audioLevel: number;
  frequencyData?: AudioFrequencyData;
  colorScheme: string;
  size?: number; // Scale factor (0.5 to 2.0)
  x?: number; // X position as percentage (0-100)
  y?: number; // Y position as percentage (0-100)
}

const schemeColors: Record<string, string[]> = {
  default: ['#3b82f6', '#8b5cf6', '#ec4899'],
  gaming: ['#ef4444', '#f59e0b', '#10b981'],
  chill: ['#06b6d4', '#8b5cf6', '#ec4899'],
  energetic: ['#f59e0b', '#ef4444', '#ec4899'],
  dark: ['#6b7280', '#4b5563', '#374151'],
  neon: ['#0ff', '#f0f', '#ff0'],
};

export default function ParticleSystem({
  audioLevel,
  frequencyData,
  colorScheme,
  size = 1.0,
  x = 50,
  y = 50,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = (canvas.width * x) / 100;
    const centerY = (canvas.height * y) / 100;
    const colors = schemeColors[colorScheme] || schemeColors.default;

    // Visual parameters scaled by size prop
    const numBars = 64;
    const barWidth = 8 * size;
    const minBarHeight = 5 * size;
    const maxBarHeight = 150 * size;
    const radius = 200 * size;

    const animate = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bass = frequencyData?.bass || audioLevel * 0.3;
      const mid = frequencyData?.mid || audioLevel * 0.5;
      const treble = frequencyData?.treble || audioLevel * 0.3;
      const frequencies = frequencyData?.frequencies || new Uint8Array(numBars);

      // 1. BASS PULSE - Radial glow effect
      if (bass > 30) {
        const pulseSize = (100 + bass * 3) * size;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          pulseSize
        );
        gradient.addColorStop(
          0,
          `${colors[0]}${Math.floor(bass * 0.8)
            .toString(16)
            .padStart(2, '0')}`
        );
        gradient.addColorStop(0.5, `${colors[0]}20`);
        gradient.addColorStop(1, `${colors[0]}00`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. CIRCULAR FREQUENCY BARS
      const step = Math.floor(frequencies.length / numBars);
      for (let i = 0; i < numBars; i++) {
        const freqIndex = i * step;
        const value =
          frequencies.length > 0 ? frequencies[freqIndex] / 255 : 0.3;

        const angle = (Math.PI * 2 * i) / numBars - Math.PI / 2;
        const barHeight = minBarHeight + value * maxBarHeight;

        // Position at radius distance from center
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        // Color based on frequency range
        let barColor = colors[0];
        if (i < numBars / 3)
          barColor = colors[0]; // Low frequencies
        else if (i < (numBars * 2) / 3)
          barColor = colors[1]; // Mid frequencies
        else barColor = colors[2]; // High frequencies

        // Draw bar
        ctx.strokeStyle = barColor;
        ctx.lineWidth = barWidth;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8 + value * 0.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Add glow effect on high values
        if (value > 0.7) {
          ctx.strokeStyle = barColor;
          ctx.lineWidth = barWidth + 4;
          ctx.globalAlpha = (value - 0.7) * 0.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // 3. CENTER WAVEFORM
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = colors[1];
      ctx.lineWidth = 3 * size;
      ctx.beginPath();

      const waveRadius = (80 + mid * 1.5) * size;
      const wavePoints = 32;
      for (let i = 0; i <= wavePoints; i++) {
        const angle = (Math.PI * 2 * i) / wavePoints;
        const freqIndex = Math.floor((i / wavePoints) * frequencies.length);
        const value =
          frequencies.length > 0 ? frequencies[freqIndex] / 255 : 0.3;
        const r = waveRadius + value * 30 * size;

        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, frequencyData, colorScheme, size, x, y]);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none'
      style={{ zIndex: 1 }}
    />
  );
}
