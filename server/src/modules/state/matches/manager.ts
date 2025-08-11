import { MatchState, CreateMatchPayload, MatchPenaltyPayload, MatchResults, MatchScorePayload, TimerSetPayload, TimerStartPayload, TimerState } from '../../../types/match.types';
import { Server } from 'socket.io';

// Simple in-memory manager; can be evolved to persistent storage later
class MatchStateManager {
  private matches = new Map<string, MatchState>();
  private timers = new Map<string, NodeJS.Timeout>();
  private io: Server | null = null;

  public attachIo(io: Server) {
    this.io = io as any;
  }

  // Utility to generate ids
  private genId(prefix: string = 'id'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  public createMatch(payload: CreateMatchPayload, forcedId?: string): string {
    const matchId = forcedId && !this.matches.has(forcedId) ? forcedId : this.genId('match');
    const now = Date.now();
    const state: MatchState = {
      matchId,
      name: payload.name,
      teams: payload.teams,
      status: 'setup',
      score: { team1: 0, team2: 0 },
      penalties: { team1: [], team2: [] },
      timer: null,
      metadata: { createdAt: now, updatedAt: now },
    };
    this.matches.set(matchId, state);
    return matchId;
  }

  public getMatch(matchId: string): MatchState | null {
    const m = this.matches.get(matchId);
    return m ? JSON.parse(JSON.stringify(m)) : null;
  }

  private update(matchId: string, update: Partial<MatchState>) {
    const current = this.matches.get(matchId);
    if (!current) return;
    const next: MatchState = {
      ...current,
      ...update,
      score: update.score ? { ...current.score, ...update.score } : current.score,
      penalties: update.penalties ? { ...current.penalties, ...update.penalties } : current.penalties,
      metadata: { ...current.metadata, updatedAt: Date.now() },
    };
    this.matches.set(matchId, next);
    // Broadcast
    this.io?.to(`match:${matchId}`).emit('matchStateUpdate', this.getMatch(matchId));
  }

  public updateScore(payload: MatchScorePayload) {
    const current = this.matches.get(payload.matchId);
    if (!current) return;
    const nextScore = { ...current.score };
    if (payload.team === 'team1') nextScore.team1 += payload.points; else nextScore.team2 += payload.points;
    this.update(payload.matchId, { score: nextScore });
  }

  public addPenalty(payload: MatchPenaltyPayload) {
    const current = this.matches.get(payload.matchId);
    if (!current) return;
    const list = payload.team === 'team1' ? [...current.penalties.team1] : [...current.penalties.team2];
    list.push({ kind: payload.kind, at: Date.now() });
    const penalties = payload.team === 'team1' ? { team1: list, team2: current.penalties.team2 } : { team1: current.penalties.team1, team2: list };
    this.update(payload.matchId, { penalties });
  }

  // Timers
  public startTimer(payload: TimerStartPayload): TimerState | null {
    const current = this.matches.get(payload.matchId);
    if (!current) return null;

    // Stop existing timer if any
    if (current.timer) this.stopTimer({ matchId: payload.matchId, timerId: current.timer.timerId });

    const timerId = this.genId('timer');
    const now = Date.now();
    const timer: TimerState = {
      matchId: payload.matchId,
      timerId,
      type: payload.type,
      duration: payload.duration,
      remaining: payload.duration,
      status: payload.autoStart === false ? 'paused' : 'running',
      startedAt: now,
      updatedAt: now,
    };

    this.update(payload.matchId, { timer });

    if (timer.status === 'running') {
      this.runInterval(timer);
    }

    return this.getMatch(payload.matchId)?.timer ?? null;
  }

  private runInterval(timer: TimerState) {
    const key = `${timer.matchId}:${timer.timerId}`;
    const startedAt = Date.now();
    const initialRemainingMs = timer.remaining * 1000;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      let remainingMs = Math.max(0, initialRemainingMs - elapsedMs);
      const remaining = Math.ceil(remainingMs / 1000);

      const current = this.matches.get(timer.matchId);
      if (!current || !current.timer || current.timer.timerId !== timer.timerId) {
        clearInterval(interval);
        this.timers.delete(key);
        return;
      }

      const tick: TimerState = {
        ...current.timer,
        remaining,
        status: remaining > 0 ? 'running' : 'expired',
        updatedAt: Date.now(),
      };

      // Update in state without resetting start
      this.matches.set(timer.matchId, { ...current, timer: tick, metadata: { ...current.metadata, updatedAt: Date.now() } });

      // Broadcast high-frequency timer updates to room
      this.io?.to(`match:${timer.matchId}`).emit('timerUpdate', tick);

      if (remaining <= 0) {
        clearInterval(interval);
        this.timers.delete(key);
      }
    }, 100);

    this.timers.set(key, interval);
  }

  public pauseTimer(payload: { matchId: string; timerId: string }) {
    const current = this.matches.get(payload.matchId);
    if (!current || !current.timer || current.timer.timerId !== payload.timerId) return;

    const key = `${payload.matchId}:${payload.timerId}`;
    const handle = this.timers.get(key);
    if (handle) {
      clearInterval(handle);
      this.timers.delete(key);
    }

    const timer = { ...current.timer, status: 'paused' as const, updatedAt: Date.now() };
    this.update(payload.matchId, { timer });
  }

  public resumeTimer(payload: { matchId: string; timerId: string }) {
    const current = this.matches.get(payload.matchId);
    if (!current || !current.timer || current.timer.timerId !== payload.timerId) return;

    const timer = { ...current.timer, status: 'running' as const, updatedAt: Date.now() };
    this.update(payload.matchId, { timer });
    this.runInterval(timer);
  }

  public stopTimer(payload: { matchId: string; timerId: string }) {
    const current = this.matches.get(payload.matchId);
    if (!current) return;

    const key = `${payload.matchId}:${payload.timerId}`;
    const handle = this.timers.get(key);
    if (handle) {
      clearInterval(handle);
      this.timers.delete(key);
    }

    // Clear timer from match state
    this.update(payload.matchId, { timer: null });
  }

  public setTimerDuration(payload: TimerSetPayload) {
    const current = this.matches.get(payload.matchId);
    if (!current || !current.timer || current.timer.timerId !== payload.timerId) return;

    // Set new duration and remaining; keep paused state
    const timer: TimerState = {
      ...current.timer,
      duration: payload.duration,
      remaining: payload.duration,
      status: 'paused',
      updatedAt: Date.now(),
    };
    this.update(payload.matchId, { timer });
  }
}

export const matchStateManager = new MatchStateManager();
