# Mon‑Pacing ↔ Improv Scoreboard Integration Guide

Audience: Mon‑Pacing developers and integrators

Last updated: 2025-08-08

This document explains how Mon‑Pacing can interoperate with the Improv Scoreboard. It covers capabilities, API endpoints, expected payloads, event semantics, authentication, deployment notes, examples, and troubleshooting.


## 1) Overview

Integration goals:
- Import match plans (teams, rounds) from Mon‑Pacing into the scoreboard
- Remotely control the scoreboard during a match (timer, visibility, scores, penalties, round lifecycle)
- Optional: export/telemetry back to Mon‑Pacing (future extension)

Supported modes in this build:
- A. Offline plan import (JSON → HTTP POST to the scoreboard)
- B. Live control (Mon‑Pacing → HTTP POST interop events)
- C. Export/telemetry (planned)

Transport: HTTP/JSON with server-push updates to clients via WebSockets (Socket.IO).


## 2) High-level Architecture

- Mon‑Pacing acts as the controller, sending HTTP requests to the Scoreboard REST API.
- The Scoreboard server applies updates to internal state and broadcasts to connected Control/Display UIs.
- A "remote control" banner displays in the Control UI when Mon‑Pacing is the controlling source.
- A lock mechanism lets Mon‑Pacing prevent or allow local overrides.


## 3) Configuration & Deployment

Environment variables (set before starting the server):
- MONPACING_INTEROP_ENABLED=1
- MONPACING_TOKEN=... (optional but recommended for auth)

Default ports/URLs:
- API base: http://<host>:3001
- Interop base: http://<host>:3001/api/interop/mon-pacing

CORS:
- If Mon‑Pacing runs on a different origin, configure CORS on the Scoreboard server or use a reverse proxy.

Network:
- Allow inbound connections to port 3001 from the Mon‑Pacing host.


## 4) Endpoints Summary

Base: /api/interop/mon-pacing

- POST /plan
  - Import a Mon‑Pacing plan JSON (teams, rounds). Idempotent for the same matchId.
- POST /event
  - Send a single control event (timer, lifecycle, scoring, visibility, etc.).
- POST /lock
  - Toggle remote lock state: { locked: boolean }
- GET /category-map
  - Retrieve Mon‑Pacing category → Scoreboard RoundType mapping.
- PUT /category-map
  - Update mapping (persisted on the server).

Authentication:
- If MONPACING_TOKEN is set, include Authorization: Bearer <token>


## 5) Plan Import

Endpoint: POST /api/interop/mon-pacing/plan
Content-Type: application/json

Minimal example:
```
{
  "version": 1,
  "matchId": "abc-123",
  "teams": [
    { "id": "A", "name": "Team A", "color": "#ff3333" },
    { "id": "B", "name": "Team B", "color": "#3333ff" }
  ],
  "rounds": [
    {
      "id": "r1",
      "order": 1,
      "category": "Open",
      "theme": "Welcome scene",
      "minutes": 2,
      "seconds": 0,
      "type": "set",    // optional; if omitted, derived from category map
      "mixed": false
    }
  ]
}
```

Behavior:
- Sets team names/colors.
- Queues rounds into the scoreboard plan.
- If category → RoundType mapping is defined, type may be derived. Explicit per-round `type` overrides mapping.

Status codes:
- 200/204: OK
- 400: invalid payload
- 401/403: auth failures
- 409: conflicting plan/match in progress (rare; depends on server config)


## 6) Category Mapping

The scoreboard needs to map Mon‑Pacing category strings to its internal RoundType values.

RoundType values (typical): "set", "compared", "mixed". This list may expand.

- GET /api/interop/mon-pacing/category-map → returns current mapping
- PUT /api/interop/mon-pacing/category-map → accepts JSON object mapping

Example request:
```
{
  "Open": "set",
  "Compared": "compared",
  "Mixed": "mixed"
}
```


## 7) Control Events

Endpoint: POST /api/interop/mon-pacing/event
Content-Type: application/json

Generic envelope:
```
{
  "type": "...",
  "payload": { ... }
}
```

Supported types and payloads:

- Timer control
  - type: "timer", payload: { action: "start" | "stop" | "set", durationSec?: number }
    - start: start a countdown with durationSec
    - stop: stop and reset timer
    - set: set remaining time to durationSec without changing status (paused/stopped)
  - type: "pause", payload: none
  - type: "resume", payload: none

- Round lifecycle
  - type: "start_round", payload: { roundId?: string }
    - If roundId omitted, start the next queued round.
  - type: "end_round", payload: { roundId?: string }

- Scoring & penalties
  - type: "score", payload: { team: "team1" | "team2", points: number }
  - type: "penalty", payload: { team?: "team1" | "team2", kind: "minor" | "major" }

- Visibility toggles
  - type: "set_visibility", payload: { target: "score" | "penalties" | "timer" | "emojis", visible: boolean }

Notes & semantics:
- Timer turns red on the Display when remaining time ≤ 15s.
- Server persists the canonical timer state; Control/Display UIs subscribe via WebSockets.
- Unknown event `type` returns 400.

