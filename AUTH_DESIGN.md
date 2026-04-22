# Improv Scoreboard Authentication & Authorization System Design

## Overview

Multi-tenant auth system supporting registered users (room owners) and guest access via room codes. Maintains backward compatibility with existing secret-based room access while adding user accounts, RBAC, and room ownership.

---

## 1. Database Schema Updates

### Updated Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String?
  displayName       String?
  
  // OAuth support
  oauthProvider     String?   // "google", "github", etc.
  oauthId           String?   // provider's user ID
  
  // Account status
  isEmailVerified   Boolean   @default(false)
  emailVerifiedAt   DateTime?
  
  // Subscription/plan
  plan              String    @default("free")  // "free" | "pro"
  stripeCustomerId  String?
  
  // Security
  failedLoginAttempts Int     @default(0)
  lockedUntil       DateTime?
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  
  // Relations
  rooms             Room[]
  roomMemberships   RoomMember[]
  refreshTokens     RefreshToken[]
  passwordResets    PasswordReset[]
  
  @@index([email])
  @@index([oauthProvider, oauthId])
}

model Room {
  id                String    @id @default(uuid())
  code              String    @unique
  name              String?
  
  // Ownership
  ownerId           String?
  owner             User?     @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  
  // Legacy secrets (hashed for security)
  secretReferee     String    // bcrypt hash
  secretDisplay     String    // bcrypt hash  
  secretViewer      String    // bcrypt hash
  
  // Room settings
  isPublic          Boolean   @default(false)
  allowGuestControl Boolean   @default(false)  // Can guests get referee role?
  maxViewers        Int       @default(100)
  
  // TTL / lifecycle
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastActivityAt    DateTime  @default(now())
  expiresAt         DateTime?
  
  // Relations
  events            RoomEvent[]
  snapshots         RoomSnapshot[]
  members           RoomMember[]
  accessLogs        RoomAccessLog[]
  
  @@index([code])
  @@index([ownerId])
  @@index([expiresAt])
}

model RoomMember {
  id          String   @id @default(uuid())
  roomId      String
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Guest support
  guestId     String?  @unique  // Anonymous guest identifier
  guestName   String?
  
  // Role within this room
  role        RoomRole @default(viewer)
  
  // Permissions (override defaults)
  permissions Json?    // { canEditScore: true, canManageRounds: false, ... }
  
  joinedAt    DateTime @default(now())
  lastActiveAt DateTime @default(now())
  
  @@unique([roomId, userId])
  @@unique([roomId, guestId])
  @@index([roomId])
  @@index([userId])
}

enum RoomRole {
  owner      // Full control, can delete room
  admin      // Can manage members, settings
  referee    // Can control scoring
  display    // Display-only access
  viewer     // Read-only
}

model RoomAccessLog {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  userId    String?
  guestId   String?
  ipAddress String?
  
  action    String   // "join", "leave", "role_change", "kick"
  details   Json?
  
  createdAt DateTime @default(now())
  
  @@index([roomId])
  @@index([createdAt])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?
  
  @@index([token])
  @@index([userId])
}

model PasswordReset {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  @@index([token])
}

model RoomEvent {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  type      String
  payload   Json
  createdAt DateTime @default(now())
}

model RoomSnapshot {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  version   Int
  state     Json
  createdAt DateTime @default(now())
}
```

### Migration Strategy

```bash
# 1. Create migration
npx prisma migrate dev --name add_auth_system

