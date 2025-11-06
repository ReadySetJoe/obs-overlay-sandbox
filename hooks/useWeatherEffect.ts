// hooks/useWeatherEffect.ts
import { WeatherEffect } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketState } from './useSocketState';

interface UseWeatherEffectProps {
  socket: Socket | null;
}

export function useWeatherEffect({ socket }: UseWeatherEffectProps) {
  const {
    value: weatherEffect,
    setValue: setWeatherEffect,
    emitValue: changeWeather,
  } = useSocketState<WeatherEffect>(socket, 'weather-change', 'none');

  return {
    weatherEffect,
    setWeatherEffect,
    changeWeather,
  };
}
