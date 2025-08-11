import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getState } from '../state';

interface Room {
  id: string;
  createdAt: string;
  refereeToken: string;
  // Snapshot of team names, colors, and scores at last update (for listing)
  team1Name?: string;
  team2Name?: string;
  team1Color?: string;
  team2Color?: string;
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
  // Pull current colors and scores from global state so list reflects live data
  const s = getState() as any;
  const currentTeam1Color = s?.team1?.color;
  const currentTeam2Color = s?.team2?.color;
  const currentTeam1Score = typeof s?.team1?.score === 'number' ? s.team1.score : undefined;
  const currentTeam2Score = typeof s?.team2?.score === 'number' ? s.team2.score : undefined;

  res.json({ rooms: rooms.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    team1Name: r.team1Name,
    team2Name: r.team2Name,
    team1Color: currentTeam1Color ?? r.team1Color,
    team2Color: currentTeam2Color ?? r.team2Color,
    team1Score: currentTeam1Score ?? r.team1Score,
    team2Score: currentTeam2Score ?? r.team2Score,
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
    team1Color: s.team1?.color,
    team2Color: s.team2?.color,
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
