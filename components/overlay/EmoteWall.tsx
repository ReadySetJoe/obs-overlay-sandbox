// components/overlay/EmoteWall.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { EmoteWallConfig } from '@/types/overlay';

declare global {
  interface Window {
    triggerEmoteWall?: (config: EmoteWallConfig) => void;
  }
}

interface EmoteParticle {
  id: number;
  emote: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
}

export default function EmoteWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<EmoteWallConfig | null>(null);
  const particlesRef = useRef<EmoteParticle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const initializeParticles = (wallConfig: EmoteWallConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particleCount =
      wallConfig.intensity === 'light'
        ? 50
        : wallConfig.intensity === 'medium'
          ? 100
          : 200;

    const particles: EmoteParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        emote:
          wallConfig.emotes[
            Math.floor(Math.random() * wallConfig.emotes.length)
          ],
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height * 2, // Start above screen
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: Math.random() * 2 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 30 + 30,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }

    particlesRef.current = particles;
  };

  // Expose trigger function globally for socket events
  useEffect(() => {
    window.triggerEmoteWall = (wallConfig: EmoteWallConfig) => {
      setConfig(wallConfig);
      setIsActive(true);
      startTimeRef.current = Date.now();
      initializeParticles(wallConfig);
    };

    return () => {
      delete window.triggerEmoteWall;
    };
  }, []);

  useEffect(() => {
    if (!isActive || !config) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      // Check if duration has elapsed
      if (Date.now() - startTimeRef.current > config.duration) {
        setIsActive(false);
        particlesRef.current = [];
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.rotation += particle.rotationSpeed;

        // Add gravity
        particle.velocityY += 0.1;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.velocityX *= -0.8;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }

        // Remove particles that fall off screen
        if (particle.y > canvas.height + 100) {
          particle.y = -100;
          particle.x = Math.random() * canvas.width;
          particle.velocityY = Math.random() * 2 + 2;
        }

        // Draw emote
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        ctx.font = `${particle.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Check if it's an emoji or image URL
        if (particle.emote.startsWith('http')) {
          // For image URLs, we'd need to preload images
          // For now, just show a placeholder or emoji
          ctx.fillText('🎉', 0, 0);
        } else {
          // It's an emoji
          ctx.fillText(particle.emote, 0, 0);
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, config]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none'
      style={{ zIndex: 100 }}
    />
  );
}