# 2. Backfill existing rooms with hashed secrets
# Run one-time script to hash existing room secrets
```

---

## 2. User Registration & Login Flow

### Password Requirements
- Minimum 8 characters
- At least one uppercase, one lowercase, one number
- Max 128 characters
- Rate limit: 5 attempts per 15 minutes per IP

### Registration Endpoint

```typescript
// src/modules/auth/routes.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { signAccessToken, signRefreshToken } from './tokens';
import { rateLimit } from 'express-rate-limit';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).optional(),
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);
    
    // Check existing
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password (argon2 preferred, bcrypt fallback)
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        plan: true,
        createdAt: true,
      }
    });
    
    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await signRefreshToken(user.id);
    
    res.status(201).json({
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

### Login Endpoint

```typescript
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ 
        error: 'Account locked',
        lockedUntil: user.lockedUntil 
      });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };
      
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      }
    });
    
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await signRefreshToken(user.id);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

### OAuth Login (Google Example)

```typescript
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/oauth/google', async (req, res) => {
  try {
    const { credential } = req.body; // Google ID token
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ error: 'Invalid OAuth token' });
    }
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payload.email },
          { oauthProvider: 'google', oauthId: payload.sub },
        ]
      }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          displayName: payload.name || payload.email.split('@')[0],
          oauthProvider: 'google',
          oauthId: payload.sub,
          isEmailVerified: payload.email_verified || false,
        }
      });
    } else if (!user.oauthProvider) {
      // Link OAuth to existing email account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: 'google',
          oauthId: payload.sub,
        }
      });
    }
    
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await signRefreshToken(user.id);
    
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      tokens: { accessToken, refreshToken, expiresIn: 900 }
    });
  } catch (error) {
    res.status(400).json({ error: 'OAuth authentication failed' });
  }
});
```

---

## 3. Token System (JWT + Refresh Tokens)

### Updated Token Module

```typescript
// src/modules/auth/tokens.ts
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../db/prisma';

// Token types
export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
}

export interface RoomTokenPayload {
  roomId: string;
  role: RoomRole;
  userId?: string;
  guestId?: string;
}

export type RoomRole = 'owner' | 'admin' | 'referee' | 'display' | 'viewer';

export interface InteropTokenPayload {
  matchId: string;
  scope: 'monpacing';
}

// Secrets
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET || getJwtSecret();
  return secret;
};

// Access tokens (short-lived)
export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    getJwtSecret(),
    { expiresIn: '15m', issuer: 'improv-scoreboard' }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: 'improv-scoreboard' });
    if (typeof decoded === 'string') return null;
    const { userId, email, type } = decoded as any;
    if (type !== 'access' || !userId || !email) return null;
    return { userId, email, type };
  } catch {
    return null;
  }
}

// Refresh tokens (long-lived, stored in DB)
export async function signRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    }
  });
  
  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
  
  if (!refreshToken) return null;
  if (refreshToken.revokedAt) return null;
  if (refreshToken.expiresAt < new Date()) return null;
  
  return refreshToken.userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

// Room tokens (for guest/role-based access)
export function signRoomToken(payload: RoomTokenPayload, expiresIn: string | number = '12h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn as any });
}

export const verifyRoomToken = (token: string): RoomTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string') return null;
    const { roomId, role } = decoded as any;
    if (!roomId || !role) return null;
    return { roomId, role, userId: decoded.userId, guestId: decoded.guestId };
  } catch {
    return null;
  }
};

// Interop tokens
export function signInteropToken(payload: InteropTokenPayload, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn as any });
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
```

### Token Refresh Endpoint

```typescript
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Rotate refresh token (security best practice)
    await revokeRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, plan: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = await signRefreshToken(user.id);
    
    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    
    // Also revoke all refresh tokens for this user if full logout
    if (req.query.all === 'true') {
      await prisma.refreshToken.updateMany({
        where: { userId: req.user!.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});
```

---

## 4. Middleware Implementations

### User Authentication Middleware

```typescript
// src/modules/auth/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRoomToken, AccessTokenPayload, RoomTokenPayload } from './tokens';
import { prisma } from '../db/prisma';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      roomAccess?: RoomTokenPayload;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, lockedUntil: true }
  });
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: 'Account locked' });
  }
  
  req.user = payload;
  next();
};

// Optional auth - sets req.user if token present, doesn't reject
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  
  next();
};

