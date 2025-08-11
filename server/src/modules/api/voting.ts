import express, { Router, Request, Response } from 'express';
import { getState, updateState } from '../state';

// Simple in-memory voting state
const votingState: {
  active: boolean;
  matchId?: string;
  votes: { team1: number; team2: number };
  enabled: boolean;
} = {
  active: false,
  matchId: undefined,
  votes: { team1: 0, team2: 0 },
  enabled: true,
};

const router: Router = express.Router();

function getBaseUrl(req: Request): string {
  const env = process.env.PUBLIC_URL?.replace(/\/$/, '');
  if (env) return env;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// GET /api/voting/state
router.get('/state', (_req: Request, res: Response) => {
  res.json({
    active: votingState.active,
    matchId: votingState.matchId,
    votes: votingState.votes,
    enabled: votingState.enabled,
  });
});

// POST /api/voting/enable { enabled: boolean }
router.post('/enable', (req: Request, res: Response) => {
  const { enabled } = req.body || {};
  votingState.enabled = !!enabled;
  // reflect in global state for UI toggle
  updateState({ votingEnabled: votingState.enabled } as any);
  res.json({ enabled: votingState.enabled });
});

export function startVotingSession(matchId?: string) {
  if (!votingState.enabled) return false;
  votingState.active = true;
  votingState.matchId = matchId || votingState.matchId;
  votingState.votes = { team1: 0, team2: 0 };
  // Surface to UI via global state (used by display to show QR)
  updateState({ votingActive: true, votingEnabled: votingState.enabled } as any);
  return true;
}

// POST /api/voting/start { matchId?: string }
router.post('/start', (req: Request, res: Response) => {
  const ok = startVotingSession(req.body?.matchId);
  res.json({ active: votingState.active, votes: votingState.votes, enabled: votingState.enabled, ok });
});

export function endVotingSession(matchId?: string, opts?: { autoAward?: boolean }) {
  votingState.active = false;
  const { team1, team2 } = votingState.votes;
  const winner: 'team1' | 'team2' | null = team1 === team2 ? null : team1 > team2 ? 'team1' : 'team2';
  if (opts?.autoAward && winner) {
    // award a point
    const s = getState();
    const delta = winner === 'team1' ? { team1: { ...(s as any).team1, score: (s as any).team1.score + 1 } } : { team2: { ...(s as any).team2, score: (s as any).team2.score + 1 } };
    updateState(delta as any);
  }
  // Update UI flags
  updateState({ votingActive: false } as any);
  return { winner, team1, team2 };
}

// POST /api/voting/end { matchId?: string, autoAward?: boolean }
router.post('/end', (req: Request, res: Response) => {
  const result = endVotingSession(req.body?.matchId, { autoAward: !!req.body?.autoAward });
  res.json({ active: votingState.active, result });
});

// POST /api/voting/vote/:teamId
router.post('/vote/:teamId', (req: Request, res: Response) => {
  if (!votingState.enabled || !votingState.active) return res.status(400).json({ error: 'Voting not active' });
  const teamId = req.params.teamId === 'team1' ? 'team1' : req.params.teamId === 'team2' ? 'team2' : null;
  if (!teamId) return res.status(400).json({ error: 'Invalid team' });
  votingState.votes[teamId]++;
  res.json({ ok: true, votes: votingState.votes });
});

// GET /api/voting/qr - return a PNG QR that links to the simple voting page
router.get('/qr', async (req: Request, res: Response) => {
  try {
    const base = getBaseUrl(req);
    const url = `${base}/api/voting/page`;
    const mod: any = await import('qrcode');
    const png = await mod.toBuffer(url, { type: 'png', errorCorrectionLevel: 'M', margin: 1, width: 240 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// GET /api/voting/page - minimal HTML voting page
router.get('/page', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Vote</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:16px} .btn{font-size:20px;padding:12px 16px;margin:8px;border-radius:8px;border:1px solid #ccc} .row{display:flex;gap:12px}</style>
</head><body>
<h2>Vote for this round</h2>
<div class="row">
  <button class="btn" onclick="vote('team1')">Team 1</button>
  <button class="btn" onclick="vote('team2')">Team 2</button>
</div>
<p id="msg"></p>
<script>
async function vote(team){
  try{
    const res = await fetch('/api/voting/vote/'+team, { method:'POST' });
    const data = await res.json();
    document.getElementById('msg').textContent = res.ok ? 'Vote counted! '+JSON.stringify(data.votes) : (data.error||'Error');
  }catch(e){ document.getElementById('msg').textContent = 'Error submitting vote'; }
}
</script>
</body></html>`);
});

export default router;

