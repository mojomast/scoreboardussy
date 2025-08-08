import express, { Express, Request, Response, NextFunction } from 'express';
import { updateState, getState } from '../state';
import { startRound, saveRoundResults } from '../state/rounds/actions';
import { updateRoundSetting } from '../state/rounds/state';
import { RoundConfig, RoundType } from '../../types/rounds.types';
import fs from 'fs';
import path from 'path';
import { validatePlan, validateEvent } from './validation';

// Types based on Mon-Pacing models
// ImprovisationModel: { id, type: 'mixed' | 'compared', category: string, theme: string, durationsInSeconds: number[] }
// TeamModel: { name: string, color: int }
interface MonPacingPlan {
  teams?: Array<{ id?: string | number; name: string; color?: number | string }>;
  rounds?: Array<{
    id?: string | number;
    type?: 'mixed' | 'compared';
    category?: string;
    theme?: string;
    durationsInSeconds?: number[];
    performers?: string;
    notes?: string;
  }>;
}

interface MonPacingEvent {
  type: string; // 'start_round' | 'end_round' | 'pause' | 'resume' | 'penalty' | 'score' | 'set_visibility'
  payload?: any;
}

// Utilities
function intColorToHex(c?: number | string): string | undefined {
  if (typeof c === 'string') return c; // assume already a CSS color
  if (typeof c === 'number') {
    // Mon-Pacing uses Flutter Color int (ARGB). Convert to #RRGGBB
    const rgb = c & 0xFFFFFF;
    return '#' + rgb.toString(16).padStart(6, '0');
  }
  return undefined;
}

// Category mapping that can be configured via API and persisted to data/monpacing.category-map.json
let categoryMap: Record<string, RoundType> = {};
const DATA_DIR = path.resolve(process.cwd(), 'data');
const MAP_FILE = path.join(DATA_DIR, 'monpacing.category-map.json');

function loadCategoryMap() {
  try {
    if (fs.existsSync(MAP_FILE)) {
      const raw = fs.readFileSync(MAP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') categoryMap = parsed;
    }
  } catch (e) {
    console.error('[interop] failed to load category map', e);
  }
}
function saveCategoryMap() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MAP_FILE, JSON.stringify(categoryMap, null, 2));
  } catch (e) {
    console.error('[interop] failed to save category map', e);
  }
}
loadCategoryMap();

export function setCategoryMap(map: Record<string, RoundType>) {
  categoryMap = map || {};
  saveCategoryMap();
}
export function getCategoryMap() { return { ...categoryMap }; }

export function mapCategoryToRoundType(category?: string): RoundType {
  if (!category) return RoundType.CUSTOM;
  // 1) exact match in configured map (case-insensitive keys)
  const entries = Object.entries(categoryMap);
  const hit = entries.find(([k]) => k.toLowerCase() === category.toLowerCase());
  if (hit) return hit[1];
  // 2) heuristic fallback
  const c = category.toLowerCase();
  if (c.includes('music')) return RoundType.MUSICAL;
  if (c.includes('long')) return RoundType.LONGFORM;
  if (c.includes('narrative')) return RoundType.NARRATIVE;
  if (c.includes('character')) return RoundType.CHARACTER;
  if (c.includes('short')) return RoundType.SHORTFORM;
  return RoundType.CHALLENGE; // fallback
}

function mapMonPacingRoundToConfig(mp: any, number: number): RoundConfig {
  const durations: number[] = Array.isArray(mp?.durationsInSeconds) ? mp.durationsInSeconds : [];
  const primaryDuration = durations.length > 0 ? durations[0] : (typeof mp?.durationSec === 'number' ? mp.durationSec : 180);
  const isMixed = (mp?.type || '').toString().toLowerCase() === 'mixed';
  return {
    type: mapCategoryToRoundType(mp?.category),
    isMixed,
    theme: typeof mp?.theme === 'string' ? mp.theme : (mp?.title || ''),
    minPlayers: 2,
    maxPlayers: 8,
    timeLimit: typeof primaryDuration === 'number' ? primaryDuration : 180,
    number,
  } as RoundConfig;
}

