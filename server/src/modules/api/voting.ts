import express, { Router, Request, Response } from 'express';
import { getState, updateState } from '../state';
import { v4 as uuidv4 } from 'uuid';

// Enhanced voting state with session tracking
const votingState: {
  active: boolean;
  matchId?: string;
  votes: { team1: number; team2: number };
  enabled: boolean;
  sessions: Map<string, 'team1' | 'team2'>; // sessionId -> team vote
} = {
  active: false,
  matchId: undefined,
  votes: { team1: 0, team2: 0 },
  enabled: true,
  sessions: new Map(),
};

const router: Router = express.Router();

function getBaseUrl(req: Request): string {
  const env = process.env.PUBLIC_URL?.replace(/\/$/, '');
  if (env) return env;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Recalculate vote counts from sessions
function recalculateVotes() {
  votingState.votes = { team1: 0, team2: 0 };
  for (const vote of votingState.sessions.values()) {
    votingState.votes[vote]++;
  }
}

// GET /api/voting/state
router.get('/state', (_req: Request, res: Response) => {
  // Include team information for the voting page
  const globalState = getState() as any;
  const team1Info = globalState?.team1 ? {
    name: globalState.team1.name,
    color: globalState.team1.color
  } : { name: 'Team 1', color: '#2196F3' };
  
  const team2Info = globalState?.team2 ? {
    name: globalState.team2.name,
    color: globalState.team2.color
  } : { name: 'Team 2', color: '#FF5722' };

  res.json({
    active: votingState.active,
    matchId: votingState.matchId,
    votes: votingState.votes,
    enabled: votingState.enabled,
    teams: {
      team1: team1Info,
      team2: team2Info
    }
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
  votingState.sessions.clear(); // Clear all previous sessions
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

// POST /api/voting/vote/:teamId - Session-based voting with vote switching
router.post('/vote/:teamId', (req: Request, res: Response) => {
  if (!votingState.enabled || !votingState.active) {
    return res.status(400).json({ error: 'Voting not active' });
  }
  
  const teamId = req.params.teamId === 'team1' ? 'team1' : req.params.teamId === 'team2' ? 'team2' : null;
  if (!teamId) {
    return res.status(400).json({ error: 'Invalid team' });
  }

  // Get or create session ID
  let sessionId = req.body?.sessionId || req.headers['x-session-id'] as string;
  if (!sessionId) {
    sessionId = uuidv4();
  }
  
  // Record the vote for this session (overwrites previous vote if exists)
  votingState.sessions.set(sessionId, teamId);
  
  // Recalculate total votes
  recalculateVotes();
  
  res.json({ 
    ok: true, 
    votes: votingState.votes, 
    sessionId, 
    currentVote: teamId,
    message: 'Vote recorded! You can change your vote anytime before voting ends.'
  });
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

// GET /api/voting/page - Enhanced HTML voting page with session tracking
router.get('/page', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><title>ImproV Vote</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:20px;max-width:400px;margin:0 auto;background:#f5f5f5}
.container{background:white;padding:24px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
h2{color:#333;text-align:center;margin-top:0}
.btn{font-size:18px;padding:16px 24px;margin:8px 0;border-radius:8px;border:2px solid #ddd;width:100%;cursor:pointer;transition:all 0.2s}
.btn:hover{background:#f0f0f0}
.btn.selected{background:#4CAF50;color:white;border-color:#4CAF50}
.btn.team1.selected{background:#2196F3;border-color:#2196F3}
.btn.team2.selected{background:#FF5722;border-color:#FF5722}
#msg{text-align:center;margin-top:16px;padding:12px;border-radius:6px;min-height:20px}
.success{background:#e8f5e8;color:#2e7d2e;border:1px solid #4CAF50}
.info{background:#e3f2fd;color:#1976d2;border:1px solid #2196F3}
.counts{display:flex;justify-content:space-between;margin:16px 0;padding:12px;background:#f9f9f9;border-radius:8px}
.count{text-align:center;flex:1}
.count-num{font-size:24px;font-weight:bold;color:#333}
.count-label{font-size:12px;color:#666;margin-top:4px}
</style>
</head><body>
<div class="container">
<h2>🎭 Vote for This Round</h2>
<div class="counts" id="counts" style="display:none">
  <div class="count"><div class="count-num" id="team1-count">0</div><div class="count-label" id="team1-label">Team 1</div></div>
  <div class="count"><div class="count-num" id="team2-count">0</div><div class="count-label" id="team2-label">Team 2</div></div>
</div>
<button class="btn team1" id="btn-team1" onclick="vote('team1')">🎪 Vote <span id="btn-team1-name">Team 1</span></button>
<button class="btn team2" id="btn-team2" onclick="vote('team2')">🎯 Vote <span id="btn-team2-name">Team 2</span></button>
<div id="msg"></div>
</div>
<script>
let sessionId = localStorage.getItem('voteSessionId');
let currentVote = localStorage.getItem('currentVote');
let teams = { team1: { name: 'Team 1', color: '#2196F3' }, team2: { name: 'Team 2', color: '#FF5722' } };

// Load team information from API
async function loadTeamInfo() {
  try {
    const res = await fetch('/api/voting/state');
    if (res.ok) {
      const data = await res.json();
      if (data.teams) {
        teams = data.teams;
        updateTeamUI();
      }
    }
  } catch (e) {
    console.error('Error loading team info:', e);
  }
}

// Update team names and colors in UI
function updateTeamUI() {
  // Update button text
  document.getElementById('btn-team1-name').textContent = teams.team1.name;
  document.getElementById('btn-team2-name').textContent = teams.team2.name;
  
  // Update count labels
  document.getElementById('team1-label').textContent = teams.team1.name;
  document.getElementById('team2-label').textContent = teams.team2.name;
  
  // Update button colors
  const team1Btn = document.getElementById('btn-team1');
  const team2Btn = document.getElementById('btn-team2');
  
  // Create dynamic CSS for team colors
  const style = document.createElement('style');
  style.textContent = 
    '.btn.team1:hover { background: ' + teams.team1.color + '20; border-color: ' + teams.team1.color + '; }' +
    '.btn.team1.selected { background: ' + teams.team1.color + ' !important; border-color: ' + teams.team1.color + ' !important; }' +
    '.btn.team2:hover { background: ' + teams.team2.color + '20; border-color: ' + teams.team2.color + '; }' +
    '.btn.team2.selected { background: ' + teams.team2.color + ' !important; border-color: ' + teams.team2.color + ' !important; }';
  document.head.appendChild(style);
}

// Update UI based on current vote
function updateUI() {
  document.querySelectorAll('.btn').forEach(b => b.classList.remove('selected'));
  if (currentVote) {
    const btn = document.getElementById('btn-' + currentVote);
    if (btn) btn.classList.add('selected');
  }
}

// Update vote counts
function updateCounts(votes) {
  if (votes) {
    document.getElementById('team1-count').textContent = votes.team1;
    document.getElementById('team2-count').textContent = votes.team2;
    document.getElementById('counts').style.display = 'flex';
  }
}

async function vote(team){
  const msgEl = document.getElementById('msg');
  try{
    const body = sessionId ? JSON.stringify({sessionId}) : '{}';
    const headers = {'Content-Type': 'application/json'};
    
    const res = await fetch('/api/voting/vote/'+team, { 
      method:'POST',
      headers,
      body
    });
    const data = await res.json();
    
    if (res.ok) {
      sessionId = data.sessionId;
      currentVote = data.currentVote;
      localStorage.setItem('voteSessionId', sessionId);
      localStorage.setItem('currentVote', currentVote);
      
      updateUI();
      updateCounts(data.votes);
      
      msgEl.textContent = currentVote === team ? 'Vote recorded! ✓' : 'Vote changed! ✓';
      msgEl.className = 'success';
      
      // Show switching message
      setTimeout(() => {
        msgEl.textContent = 'You can change your vote anytime before voting ends.';
        msgEl.className = 'info';
      }, 2000);
    } else {
      msgEl.textContent = data.error || 'Error voting';
      msgEl.className = 'error';
    }
  }catch(e){ 
    msgEl.textContent = 'Error submitting vote';
    msgEl.className = 'error';
  }
}

// Initialize UI
loadTeamInfo(); // Load team names and colors first
updateUI();

// Update current vote message with team name
if (currentVote) {
  setTimeout(() => {
    const teamName = currentVote === 'team1' ? teams.team1.name : teams.team2.name;
    document.getElementById('msg').textContent = 'Your current vote: ' + teamName;
    document.getElementById('msg').className = 'info';
  }, 100); // Small delay to let team info load
}
</script>
</body></html>`);
});

export default router;

