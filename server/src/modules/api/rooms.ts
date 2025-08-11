import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getState } from '../state';

interface Room {
  id: string;
  createdAt: string;
  refereeToken: string;
  // Snapshot of team names and scores at last update (for listing)
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
}

const rooms: Room[] = [];

function getBaseUrl(req: Request): string {
  // Prefer PUBLIC_URL if provided
  const env = process.env.PUBLIC_URL?.replace(/\/$/, '');
  if (env) return env;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

const router = Router();

// List rooms with basic metadata
router.get('/', (_req: Request, res: Response) => {
  res.json({ rooms: rooms.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    team1Name: r.team1Name,
    team2Name: r.team2Name,
    team1Score: r.team1Score,
    team2Score: r.team2Score,
  })) });
});

// Create room
router.post('/', (req: Request, res: Response) => {
  const id = uuidv4();
  const refereeToken = uuidv4();
  const createdAt = new Date().toISOString();

  // Initialize team snapshot from current global state (best-effort)
  const s = getState();
  const room: Room = {
    id,
    createdAt,
    refereeToken,
    team1Name: s.team1?.name,
    team2Name: s.team2?.name,
    team1Score: s.team1?.score,
    team2Score: s.team2?.score,
  };
  rooms.unshift(room);

  const base = getBaseUrl(req);
  const controlUrl = `${base}/#/control?room=${encodeURIComponent(id)}`;
  const displayUrl = `${base}/#/display?room=${encodeURIComponent(id)}`;

  res.json({
    id,
    createdAt,
    urls: { control: controlUrl, display: displayUrl },
    tokens: { referee: refereeToken }
  });
});

// Delete a room by id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = rooms.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  rooms.splice(idx, 1);
  res.json({ success: true });
});

export default router;
