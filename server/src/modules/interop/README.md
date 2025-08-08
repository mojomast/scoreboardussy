# Mon‑Pacing Interop (Live Control)

This server exposes a minimal interop surface so the Mon‑Pacing app can drive the scoreboard.

Enable
- Set env: MONPACING_INTEROP_ENABLED=1
- Optional: MONPACING_TOKEN=your_shared_secret (Authorization: Bearer your_shared_secret)

Endpoints (base: /api/interop/mon-pacing)
- GET /health -> { ok: true }
- POST /plan (auth optional)
  Body example (approximate Mon‑Pacing shape):
  {
    "teams": [{"name": "Blue"}, {"name": "Red"}],
    "rounds": [
      {"title": "Category A", "category": "Shortform", "durationSec": 180, "constraints": {"theme": "Animals"}}
    ]
  }
  Effect: updates team names/colors; sets nextRoundDraft from first round (MVP).

- POST /event (auth optional)
  Body example:
  { "type": "start_round", "payload": { "number": 1, "round": {"category": "Shortform", "title": "Opening", "durationSec": 180} } }
  Supported types:
  - start_round: maps to server startRound
  - end_round: { points: { team1, team2 }, penalties?, notes? } -> saveRoundResults
  - set_visibility: { target: string, visible: boolean } -> updateRoundSetting

- GET /plan (auth optional)
  Returns minimal plan from current state (teams); extend as needed.

Mapping notes
- Round category -> RoundType mapping is heuristic in monpacing.ts (music -> MUSICAL, etc.). Adjust once Mon‑Pacing categories are confirmed.
- We only populate nextRoundDraft from the first round for MVP; can extend to queue.

Client/UI impact
- None required for MVP. Control UI will reflect state changes via sockets.

Security
- If MONPACING_TOKEN is set, requests must include Authorization: Bearer <token>.

Next steps
- Finalize category mapping against Mon‑Pacing’s models/*.
- Extend /plan to import an entire queue. (Done)
- Add additional event types: pause/resume timer, penalties, score increments. (Partial)
- Configure category mapping via GET/PUT /api/interop/mon-pacing/category-map

