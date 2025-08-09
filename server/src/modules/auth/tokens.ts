import jwt from 'jsonwebtoken';

export type UserRole = 'referee' | 'display' | 'viewer';

export interface RoomTokenPayload {
  roomId: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
};

export const signRoomToken = (payload: RoomTokenPayload, expiresIn: string = '12h'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyRoomToken = (token: string): RoomTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string') return null;
    const { roomId, role } = decoded as any;
    if (!roomId || !role) return null;
    return { roomId, role };
  } catch {
    return null;
  }
};
