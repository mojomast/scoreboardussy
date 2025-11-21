import { randomUUID } from 'crypto';
import crypto from 'crypto';

export type Role = 'referee' | 'display' | 'viewer';

export interface Room {
  id: string;
  code: string; // short code for URLs
  secrets: Record<Role, string>; // plain for M1; hash in M2
  createdAt: number;
  lastActivity: number; // timestamp of last activity
  expiresAt: number; // when room should be cleaned up
}

const roomsById = new Map<string, Room>();
const roomsByCode = new Map<string, Room>();

// Generate 6-character alphanumeric code (avoiding ambiguous characters)
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, I, 1, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const genSecret = () => crypto.randomBytes(16).toString('hex');

// Default TTL: 2 hours
const DEFAULT_TTL_MS = parseInt(process.env.ROOM_TTL_HOURS || '2', 10) * 60 * 60 * 1000;

export const createRoom = (): Room => {
  const id = randomUUID();
  let code = genCode();
  while (roomsByCode.has(code)) code = genCode();
  const secrets = {
    referee: genSecret(),
    display: genSecret(),
    viewer: genSecret(),
  } as const;
  const now = Date.now();
  const room: Room = { 
    id, 
    code, 
    secrets: { ...secrets }, 
    createdAt: now,
    lastActivity: now,
    expiresAt: now + DEFAULT_TTL_MS
  };
  roomsById.set(id, room);
  roomsByCode.set(code, room);
  return room;
};

export const findRoomByCode = (code: string): Room | undefined => roomsByCode.get(code);
export const findRoomById = (id: string): Room | undefined => roomsById.get(id);

export const updateRoomActivity = (roomId: string): void => {
  const room = roomsById.get(roomId);
  if (room) {
    const now = Date.now();
    room.lastActivity = now;
    room.expiresAt = now + DEFAULT_TTL_MS;
  }
};

export const getAllRooms = (): Room[] => Array.from(roomsById.values());

export const deleteRoom = (roomId: string): boolean => {
  const room = roomsById.get(roomId);
  if (!room) return false;
  roomsById.delete(roomId);
  roomsByCode.delete(room.code);
  return true;
};

export const cleanupExpiredRooms = (): number => {
  const now = Date.now();
  let cleaned = 0;
  for (const room of roomsById.values()) {
    if (room.expiresAt < now) {
      deleteRoom(room.id);
      cleaned++;
    }
  }
  return cleaned;
};