// Room access middleware
export const requireRoomAccess = (minRole: RoomRole = 'viewer') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const roomCode = req.params.code || req.body.roomCode;
    const roomToken = req.headers['x-room-token'] as string;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code required' });
    }
    
    // Try room token first
    if (roomToken) {
      const payload = verifyRoomToken(roomToken);
      if (payload && payload.roomId === roomCode) {
        const roleHierarchy = ['viewer', 'display', 'referee', 'admin', 'owner'];
        if (roleHierarchy.indexOf(payload.role) >= roleHierarchy.indexOf(minRole)) {
          req.roomAccess = payload;
          return next();
        }
      }
    }
    
    // Check if user has room membership
    if (req.user) {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: {
          members: {
            where: { userId: req.user.userId }
          }
        }
      });
      
      if (room?.members[0]) {
        const roleHierarchy = ['viewer', 'display', 'referee', 'admin', 'owner'];
        if (roleHierarchy.indexOf(room.members[0].role) >= roleHierarchy.indexOf(minRole)) {
          req.roomAccess = {
            roomId: room.code,
            role: room.members[0].role,
            userId: req.user.userId,
          };
          return next();
        }
      }
      
      // Room owner always has access
      if (room?.ownerId === req.user.userId) {
        req.roomAccess = {
          roomId: room.code,
          role: 'owner',
          userId: req.user.userId,
        };
        return next();
      }
    }
    
    return res.status(403).json({ error: 'Access denied for this room' });
  };
};

// Role hierarchy helper
const roleHierarchy: Record<string, number> = {
  'viewer': 0,
  'display': 1,
  'referee': 2,
  'admin': 3,
  'owner': 4,
};

export const hasRole = (userRole: string, requiredRole: string): boolean => {
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};
```

### Socket.IO Auth Middleware

```typescript
// src/modules/socket/auth.ts
import { Socket } from 'socket.io';
import { verifyAccessToken, verifyRoomToken } from '../auth/tokens';
import { prisma } from '../db/prisma';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Try user auth token
    const authToken = socket.handshake.auth?.token || socket.handshake.headers['x-auth-token'];
    const roomToken = socket.handshake.auth?.roomToken || socket.handshake.headers['x-room-token'];
    
    // Verify user token if present
    if (typeof authToken === 'string') {
      const userPayload = verifyAccessToken(authToken);
      if (userPayload) {
        socket.data.userId = userPayload.userId;
        socket.data.email = userPayload.email;
      }
    }
    
    // Verify room token if present
    if (typeof roomToken === 'string') {
      const roomPayload = verifyRoomToken(roomToken);
      if (roomPayload) {
        socket.data.roomId = roomPayload.roomId;
        socket.data.role = roomPayload.role;
        socket.data.guestId = roomPayload.guestId;
        socket.join(`room:${roomPayload.roomId}`);
        
        // Log access
        await prisma.roomAccessLog.create({
          data: {
            roomId: roomPayload.roomId,
            userId: socket.data.userId,
            guestId: roomPayload.guestId,
            ipAddress: socket.handshake.address,
            action: 'join',
          }
        });
        
        return next();
      }
    }
    
    // Allow connection without room token (will be restricted to public features)
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// Socket role check helper
export const requireSocketRole = (socket: Socket, minRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    'viewer': 0, 'display': 1, 'referee': 2, 'admin': 3, 'owner': 4
  };
  
  const userRole = socket.data.role || 'viewer';
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[minRole] || 0);
};
```

---

## 5. Room Ownership & Management

### Updated Room Store

```typescript
// src/modules/rooms/store.ts
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';
import { logger } from '../config/logger';
import { signRoomToken } from '../auth/tokens';

export type Role = 'owner' | 'admin' | 'referee' | 'display' | 'viewer';

