#!/usr/bin/env node
/**
 * Basic E2E script for Mon‑Pacing interop.
 *
 * Requires the server to be running (default: http://localhost:3001).
 *
 * Usage:
 *   BASE_URL=http://localhost:3001 MONPACING_TOKEN=your_token node scripts/interop_e2e.mjs
 *
 * Notes:
 * - If MONPACING_TOKEN is set and your server validates it, it will be sent via Authorization header.
 * - The script performs:
 *   1) POST /api/interop/mon-pacing/plan with a minimal plan (2 teams, 1 round)
 *   2) POST /api/interop/mon-pacing/event with timer start/pause/resume/stop
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TOKEN = process.env.MONPACING_TOKEN || '';

async function postJson(path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}\n${text}`);
  }
  return parsed;
}

async function run() {
  console.log(`Base URL: ${BASE_URL}`);

  // 1) Import a minimal plan
  const plan = {
    version: 1,
    matchId: 'e2e-demo',
    teams: [
      { id: 'A', name: 'Team A', color: '#ff3333' },
      { id: 'B', name: 'Team B', color: '#3333ff' },
    ],
    rounds: [
      {
        id: 'r1',
        order: 1,
        category: 'Open',
        theme: 'E2E Test',
        minutes: 0,
        seconds: 30,
        type: 'set',
        mixed: false,
      },
    ],
  };

  console.log('> Importing plan...');
  try {
    const resp = await fetch(`${BASE_URL}/api/interop/mon-pacing/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify(plan),
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Import failed ${resp.status}: ${text}`);
    console.log('Plan import OK');
  } catch (err) {
    console.error('Plan import error:', err.message);
    process.exitCode = 1;
    return;
  }

  // 2) Timer events
  console.log('> Starting 10-second timer...');
  await postJson('/api/interop/mon-pacing/event', {
    type: 'timer',
    payload: { action: 'start', durationSec: 10 },
  });
  console.log('Timer start OK');

  await new Promise(r => setTimeout(r, 1500));

  console.log('> Pausing timer...');
  await postJson('/api/interop/mon-pacing/event', { type: 'pause' });
  console.log('Timer pause OK');

  await new Promise(r => setTimeout(r, 1000));

  console.log('> Resuming timer...');
  await postJson('/api/interop/mon-pacing/event', { type: 'resume' });
  console.log('Timer resume OK');

  await new Promise(r => setTimeout(r, 1500));

  console.log('> Stopping timer...');
  await postJson('/api/interop/mon-pacing/event', { type: 'timer', payload: { action: 'stop' } });
  console.log('Timer stop OK');

  console.log('\nE2E interop script finished successfully.');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});

