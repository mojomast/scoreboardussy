import { randomUUID } from 'crypto';
import crypto from 'crypto';

export type Role = 'referee' | 'display' | 'viewer';

export interface Room {
  id: string;
  code: string; // short code for URLs
  secrets: Record<Role, string>; // plain for M1; hash in M2
  createdAt: number;
}

const roomsById = new Map<string, Room>();
const roomsByCode = new Map<string, Room>();

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const genSecret = () => crypto.randomBytes(16).toString('hex');

export const createRoom = (): Room => {
  const id = randomUUID();
  let code = genCode();
  while (roomsByCode.has(code)) code = genCode();
  const secrets = {
    referee: genSecret(),
    display: genSecret(),
    viewer: genSecret(),
  } as const;
  const room: Room = { id, code, secrets: { ...secrets }, createdAt: Date.now() };
  roomsById.set(id, room);
  roomsByCode.set(code, room);
  return room;
};

export const findRoomByCode = (code: string): Room | undefined => roomsByCode.get(code);
export const findRoomById = (id: string): Room | undefined => roomsById.get(id);
