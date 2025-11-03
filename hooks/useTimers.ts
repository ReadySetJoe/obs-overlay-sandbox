// hooks/useTimers.ts
import { useState, useEffect, useCallback } from 'react';
import { CountdownTimer } from '@/types/overlay';

interface UseTimersProps {
  sessionId: string | undefined;
  session: any;
}

export function useTimers({ sessionId, session }: UseTimersProps) {
  const [timers, setTimers] = useState<CountdownTimer[]>([]);
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);
  const [newTimerTitle, setNewTimerTitle] = useState('');
  const [newTimerDescription, setNewTimerDescription] = useState('');
  const [newTimerDate, setNewTimerDate] = useState('');

  // Load timers when session is ready
  useEffect(() => {
    if (!session || !sessionId) return;

    const loadTimers = async () => {
      try {
        const response = await fetch(`/api/timers/list?sessionId=${sessionId}`);
        if (response.ok) {
          const { timers } = await response.json();
          setTimers(timers);
        }
      } catch (error) {
        console.error('Error loading timers:', error);
      }
    };

    loadTimers();
  }, [session, sessionId]);

  const startEditingTimer = useCallback((timer: CountdownTimer) => {
    setEditingTimerId(timer.id);
    setNewTimerTitle(timer.title);
    setNewTimerDescription(timer.description || '');
    setNewTimerDate(new Date(timer.targetDate).toISOString().slice(0, 16));
    setShowTimerForm(true);
  }, []);

  const cancelTimerForm = useCallback(() => {
    setShowTimerForm(false);
    setEditingTimerId(null);
    setNewTimerTitle('');
    setNewTimerDescription('');
    setNewTimerDate('');
  }, []);

  const createTimer = useCallback(async () => {
    if (!session || !sessionId || !newTimerTitle || !newTimerDate) return;

    try {
      if (editingTimerId) {
        const response = await fetch(`/api/timers/${editingTimerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTimerTitle,
            description: newTimerDescription,
            targetDate: new Date(newTimerDate).toISOString(),
          }),
        });

        if (response.ok) {
          const { timer } = await response.json();
          setTimers(prev => prev.map(t => (t.id === editingTimerId ? timer : t)));
          cancelTimerForm();
        }
      } else {
        const response = await fetch('/api/timers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            title: newTimerTitle,
            description: newTimerDescription,
            targetDate: new Date(newTimerDate).toISOString(),
          }),
        });

        if (response.ok) {
          const { timer } = await response.json();
          setTimers(prev => [...prev, timer]);
          cancelTimerForm();
        }
      }
    } catch (error) {
      console.error('Error saving timer:', error);
    }
  }, [session, sessionId, newTimerTitle, newTimerDescription, newTimerDate, editingTimerId, cancelTimerForm]);

  const deleteTimer = useCallback(async (timerId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTimers(prev => prev.filter(t => t.id !== timerId));
      }
    } catch (error) {
      console.error('Error deleting timer:', error);
    }
  }, [session]);

  const toggleTimer = useCallback(async (timerId: string, isActive: boolean) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        const { timer } = await response.json();
        setTimers(prev => prev.map(t => (t.id === timerId ? timer : t)));
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
    }
  }, [session]);

  return {
    timers,
    showTimerForm,
    editingTimerId,
    newTimerTitle,
    newTimerDescription,
    newTimerDate,
    setShowTimerForm,
    setNewTimerTitle,
    setNewTimerDescription,
    setNewTimerDate,
    startEditingTimer,
    cancelTimerForm,
    createTimer,
    deleteTimer,
    toggleTimer,
  };
}
