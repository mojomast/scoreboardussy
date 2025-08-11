import jwt, { SignOptions } from 'jsonwebtoken';

export type UserRole = 'referee' | 'display' | 'viewer';

export interface RoomTokenPayload {
  roomId: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
};

// Interop token for external integrations (e.g., mon-pacing)
export interface InteropTokenPayload {
  matchId: string;
  scope: 'monpacing';
}

export function signInteropToken(payload: InteropTokenPayload, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload as any, getJwtSecret(), { expiresIn: expiresIn as any } as any);
}

export const verifyInteropToken = (token: string): InteropTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string') return null;
    const { matchId, scope } = decoded as any;
    if (!matchId || scope !== 'monpacing') return null;
    return { matchId, scope };
  } catch {
    return null;
  }
};

export function signRoomToken(payload: RoomTokenPayload, expiresIn: string | number = '12h'): string {
  return jwt.sign(payload as any, getJwtSecret(), { expiresIn: expiresIn as any } as any);
}

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
