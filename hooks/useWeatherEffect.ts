// hooks/useWeatherEffect.ts
import { useState, useCallback } from 'react';
import { WeatherEffect } from '@/types/overlay';
import { Socket } from 'socket.io-client';

interface UseWeatherEffectProps {
  socket: Socket | null;
}

export function useWeatherEffect({ socket }: UseWeatherEffectProps) {
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');

  const changeWeather = useCallback(
    (effect: WeatherEffect) => {
      if (!socket) return;
      setWeatherEffect(effect);
      socket.emit('weather-change', effect);
    },
    [socket]
  );

  return {
    weatherEffect,
    setWeatherEffect,
    changeWeather,
  };
}