function logInterop(event: string, data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), src: 'mon-pacing', event, data }) + '\n';
    fs.appendFileSync(path.join(DATA_DIR, 'interop.log'), line);
  } catch (e) {
    console.error('[interop] failed to write log', e);
  }
}

export function registerMonPacingInterop(app: Express, authMiddleware: (req: Request, res: Response, next: NextFunction) => void) {
  const router = express.Router();

  // Health
  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mon-pacing-interop' });
  });

  // Accept a full plan (teams + rounds) and enqueue entire playlist
  // Also marks remoteControl source
  router.post('/plan', authMiddleware, (req: Request, res: Response) => {
    const body = (req.body || {}) as any;
    const validation = validatePlan(body);
    if (!validation.valid) return res.status(400).json({ ok: false, errors: validation.errors });
    const plan = body as MonPacingPlan;
    const rounds = Array.isArray(plan.rounds) ? plan.rounds : [];

    // Persist team names/colors if present (first two only for now)
    if (Array.isArray(plan.teams) && plan.teams.length >= 2) {
      const s2 = getState();
      updateState({
        team1: { ...s2.team1, name: plan.teams[0]?.name || s2.team1.name, color: intColorToHex(plan.teams[0]?.color) || s2.team1.color },
        team2: { ...s2.team2, name: plan.teams[1]?.name || s2.team2.name, color: intColorToHex(plan.teams[1]?.color) || s2.team2.color },
        remoteControl: { source: 'mon-pacing', locked: false },
      });
    } else {
      updateState({ remoteControl: { source: 'mon-pacing', locked: false } });
    }

    // Clear existing draft/queue and import all as upcoming
const { setNextRoundDraft, enqueueUpcoming, updateState: updateStateFn, getState: getStateFn } = require('../state');
    const s = getStateFn();
    updateStateFn({
      rounds: {
        ...s.rounds,
        nextRoundDraft: null,
        upcoming: [],
      },
    });

    rounds.forEach((r: any, idx: number) => {
      const cfg = mapMonPacingRoundToConfig(r, idx + 1);
      if (idx === 0) setNextRoundDraft(cfg);
      else enqueueUpcoming(cfg);
    });

    logInterop('plan_import', { teams: Array.isArray(plan.teams) ? plan.teams.length : 0, rounds: rounds.length });
    res.json({ ok: true, importedRounds: rounds.length });
  });

  // Live event endpoint: route MP events to internal actions/state
  // Marks remoteControl source if not already marked
  router.post('/event', authMiddleware, (req: Request, res: Response) => {
    const body = (req.body || {}) as any;
    const validation = validateEvent(body);
    if (!validation.valid) return res.status(400).json({ ok: false, errors: validation.errors });
    const evt = body as MonPacingEvent;
    try {
      // ensure remote control marker present
      updateState({ remoteControl: { source: 'mon-pacing', locked: false } });
      switch ((evt.type || '').toLowerCase()) {
        case 'start_round': {
          const cfg = mapMonPacingRoundToConfig(evt.payload?.round, evt.payload?.number || 1);
          const result = startRound({ config: cfg });
          logInterop('start_round', { number: evt.payload?.number, category: evt.payload?.round?.category });
          return res.json({ ok: !!result });
        }
        case 'end_round': {
          const points = {
            team1: Number(evt.payload?.points?.team1) || 0,
            team2: Number(evt.payload?.points?.team2) || 0,
          };
          // Translate penalties from Mon-Pacing: { teamId: 1|2, major: bool }
          const rawPens: any[] = Array.isArray(evt.payload?.penalties) ? evt.payload.penalties : [];
      const toCount = (teamN: number, kind: 'major' | 'minor') =>
            rawPens.filter(p => (Number(p?.teamId) === teamN) && ((kind === 'major') ? !!p?.major : !p?.major)).length;
          const penalties = {
            team1: { major: toCount(1, 'major'), minor: toCount(1, 'minor') },
            team2: { major: toCount(2, 'major'), minor: toCount(2, 'minor') },
          };
          const result = saveRoundResults({ points, penalties, notes: evt.payload?.notes });
          logInterop('end_round', { points, penalties });
          return res.json({ ok: !!result });
        }
        case 'penalty': {
          // Increment a single penalty immediately
          const teamIdNum = Number(evt.payload?.teamId);
          const major = !!evt.payload?.major;
          const teamKey = teamIdNum === 2 ? 'team2' : 'team1';
          const type = major ? 'major' : 'minor';
require('../state').updatePenalty(teamKey, type);
          logInterop('penalty', { team: teamKey, type });
          return res.json({ ok: true });
        }
        case 'score': {
          // Increment/decrement score for a team
          const teamIdNum = Number(evt.payload?.teamId);
          const delta = Number(evt.payload?.delta) || 1;
          const teamKey = teamIdNum === 2 ? 'team2' : 'team1';
          const times = Math.abs(delta);
          const action = delta >= 0 ? 'increment' : 'decrement';
          for (let i = 0; i < times; i++) {
require('../state').updateScore(teamKey, action);
          }
          logInterop('score', { team: teamKey, delta });
          return res.json({ ok: true });
        }
        case 'pause': {
          require('../state/timer').pauseTimer();
          logInterop('pause', {});
          return res.json({ ok: true });
        }
        case 'resume': {
          require('../state/timer').resumeTimer();
          logInterop('resume', {});
          return res.json({ ok: true });
        }
        case 'timer': {
          // payload: { action: 'start'|'stop'|'set', durationSec?, remainingSec? }
          const action = (evt.payload?.action || '').toLowerCase();
          const mod = require('../state/timer');
          if (action === 'start') {
            const dur = Number(evt.payload?.durationSec) || 0;
            mod.startTimer(Math.max(0, dur));
            logInterop('timer_start', { durationSec: dur });
          } else if (action === 'stop') {
            mod.stopTimer();
            logInterop('timer_stop', {});
          } else if (action === 'set') {
            const sec = Number(evt.payload?.remainingSec);
            if (!Number.isNaN(sec)) {
const s = require('../state').getState();
              const t = s.timer || { status: 'stopped', durationSec: sec, remainingSec: sec, startedAt: null };
require('../state').updateState({ timer: { ...t, remainingSec: sec } });
              logInterop('timer_set', { remainingSec: sec });
            }
          }
          return res.json({ ok: true });
        }
        case 'set_visibility': {
          const target: string = evt.payload?.target || 'showRoundHeader';
          const visible: boolean = !!evt.payload?.visible;
          updateRoundSetting(target as any, visible);
          return res.json({ ok: true });
        }
        default:
          return res.status(400).json({ ok: false, error: 'Unknown event type' });
      }
    } catch (e) {
      console.error('[interop] error handling event', e);
      return res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // Allow client to lock/unlock local overrides while remote is driving
  router.post('/lock', authMiddleware, (req: Request, res: Response) => {
    const locked = !!req.body?.locked;
    updateState({ remoteControl: { source: 'mon-pacing', locked } });
    logInterop('lock', { locked });
    res.json({ ok: true, locked });
  });

  // Category mapping endpoints
  router.get('/category-map', authMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true, map: getCategoryMap() });
  });
  router.put('/category-map', authMiddleware, (req: Request, res: Response) => {
    const map = req.body?.map;
    if (!map || typeof map !== 'object') return res.status(400).json({ ok: false, error: 'map must be an object' });
    setCategoryMap(map);
    res.json({ ok: true });
  });

  // Export a synthesized plan from current state
  router.get('/plan', authMiddleware, (_req: Request, res: Response) => {
    const s = getState();
    res.json({
      teams: [
        { name: s.team1?.name, color: s.team1?.color },
        { name: s.team2?.name, color: s.team2?.color },
      ],
      // TODO: include upcoming mapped back to Mon-Pacing shape if needed
    });
  });

  app.use('/api/interop/mon-pacing', router);
}

