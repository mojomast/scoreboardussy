import express, { Router, Request, Response, NextFunction } from 'express';
import { verifyInteropToken, signInteropToken } from '../../auth/tokens';
import { matchStateManager } from '../../state/matches';
import { CreateMatchPayload } from '../../../types/match.types';
import { updateState, getState } from '../../state';

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

// POST /api/interop/mon-pacing/match
// Accepts full match push from mon-pacing (versioned)
router.post('/match', requireInteropAuth, (req: Request, res: Response) => {
  try {
    const { matchId } = (req as any).interop as { matchId: string };
    const body = req.body || {};
    if (body.matchId && body.matchId !== matchId) {
      return res.status(400).json({ error: 'matchId does not match token' });
    }

    const m = body.match || {};

    // Ensure a match exists in our manager
    let existing = matchStateManager.getMatch(matchId);
    const extTeams = Array.isArray(m.teams) ? m.teams : [];
    const extTeam1 = extTeams[0];
    const extTeam2 = extTeams[1];

    if (!existing) {
      const payload: CreateMatchPayload = {
        name: m.name || body.name || 'Mon-Pacing Match',
        teams: [
          { id: 'team1', name: extTeam1?.name || 'Team A', color: extTeam1?.color || '#ff3333' },
          { id: 'team2', name: extTeam2?.name || 'Team B', color: extTeam2?.color || '#3333ff' },
        ],
        rules: {},
        settings: {},
      };
      matchStateManager.createMatch(payload, matchId);
      existing = matchStateManager.getMatch(matchId);
    }

    // Update the legacy scoreboard top-level team labels/colors so displays stay in sync
    const current = getState();
    const next: any = { ...current };
    if (extTeam1) next.team1 = { ...current.team1, name: extTeam1.name ?? current.team1.name, color: extTeam1.color ?? current.team1.color };
    if (extTeam2) next.team2 = { ...current.team2, name: extTeam2.name ?? current.team2.name, color: extTeam2.color ?? current.team2.color };
    if (JSON.stringify(next.team1) !== JSON.stringify(current.team1) || JSON.stringify(next.team2) !== JSON.stringify(current.team2)) {
      updateState({ team1: next.team1, team2: next.team2 } as any);
    }

    // Compute scores from the provided points list per the new schema
    const pointsArr: any[] = Array.isArray(body.points) ? body.points : Array.isArray(m.points) ? m.points : [];
    const extId1 = extTeam1?.id;
    const extId2 = extTeam2?.id;
    let team1Score = 0;
    let team2Score = 0;
    for (const p of pointsArr) {
      const value = typeof p?.value === 'number' ? p.value : Number(p?.value) || 0;
      const tid = p?.teamId;
      if (tid != null && value) {
        if (extId1 != null && tid === extId1) team1Score += value;
        else if (extId2 != null && tid === extId2) team2Score += value;
      }
    }

    // Apply computed score if we have a match
    if (existing) {
      // Prefer 0 when no points have been provided
      matchStateManager.setScore(matchId, team1Score, team2Score);
    }

    return res.json({ success: true, applied: { team1: team1Score, team2: team2Score } });
  } catch (e) {
    console.error('Error handling mon-pacing match:', e);
    return res.status(500).json({ error: 'Failed to process match push' });
  }
});

// POST /api/interop/mon-pacing/timer
// Accepts timer status updates with durations
router.post('/timer', requireInteropAuth, (req: Request, res: Response) => {
  try {
    const { matchId } = (req as any).interop as { matchId: string };
    const body = req.body || {};
    if (body.matchId && body.matchId !== matchId) {
      return res.status(400).json({ error: 'matchId does not match token' });
    }

    const status = String(body.status || '').toLowerCase();
    const total = typeof body.totalDuration === 'number' ? body.totalDuration : undefined;
    const remaining = typeof body.remainingDuration === 'number' ? body.remainingDuration : undefined;

    switch (status) {
      case 'start': {
        const duration = (remaining && remaining > 0) ? remaining : (total || 0);
        if (!duration || duration <= 0) {
          return res.status(400).json({ error: 'Invalid duration for start' });
        }
        matchStateManager.startTimer({ matchId, type: 'round', duration, autoStart: true });
        break;
      }
      case 'pause': {
        const m = matchStateManager.getMatch(matchId);
        if (m?.timer) matchStateManager.pauseTimer({ matchId, timerId: m.timer.timerId });
        break;
      }
      case 'stop': {
        const m = matchStateManager.getMatch(matchId);
        if (m?.timer) matchStateManager.stopTimer({ matchId, timerId: m.timer.timerId });
        break;
      }
      default: {
        console.warn('Unhandled mon-pacing timer status:', status);
      }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Error handling mon-pacing timer:', e);
    return res.status(500).json({ error: 'Failed to process timer update' });
  }
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
      case 'voting': {
        const action = String(payload.action || '').toLowerCase();
        if (action === 'start') {
          // Start voting session for this match
          try {
            import('../voting')
              .then((mod: any) => mod.startVotingSession(matchId))
              .catch(() => {});
          } catch {}
        } else if (action === 'end') {
          try {
            import('../voting')
              .then((mod: any) => mod.endVotingSession(matchId, { autoAward: true }))
              .catch(() => {});
          } catch {}
        }
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
