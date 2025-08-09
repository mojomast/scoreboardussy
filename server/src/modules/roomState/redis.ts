import { RoomStateService } from './types';
import { ScoreboardState } from '../../types/scoreboard.types';
import Redis from 'ioredis';

const key = (roomId: string) => `room:${roomId}:state`;

export class RedisRoomState implements RoomStateService {
  constructor(private redis: Redis) {}

  async get(roomId: string): Promise<ScoreboardState | null> {
    const json = await this.redis.get(key(roomId));
    return json ? (JSON.parse(json) as ScoreboardState) : null;
  }

  async set(roomId: string, state: ScoreboardState): Promise<void> {
    await this.redis.set(key(roomId), JSON.stringify(state));
  }

  async update(roomId: string, updater: (prev: ScoreboardState) => ScoreboardState): Promise<ScoreboardState> {
    // Simple get-update-set; can be optimized with Lua scripts if needed
    const prev = (await this.get(roomId)) as ScoreboardState;
    const next = updater(prev);
    await this.set(roomId, next);
    return next;
  }
}
