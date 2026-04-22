import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { prisma } from '../db';
import { logger } from '../config/logger';

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

export const createRoom = async (): Promise<Room> => {
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

  // Persist to database (upsert)
  try {
    await prisma.room.upsert({
      where: { code: room.code },
      update: { id: room.id },
      create: { id: room.id, code: room.code },
    });
  } catch (dbError) {
    logger.warn('Failed to persist room to database:', dbError);
  }

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

export const deleteRoom = async (roomId: string): Promise<boolean> => {
  const room = roomsById.get(roomId);
  if (!room) return false;
  roomsById.delete(roomId);
  roomsByCode.delete(room.code);

  // Remove from database
  try {
    await prisma.room.deleteMany({ where: { id: roomId } });
  } catch (dbError) {
    logger.warn('Failed to delete room from database:', dbError);
  }

  return true;
};

export const cleanupExpiredRooms = async (): Promise<number> => {
  const now = Date.now();
  let cleaned = 0;
  const expiredRooms: Room[] = [];
  for (const room of roomsById.values()) {
    if (room.expiresAt < now) {
      expiredRooms.push(room);
    }
  }
  for (const room of expiredRooms) {
    await deleteRoom(room.id);
    cleaned++;
  }
  return cleaned;
};

export const importRoomsFromDb = (dbRooms: Array<{ id: string; code: string; createdAt: Date }>): void => {
  for (const dbRoom of dbRooms) {
    const room: Room = {
      id: dbRoom.id,
      code: dbRoom.code,
      secrets: {
        referee: genSecret(),
        display: genSecret(),
        viewer: genSecret(),
      },
      createdAt: dbRoom.createdAt.getTime(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    };
    roomsById.set(room.id, room);
    roomsByCode.set(room.code, room);
  }
};