export interface Room {
  id: string;
  code: string;
  ownerId: string | null;
  secrets: Record<Role, string>; // Hashed secrets
  isPublic: boolean;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

const roomsById = new Map<string, Room>();
const roomsByCode = new Map<string, Room>();

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const genSecret = () => crypto.randomBytes(16).toString('hex');
const DEFAULT_TTL_MS = parseInt(process.env.ROOM_TTL_HOURS || '2', 10) * 60 * 60 * 1000;

export const createRoom = async (ownerId?: string): Promise<Room & { plainSecrets: Record<Role, string> }> => {
  const id = randomUUID();
  let code = genCode();
  while (roomsByCode.has(code)) code = genCode();
  
  // Generate plain secrets for one-time display
  const plainSecrets = {
    owner: genSecret(),
    admin: genSecret(),
    referee: genSecret(),
    display: genSecret(),
    viewer: genSecret(),
  };
  
  // Hash secrets for storage
  const hashedSecrets = {
    owner: await bcrypt.hash(plainSecrets.owner, 10),
    admin: await bcrypt.hash(plainSecrets.admin, 10),
    referee: await bcrypt.hash(plainSecrets.referee, 10),
    display: await bcrypt.hash(plainSecrets.display, 10),
    viewer: await bcrypt.hash(plainSecrets.viewer, 10),
  };
  
  const now = Date.now();
  const room: Room = {
    id,
    code,
    ownerId: ownerId || null,
    secrets: hashedSecrets,
    isPublic: false,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + DEFAULT_TTL_MS,
  };
  
  roomsById.set(id, room);
  roomsByCode.set(code, room);
  
  // Persist to database
  try {
    await prisma.room.upsert({
      where: { code: room.code },
      update: {
        id: room.id,
        ownerId: room.ownerId,
        secretReferee: hashedSecrets.referee,
        secretDisplay: hashedSecrets.display,
        secretViewer: hashedSecrets.viewer,
      },
      create: {
        id: room.id,
        code: room.code,
        ownerId: room.ownerId,
        secretReferee: hashedSecrets.referee,
        secretDisplay: hashedSecrets.display,
        secretViewer: hashedSecrets.viewer,
      },
    });
    
    // If owner exists, create owner membership
    if (ownerId) {
      await prisma.roomMember.create({
        data: {
          roomId: id,
          userId: ownerId,
          role: 'owner',
        }
      });
    }
  } catch (dbError) {
    logger.warn('Failed to persist room to database:', dbError);
  }
  
  return { ...room, plainSecrets };
};

export const verifyRoomSecret = async (code: string, role: Role, secret: string): Promise<boolean> => {
  const room = roomsByCode.get(code);
  if (!room) return false;
  
  const hashedSecret = room.secrets[role];
  if (!hashedSecret) return false;
  
  return bcrypt.compare(secret, hashedSecret);
};

export const generateRoomToken = (roomId: string, role: Role, userId?: string, guestId?: string): string => {
  return signRoomToken({ roomId, role, userId, guestId });
};

// ... rest of existing functions updated to use prisma room model
```

### Room Join Endpoint (Guest Access)

```typescript
// src/modules/api/rooms.ts (additions)

// Join room with code + secret (guest access)
router.post('/:code/join', async (req, res) => {
  try {
    const { code } = req.params;
    const { secret, role = 'viewer', guestName } = req.body;
    
    const room = findRoomByCode(code.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Verify secret
    const isValid = await verifyRoomSecret(code.toUpperCase(), role as Role, secret);
    if (!isValid) {
      // Log failed attempt
      await prisma.roomAccessLog.create({
        data: {
          roomId: room.id,
          ipAddress: req.ip,
          action: 'join',
          details: { result: 'failed', reason: 'invalid_secret', attemptedRole: role },
        }
      });
      return res.status(403).json({ error: 'Invalid room secret' });
    }
    
    // Generate guest ID if not authenticated
    const guestId = req.user ? undefined : `guest_${crypto.randomBytes(8).toString('hex')}`;
    
    // Create membership record
    if (req.user) {
      await prisma.roomMember.upsert({
        where: {
          roomId_userId: { roomId: room.id, userId: req.user.userId }
        },
        update: { role: role as any, lastActiveAt: new Date() },
        create: {
          roomId: room.id,
          userId: req.user.userId,
          role: role as any,
        }
      });
    } else if (guestId) {
      await prisma.roomMember.create({
        data: {
          roomId: room.id,
          guestId,
          guestName: guestName || 'Guest',
          role: role as any,
        }
      });
    }
    
    // Generate room token
    const roomToken = generateRoomToken(
      room.code,
      role as Role,
      req.user?.userId,
      guestId
    );
    
    // Log successful access
    await prisma.roomAccessLog.create({
      data: {
        roomId: room.id,
        userId: req.user?.userId,
        guestId,
        ipAddress: req.ip,
        action: 'join',
        details: { result: 'success', role },
      }
    });
    
    res.json({
      roomToken,
      room: {
        code: room.code,
        name: room.name,
        role,
      },
      guestId, // Return for guest clients to store
    });
  } catch (error) {
    logger.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});
```

---

## 6. Password Reset Flow

```typescript
// src/modules/auth/password-reset.ts
import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';

const router = Router();

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found (prevent email enumeration)
      return res.json({ message: 'If an account exists, a reset email has been sent' });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    });
    
