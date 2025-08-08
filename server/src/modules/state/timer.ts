import { updateState, getState } from './index';

export const getInitialTimerState = () => ({
  timer: {
    status: 'stopped' as 'started' | 'paused' | 'stopped',
    durationSec: 0,
    remainingSec: 0,
    startedAt: null as number | null,
  },
});

export function startTimer(durationSec: number) {
  const now = Date.now();
  updateState({
    timer: {
      status: 'started',
      durationSec,
      remainingSec: durationSec,
      startedAt: now,
    } as any,
  });
}

export function pauseTimer() {
  const s = getState();
  const t = s.timer;
  if (!t) return;
  if (t.status !== 'started' || !t.startedAt) return;
  const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
  const remaining = Math.max(0, (t.remainingSec ?? t.durationSec) - elapsed);
  updateState({
    timer: {
      status: 'paused',
      durationSec: t.durationSec,
      remainingSec: remaining,
      startedAt: null,
    } as any,
  });
}

export function resumeTimer() {
  const s = getState();
  const t = s.timer;
  if (!t) return;
  if (t.status !== 'paused') return;
  updateState({
    timer: {
      status: 'started',
      durationSec: t.durationSec,
      remainingSec: t.remainingSec,
      startedAt: Date.now(),
    } as any,
  });
}

export function stopTimer() {
  updateState({
    timer: {
      status: 'stopped',
      durationSec: 0,
      remainingSec: 0,
      startedAt: null,
    } as any,
  });
}

export function tickTimer() {
  const s = getState();
  const t = s.timer;
  if (!t || t.status !== 'started' || !t.startedAt) return;
  const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
  const remaining = Math.max(0, (t.remainingSec ?? t.durationSec) - elapsed);
  if (remaining <= 0) {
    stopTimer();
  } else {
    updateState({ timer: { ...t, remainingSec: remaining } as any });
  }
}

