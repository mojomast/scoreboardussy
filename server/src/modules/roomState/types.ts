import { ScoreboardState } from '../../types/scoreboard.types';

export interface RoomStateService {
  get(roomId: string): Promise<ScoreboardState | null>;
  set(roomId: string, state: ScoreboardState): Promise<void>;
  update(roomId: string, updater: (prev: ScoreboardState) => ScoreboardState): Promise<ScoreboardState>;
}
