// components/overlay/WeatherEffect.tsx
'use client';

import { useEffect, useRef } from 'react';
import { WeatherEffect as WeatherEffectType } from '@/types/overlay';

interface WeatherEffectProps {
  effect: WeatherEffectType;
  density?: number;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  wobble?: number; // For leaves, sakura
  rotation?: number; // For leaves, sakura
  rotationSpeed?: number; // For leaves, sakura
  color?: string; // For leaves, confetti
  opacity?: number; // For stars
  pulseSpeed?: number; // For stars, hearts
}

export default function WeatherEffect({
  effect,
  density = 1,
}: WeatherEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const createParticle = (): Particle => {
      const baseParticle = {
        x: Math.random() * canvas.width,
        y: -10,
        speed: 1,
        size: 3,
      };

      switch (effect) {
        case 'rain':
          return {
            ...baseParticle,
            speed: Math.random() * 5 + 5,
            size: Math.random() * 2 + 1,
          };

        case 'snow':
          return {
            ...baseParticle,
            speed: Math.random() * 1 + 0.5,
            size: Math.random() * 3 + 2,
          };

        case 'confetti':
          const colors = [
            '#ff6b6b',
            '#4ecdc4',
            '#45b7d1',
            '#f9ca24',
            '#6c5ce7',
            '#ff69b4',
          ];
          return {
            ...baseParticle,
            speed: Math.random() * 3 + 2,
            size: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
          };

        case 'hearts':
          return {
            ...baseParticle,
            speed: Math.random() * 1.5 + 0.5,
            size: Math.random() * 10 + 15,
            wobble: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.05 + 0.02,
          };

        case 'stars':
          return {
            ...baseParticle,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0,
            size: Math.random() * 2 + 1,
            opacity: Math.random(),
            pulseSpeed: Math.random() * 0.02 + 0.01,
          };

        case 'bubbles':
          return {
            ...baseParticle,
            y: canvas.height + 10,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 20 + 10,
            wobble: Math.random() * Math.PI * 2,
          };

        case 'leaves':
          const leafColors = [
            '#ff6b35',
            '#f7931e',
            '#fdc500',
            '#c1876b',
            '#96351e',
          ];
          return {
            ...baseParticle,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 8 + 6,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 5 - 2.5,
            wobble: Math.random() * Math.PI * 2,
            color: leafColors[Math.floor(Math.random() * leafColors.length)],
          };

        case 'sakura':
          return {
            ...baseParticle,
            speed: Math.random() * 1.5 + 0.5,
            size: Math.random() * 8 + 8,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 3 - 1.5,
            wobble: Math.random() * Math.PI * 2,
          };

        default:
          return baseParticle;
      }
    };

    // Initialize particles
    const getParticleCount = () => {
      const baseCounts: Record<WeatherEffectType, number> = {
        rain: 150,
        snow: 100,
        confetti: 80,
        hearts: 30,
        stars: 50,
        bubbles: 40,
        leaves: 60,
        sakura: 50,
      };
      return Math.floor((baseCounts[effect] || 100) * density);
    };

    const particleCount = getParticleCount();
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle();
      // Spread out initial positions for some effects
      if (effect !== 'stars') {
        particle.y = Math.random() * canvas.height;
      }
      particlesRef.current.push(particle);
    }

    const drawRain = (p: Particle) => {
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 10);
      ctx.stroke();
    };

    const drawSnow = (p: Particle) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConfetti = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(((p.rotation || 0) * Math.PI) / 180);
      ctx.fillStyle = p.color || '#ff6b6b';
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 3);
      ctx.restore();
    };

    const drawHeart = (p: Particle) => {
      const size = p.size * (1 + Math.sin((p.wobble || 0) * 10) * 0.1);
      ctx.fillStyle = 'rgba(255, 105, 180, 0.7)';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + size / 4);
      ctx.bezierCurveTo(
        p.x,
        p.y,
        p.x - size / 2,
        p.y - size / 2,
        p.x,
        p.y - size / 4
      );
      ctx.bezierCurveTo(
        p.x + size / 2,
        p.y - size / 2,
        p.x,
        p.y,
        p.x,
        p.y + size / 4
      );
      ctx.fill();
    };

    const drawStar = (p: Particle) => {
      const opacity = p.opacity || 0.5;
      ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const x = p.x + Math.cos(angle) * p.size * 2;
        const y = p.y + Math.sin(angle) * p.size * 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        const innerAngle = angle + Math.PI / 5;
        const innerX = p.x + Math.cos(innerAngle) * p.size;
        const innerY = p.y + Math.sin(innerAngle) * p.size;
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawBubble = (p: Particle) => {
      // Draw bubble with gradient
      const gradient = ctx.createRadialGradient(
        p.x - p.size / 3,
        p.y - p.size / 3,
        0,
        p.x,
        p.y,
        p.size
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(174, 194, 224, 0.2)');
      gradient.addColorStop(1, 'rgba(174, 194, 224, 0.1)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(p.x - p.size / 3, p.y - p.size / 3, p.size / 4, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(((p.rotation || 0) * Math.PI) / 180);

      // Draw leaf shape
      ctx.fillStyle = p.color || '#ff6b35';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 2, p.size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw vein
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();

      ctx.restore();
    };

    const drawSakura = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(((p.rotation || 0) * Math.PI) / 180);

      // Draw 5 petals
      ctx.fillStyle = 'rgba(255, 182, 193, 0.8)';
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * i) / 5);
        ctx.beginPath();
        ctx.ellipse(0, p.size / 2, p.size / 3, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        // Update based on effect type
        switch (effect) {
          case 'rain':
            p.y += p.speed;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
            drawRain(p);
            break;

          case 'snow':
            p.y += p.speed;
            p.x += Math.sin(p.y / 30) * 0.5;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
            drawSnow(p);
            break;

          case 'confetti':
            p.y += p.speed;
            p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
            drawConfetti(p);
            break;

          case 'hearts':
            p.y += p.speed;
            p.wobble = (p.wobble || 0) + (p.pulseSpeed || 0.03);
            p.x += Math.sin(p.wobble || 0) * 2;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
              p.wobble = Math.random() * Math.PI * 2;
            }
            drawHeart(p);
            break;

          case 'stars':
            // Twinkling effect
            p.opacity =
              (p.opacity || 0) +
              (p.pulseSpeed || 0.01) * (Math.random() > 0.5 ? 1 : -1);
            p.opacity = Math.max(0.1, Math.min(1, p.opacity));
            drawStar(p);
            break;

          case 'bubbles':
            p.y -= p.speed;
            p.wobble = (p.wobble || 0) + 0.05;
            p.x += Math.sin(p.wobble || 0) * 1.5;
            if (p.y < -p.size) {
              p.y = canvas.height + 10;
              p.x = Math.random() * canvas.width;
              p.wobble = Math.random() * Math.PI * 2;
            }
            drawBubble(p);
            break;

          case 'leaves':
            p.y += p.speed;
            p.wobble = (p.wobble || 0) + 0.05;
            p.x += Math.sin(p.wobble || 0) * 2;
            p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
              p.wobble = Math.random() * Math.PI * 2;
            }
            drawLeaf(p);
            break;

          case 'sakura':
            p.y += p.speed;
            p.wobble = (p.wobble || 0) + 0.03;
            p.x += Math.sin(p.wobble || 0) * 1.5;
            p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
              p.wobble = Math.random() * Math.PI * 2;
            }
            drawSakura(p);
            break;
        }
      });

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
      particlesRef.current = [];
    };
  }, [effect, density]);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none'
      style={{ zIndex: 2 }}
    />
  );
}
