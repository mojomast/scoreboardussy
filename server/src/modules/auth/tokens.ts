import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export type UserRole = 'referee' | 'display' | 'viewer';

export interface RoomTokenPayload {
  roomId: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // In development, generate a random secret if not provided
    console.warn('WARNING: JWT_SECRET not set. Using random development secret.');
    return 'dev-' + crypto.randomBytes(32).toString('hex');
  }
  return secret;
};

// Cache the secret after first access
let cachedSecret: string | null = null;
const getCachedSecret = (): string => {
  if (!cachedSecret) {
    cachedSecret = getJwtSecret();
  }
  return cachedSecret;
};

// Interop token for external integrations (e.g., mon-pacing)
export interface InteropTokenPayload {
  matchId: string;
  scope: 'monpacing';
}

export function signInteropToken(payload: InteropTokenPayload, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload, getCachedSecret(), { expiresIn: expiresIn as any } as SignOptions);
}

export const verifyInteropToken = (token: string): InteropTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getCachedSecret());
    if (typeof decoded === 'string') return null;
    const { matchId, scope } = decoded as any;
    if (!matchId || scope !== 'monpacing') return null;
    return { matchId, scope };
  } catch {
    return null;
  }
};

export function signRoomToken(payload: RoomTokenPayload, expiresIn: string | number = '12h'): string {
  return jwt.sign(payload, getCachedSecret(), { expiresIn: expiresIn as any } as SignOptions);
}

export const verifyRoomToken = (token: string): RoomTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getCachedSecret());
    if (typeof decoded === 'string') return null;
    const { roomId, role } = decoded as any;
    if (!roomId || !role) return null;
    return { roomId, role };
  } catch {
    return null;
  }
};
