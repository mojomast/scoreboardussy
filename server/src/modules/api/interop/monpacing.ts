import express, { Router, Request, Response, NextFunction } from 'express';
import { verifyInteropToken, signInteropToken } from '../../auth/tokens';
import { matchStateManager } from '../../state/matches';
import { CreateMatchPayload } from '../../../types/match.types';

const router: Router = express.Router();

// Helper to get bearer token
function getBearerToken(req: Request): string | null {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || Array.isArray(header)) return null;
  const parts = header.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

function requireInteropAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  const payload = verifyInteropToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  (req as any).interop = payload;
  next();
}

// POST /api/interop/mon-pacing/qr
// Generates a QR payload for mon-pacing to scan: { url, id, token }
router.post('/qr', (req: Request, res: Response) => {
  try {
    const { matchId, baseUrl } = req.body || {};
    const id: string = typeof matchId === 'string' && matchId.length > 0
      ? matchId
      : `match_${Math.random().toString(36).slice(2,10)}`;

    // Token bound to this match id and scope
    const token = signInteropToken({ matchId: id, scope: 'monpacing' });

    // Determine base URL
    const origin = baseUrl
      || process.env.PUBLIC_URL
      || (req.protocol + '://' + req.get('host'));

    const url = `${origin.replace(/\/$/, '')}/api/interop/mon-pacing`;

    res.json({ url, id, token });
  } catch (e) {
    console.error('Error creating QR payload:', e);
    res.status(500).json({ error: 'Failed to create QR payload' });
  }
});

// POST /api/interop/mon-pacing/plan
// Accepts initial match plan (teams, rounds)
router.post('/plan', requireInteropAuth, (req: Request, res: Response) => {
  try {
    const { matchId } = (req as any).interop as { matchId: string };
    const body = req.body || {};
    // Validate matchId consistency
    if (body.matchId && body.matchId !== matchId) {
      return res.status(400).json({ error: 'matchId does not match token' });
    }

    // Map teams
    const teamsArray = Array.isArray(body.teams) ? body.teams : [];
    const team1 = teamsArray[0] || { id: 'A', name: 'Team A', color: '#ff3333' };
    const team2 = teamsArray[1] || { id: 'B', name: 'Team B', color: '#3333ff' };

    // If match already exists, skip creation, else create with provided name
    let existing = matchStateManager.getMatch(matchId);
    if (!existing) {
      const payload: CreateMatchPayload = {
        name: body.name || 'Mon-Pacing Match',
        teams: [
          { id: 'team1', name: team1.name, color: team1.color },
          { id: 'team2', name: team2.name, color: team2.color }
        ],
        rules: {},
        settings: {}
      };
      const createdId = matchStateManager.createMatch(payload, matchId);
      if (createdId !== matchId) {
        // Note: our manager generated a new id; for strict mapping we could refactor to accept id
        // For now, we respond with both ids
        existing = matchStateManager.getMatch(createdId);
      } else {
        existing = matchStateManager.getMatch(matchId);
      }
    }

    // TODO: Map rounds from body.rounds to our planning system if desired

    res.json({ success: true, match: existing });
  } catch (e) {
    console.error('Error handling mon-pacing plan:', e);
    res.status(500).json({ error: 'Failed to process plan' });
  }
});

// POST /api/interop/mon-pacing/test
// Validates token and returns bound matchId
router.post('/test', requireInteropAuth, (req: Request, res: Response) => {
  const interop = (req as any).interop as { matchId: string };
  const matchId = interop?.matchId;
  return res.json({ ok: true, matchId });
});

// POST /api/interop/mon-pacing/event
// Accepts event types: timer, points, penalty, round lifecycle
router.post('/event', requireInteropAuth, (req: Request, res: Response) => {
  try {
    const { matchId } = (req as any).interop as { matchId: string };
    const body = req.body || {};
    if (body.matchId && body.matchId !== matchId) {
      return res.status(400).json({ error: 'matchId does not match token' });
    }

    const type: string = body.type;
    const payload = body.payload || {};

    switch (type) {
      case 'timer': {
        const action = payload.action as string;
        if (action === 'start') {
          const duration = payload.durationSec ?? payload.duration ?? 0;
          matchStateManager.startTimer({ matchId, type: 'round', duration, autoStart: true });
        } else if (action === 'pause') {
          const m = matchStateManager.getMatch(matchId);
          if (m?.timer) matchStateManager.pauseTimer({ matchId, timerId: m.timer.timerId });
        } else if (action === 'resume') {
          const m = matchStateManager.getMatch(matchId);
          if (m?.timer) matchStateManager.resumeTimer({ matchId, timerId: m.timer.timerId });
        } else if (action === 'stop') {
          const m = matchStateManager.getMatch(matchId);
          if (m?.timer) matchStateManager.stopTimer({ matchId, timerId: m.timer.timerId });
        } else if (action === 'set') {
          const m = matchStateManager.getMatch(matchId);
          const duration = payload.durationSec ?? payload.duration ?? 0;
          if (m?.timer) matchStateManager.setTimerDuration({ matchId, timerId: m.timer.timerId, duration });
        }
        break;
      }
      case 'points': {
        const team = (payload.team === 'A' ? 'team1' : payload.team === 'B' ? 'team2' : 'team1') as 'team1' | 'team2';
        const points = Number(payload.points) || 0;
        matchStateManager.updateScore({ matchId, team, points });
        break;
      }
      case 'penalty': {
        const team = (payload.team === 'A' ? 'team1' : payload.team === 'B' ? 'team2' : 'team1') as 'team1' | 'team2';
        const kind = String(payload.kind || 'minor');
        matchStateManager.addPenalty({ matchId, team, kind });
        break;
      }
      default: {
        // Accept but no-op for unknown types (round lifecycle etc.)
        console.warn('Unhandled mon-pacing event type:', type);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Error handling mon-pacing event:', e);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

export default router;