    // Send email (implement with your email provider)
    // await sendPasswordResetEmail(email, token);
    
    res.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
    
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Validate password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password and mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
```

---

## 7. Admin Capabilities for Room Owners

### Room Management Endpoints

```typescript
// src/modules/api/room-admin.ts
import { Router } from 'express';
import { authenticateUser, requireRoomAccess, hasRole } from '../auth/middleware';

const router = Router();

// Get room members (owner/admin only)
router.get('/:code/members', authenticateUser, requireRoomAccess('admin'), async (req, res) => {
  try {
    const { code } = req.params;
    
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true }
            }
          }
        }
      }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({
      members: room.members.map(m => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        lastActiveAt: m.lastActiveAt,
        user: m.user,
        guestName: m.guestName,
        isGuest: !m.userId,
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Update member role (owner/admin only)
router.patch('/:code/members/:memberId', authenticateUser, requireRoomAccess('admin'), async (req, res) => {
  try {
    const { code, memberId } = req.params;
    const { role } = req.body;
    
    // Cannot modify owner
    const member = await prisma.roomMember.findUnique({
      where: { id: memberId },
      include: { room: true }
    });
    
    if (!member || member.room.code !== code.toUpperCase()) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    if (member.role === 'owner') {
      return res.status(403).json({ error: 'Cannot modify owner role' });
    }
    
    // Only owner can assign admin role
    if (role === 'owner' || (role === 'admin' && req.roomAccess?.role !== 'owner')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await prisma.roomMember.update({
      where: { id: memberId },
      data: { role }
    });
    
    // Log action
    await prisma.roomAccessLog.create({
      data: {
        roomId: member.roomId,
        userId: req.user!.userId,
        action: 'role_change',
        details: { targetMemberId: memberId, newRole: role },
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Kick member (admin+)
router.delete('/:code/members/:memberId', authenticateUser, requireRoomAccess('admin'), async (req, res) => {
  try {
    const { code, memberId } = req.params;
    
    const member = await prisma.roomMember.findUnique({
      where: { id: memberId },
      include: { room: true }
    });
    
    if (!member || member.room.code !== code.toUpperCase()) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Cannot kick owner or higher/equal role
    const roleHierarchy = { viewer: 0, display: 1, referee: 2, admin: 3, owner: 4 };
    if (member.role === 'owner' || roleHierarchy[member.role] >= roleHierarchy[req.roomAccess!.role]) {
      return res.status(403).json({ error: 'Cannot remove this member' });
    }
    
    await prisma.roomMember.delete({ where: { id: memberId } });
    
    await prisma.roomAccessLog.create({
      data: {
        roomId: member.roomId,
        userId: req.user!.userId,
        action: 'kick',
        details: { removedMemberId: memberId },
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Regenerate room secrets (owner only)
router.post('/:code/regenerate-secrets', authenticateUser, requireRoomAccess('owner'), async (req, res) => {
  try {
    const { code } = req.params;
    const room = findRoomByCode(code.toUpperCase());
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Generate new secrets
    const newSecrets = {
      owner: genSecret(),
      admin: genSecret(),
      referee: genSecret(),
      display: genSecret(),
      viewer: genSecret(),
    };
    
    // Update in memory
    room.secrets = {
      owner: await bcrypt.hash(newSecrets.owner, 10),
      admin: await bcrypt.hash(newSecrets.admin, 10),
      referee: await bcrypt.hash(newSecrets.referee, 10),
      display: await bcrypt.hash(newSecrets.display, 10),
      viewer: await bcrypt.hash(newSecrets.viewer, 10),
    };
    
    // Update in database
    await prisma.room.update({
      where: { id: room.id },
      data: {
        secretReferee: room.secrets.referee,
        secretDisplay: room.secrets.display,
        secretViewer: room.secrets.viewer,
      }
    });
    
    res.json({
      message: 'Secrets regenerated',
      secrets: newSecrets, // One-time display
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate secrets' });
  }
});

// Update room settings (admin+)
router.patch('/:code/settings', authenticateUser, requireRoomAccess('admin'), async (req, res) => {
  try {
    const { code } = req.params;
    const { name, isPublic, allowGuestControl, maxViewers } = req.body;
    
    const room = await prisma.room.update({
      where: { code: code.toUpperCase() },
      data: {
        name: name !== undefined ? name : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        allowGuestControl: allowGuestControl !== undefined ? allowGuestControl : undefined,
        maxViewers: maxViewers !== undefined ? maxViewers : undefined,
      }
    });
    
    res.json({
      code: room.code,
      name: room.name,
      isPublic: room.isPublic,
      allowGuestControl: room.allowGuestControl,
      maxViewers: room.maxViewers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
```

---

## 8. Security: Preventing Room Hijacking

### Security Measures Implemented

```typescript
// src/modules/auth/security.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

// Rate limiting for room operations
import rateLimit from 'express-rate-limit';

export const roomJoinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP
  message: { error: 'Too many join attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Secret attempt tracking
export const trackSecretAttempt = async (roomId: string, ipAddress: string): Promise<boolean> => {
  const key = `secret_attempts:${roomId}:${ipAddress}`;
  
  // Check if too many failed attempts
  const recentAttempts = await prisma.roomAccessLog.count({
    where: {
      roomId,
      ipAddress,
      action: 'join',
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000)
      },
      details: {
        path: ['result'],
        equals: 'failed'
      }
    }
  });
  
  return recentAttempts < 10; // Max 10 failed attempts per 15 min
};

// Room code brute force protection
export const roomCodeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 attempts
  message: { error: 'Too many room lookups. Please try again later.' },
});

// Middleware to validate room ownership transfer
export const validateOwnershipTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { newOwnerId } = req.body;
    
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { members: true }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Verify new owner is a member
    const isMember = room.members.some(m => m.userId === newOwnerId);
    if (!isMember) {
      return res.status(400).json({ error: 'New owner must be a room member' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res);
    
    res.json = function(body: any) {
      // Log after response
      if (req.roomAccess) {
        prisma.roomAccessLog.create({
          data: {
            roomId: req.roomAccess.roomId,
            userId: req.user?.userId,
            guestId: req.roomAccess.guestId,
            ipAddress: req.ip,
            action,
            details: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              success: res.statusCode < 400,
            },
          }
        }).catch(() => {}); // Non-blocking
      }
      
      return originalSend(body);
    };
    
    next();
  };
};
```

### Additional Security Features

1. **Secret Hashing**: All room secrets stored as bcrypt hashes
2. **Token Expiration**: Room tokens expire after 12 hours, access tokens after 15 minutes
3. **Token Rotation**: Refresh tokens are single-use and rotated on every refresh
4. **Account Lockout**: After 5 failed login attempts, account locks for 30 minutes
5. **IP-based Rate Limiting**: All auth endpoints rate-limited per IP
6. **Audit Logging**: All room access and admin actions logged
7. **Secure Headers**: Helmet.js recommended for production

---

## 9. Updated Server Configuration

```typescript
// src/server.ts (auth-related updates)

import { socketAuthMiddleware } from './modules/socket/auth';
import authRoutes from './modules/auth/routes';
import passwordResetRoutes from './modules/auth/password-reset';
import roomAdminRoutes from './modules/api/room-admin';

// ... existing imports ...

// Mount auth routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/rooms/:code/admin', roomAdminRoutes);

// Apply socket auth middleware
io.use(socketAuthMiddleware);

// ... rest of server.ts ...
```

---

## 10. Environment Variables

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
DATABASE_URL=postgresql://user:pass@localhost:5432/improv_scoreboard

# Optional
REFRESH_TOKEN_SECRET=optional-different-secret-for-refresh-tokens
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
REDIS_URL=redis://localhost:6379  # For session store (optional)

# Rate limiting
ROOM_TTL_HOURS=2
MAX_ROOMS_PER_USER=10  # For free tier
```

---

## 11. API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Create account |
| POST | /api/auth/login | None | Login |
| POST | /api/auth/refresh | None | Refresh tokens |
| POST | /api/auth/logout | Access Token | Logout |
| POST | /api/auth/oauth/google | None | Google OAuth |
| POST | /api/auth/forgot-password | None | Request reset |
| POST | /api/auth/reset-password | None | Reset password |
| POST | /api/rooms | Optional | Create room (owned if auth) |
| GET | /api/rooms/:code/info | None | Public room info |
| POST | /api/rooms/:code/join | Optional + Secret | Join room |
| GET | /api/rooms/:code/members | Room Admin | List members |
| PATCH | /api/rooms/:code/members/:id | Room Admin | Update role |
| DELETE | /api/rooms/:code/members/:id | Room Admin | Kick member |
| POST | /api/rooms/:code/regenerate-secrets | Room Owner | New secrets |
| PATCH | /api/rooms/:code/settings | Room Admin | Update settings |

---

## 12. Frontend Integration Notes

### Token Storage
```typescript
// Store tokens securely (httpOnly cookies preferred, or secure localStorage)
const storeTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      
      storeTokens(data.tokens);
      originalRequest.headers['Authorization'] = `Bearer ${data.tokens.accessToken}`;
      
      return axios(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

### Socket Connection with Auth
```typescript
const socket = io({
  auth: {
    token: localStorage.getItem('accessToken'),
    roomToken: localStorage.getItem('roomToken'),
  }
});
```

---

## Implementation Checklist

- [ ] Add `bcrypt`, `zod`, `@types/bcrypt` to dependencies
- [ ] Run Prisma migration
- [ ] Implement auth routes (`src/modules/auth/routes.ts`)
- [ ] Implement password reset (`src/modules/auth/password-reset.ts`)
- [ ] Update token module with access/refresh tokens
- [ ] Create auth middleware (`src/modules/auth/middleware.ts`)
- [ ] Create socket auth middleware
- [ ] Update room store with ownership and hashed secrets
- [ ] Implement room admin endpoints
- [ ] Add rate limiting to all sensitive endpoints
- [ ] Implement audit logging
- [ ] Update frontend with token management
- [ ] Add OAuth configuration (Google, GitHub)
- [ ] Set up email provider for password reset
- [ ] Configure secure headers (Helmet.js)
- [ ] Add tests for auth flows

This design provides a complete, secure authentication and authorization system that supports multi-tenancy while maintaining backward compatibility with the existing room code + secret access pattern.
