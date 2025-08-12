import { RoomStateService } from './types';
import { InMemoryRoomState } from './inMemory';

let service: RoomStateService | null = null;

export function getRoomStateService(): RoomStateService {
  if (!service) {
    // Default to in-memory; wiring to Redis will happen when Phase B toggles it via env
    service = new InMemoryRoomState();
  }
  return service;
}