Response codes:
- 204: accepted
- 400: invalid type/payload
- 401/403: auth failures


## 8) Remote Lock

Endpoint: POST /api/interop/mon-pacing/lock
Body: { "locked": boolean }

Behavior:
- When locked=true, local overrides in the Control UI are discouraged/disabled where applicable.
- A banner appears in Control UI indicating Mon‑Pacing remote control; the UI includes a lock switch for convenience.
- Mon‑Pacing remains the source of truth while remote control is active.


## 9) State & Concept Mapping (Summary)

Mon‑Pacing → Scoreboard mapping (high-level):
- Match → persistent scoreboard state (teams, plan, history)
- Team (id, name, color) → team1/team2 properties
- Round (category, theme, minutes/seconds, type, mixed) → internal Round object
- Score/Penalty → point increments and penalty tracking per team
- Timer (minutes, seconds) → countdown timer state with pause/resume/stop

For a detailed mapping and nuances (e.g., compared/mixed rounds), see the concept mapping document: server/src/modules/interop/MON_PACING_MAPPING.md.


## 10) Authentication & Security

- Set MONPACING_TOKEN on the scoreboard server to enable a bearer token requirement.
- Mon‑Pacing must send Authorization: Bearer <token> on all interop endpoints.
- Use HTTPS in production or secure tunnels/reverse proxy.
- Configure CORS if Mon‑Pacing runs from a different origin.


## 11) Examples

cURL (Windows PowerShell quoting may differ; below uses generic sh-style):

- Import a plan
```
curl -X POST "http://localhost:3001/api/interop/mon-pacing/plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MONPACING_TOKEN" \
  --data '{
    "version":1,
    "matchId":"demo-1",
    "teams":[{"id":"A","name":"Team A","color":"#ff3333"},{"id":"B","name":"Team B","color":"#3333ff"}],
    "rounds":[{"id":"r1","order":1,"category":"Open","theme":"Warmup","minutes":0,"seconds":30,"type":"set","mixed":false}]
  }'
```

- Start a 90-second timer
```
curl -X POST "http://localhost:3001/api/interop/mon-pacing/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MONPACING_TOKEN" \
  --data '{"type":"timer","payload":{"action":"start","durationSec":90}}'
```

- Pause / Resume / Stop
```
curl -X POST "http://localhost:3001/api/interop/mon-pacing/event" -H "Content-Type: application/json" --data '{"type":"pause"}'
curl -X POST "http://localhost:3001/api/interop/mon-pacing/event" -H "Content-Type: application/json" --data '{"type":"resume"}'
curl -X POST "http://localhost:3001/api/interop/mon-pacing/event" -H "Content-Type: application/json" --data '{"type":"timer","payload":{"action":"stop"}}'
```

- Lock local overrides
```
curl -X POST "http://localhost:3001/api/interop/mon-pacing/lock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MONPACING_TOKEN" \
  --data '{"locked":true}'
```

- Get / update category mapping
```
curl "http://localhost:3001/api/interop/mon-pacing/category-map"

curl -X PUT "http://localhost:3001/api/interop/mon-pacing/category-map" \
  -H "Content-Type: application/json" \
  --data '{"Open":"set","Compared":"compared","Mixed":"mixed"}'
```


## 12) Client UI Notes

- Control panel shows a remote banner when Mon‑Pacing is the active source.
- A lock switch lets operators quickly lock/unlock local overrides (mirrors the /lock endpoint).
- Timer controls in the Control UI reflect server state; remaining time ≤ 15s renders in red on the Display.
- A plan import file input accepts Mon‑Pacing JSON; success/error statuses are shown inline.


## 13) End-to-End Test Script

A simple Node script is included to validate the interop quickly:
- scripts/interop_e2e.mjs

Usage (PowerShell):
```
$env:BASE_URL = "http://localhost:3001"
$env:MONPACING_TOKEN = "<token>"  # optional if server requires auth
node scripts/interop_e2e.mjs
```

The script:
- Imports a small demo plan
- Starts/pauses/resumes/stops a timer


## 14) Error Handling & Troubleshooting

Common status codes:
- 200/204 OK
- 400 Bad Request (invalid JSON or payload)
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (token rejected)
- 409 Conflict (plan/match conflict, rare)
- 500 Internal Server Error

Checklist:
- Is MONPACING_INTEROP_ENABLED set to 1?
- If auth is enabled, is Authorization header present and valid?
- Is CORS configured when calling from browsers on a different origin?
- Is the server reachable on the network from Mon‑Pacing?
- Check server logs for detailed errors.


## 15) Versioning & Compatibility

- Plan `version` currently accepts 1; future versions may add fields.
- Event type set may expand; unknown events return 400.
- Category mapping is persisted and can be updated without redeploying.


## 16) Roadmap (Optional Extensions)

- Telemetry/export back to Mon‑Pacing (live scoreboard state and events)
- Webhook subscriptions
- OAuth or mTLS authentication options
- Multi-arena multi-match management endpoints


## 17) Contact

- For scoreboard integration questions, open an issue in the repository with details and reproduction steps.

