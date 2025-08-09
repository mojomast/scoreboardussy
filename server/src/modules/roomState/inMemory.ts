import { RoomStateService } from './types';
import { ScoreboardState } from '../../types/scoreboard.types';
import { getState as getGlobalState } from '../state';

export class InMemoryRoomState implements RoomStateService {
  private store = new Map<string, ScoreboardState>();

  async get(roomId: string): Promise<ScoreboardState | null> {
    return this.store.get(roomId) ?? null;
  }

  async set(roomId: string, state: ScoreboardState): Promise<void> {
    this.store.set(roomId, state);
  }

  async update(roomId: string, updater: (prev: ScoreboardState) => ScoreboardState): Promise<ScoreboardState> {
    const prev = this.store.get(roomId) ?? getGlobalState();
    const next = updater(prev);
    this.store.set(roomId, next);
    return next;
  }
}
