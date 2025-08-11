# Scoreboardussy 0.5.1-beta

This is a 0.5-beta snapshot capturing the current progress on real-time match features and Mon-Pacing integration.

Date: 2025-08-11

This is a point release focusing on LAN-friendly startup scripts, Mon-Pacing QR fixes, and layout corrections.

## TL;DR
- New real-time match server scaffolding (MatchStateManager) with server-authoritative timers (100ms ticks)
- Socket.IO events extended for match control and timer updates
- Mon-Pacing interop endpoints: /api/interop/mon-pacing/qr, /plan, /event, /test
- LAN startup scripts for Windows (PowerShell) to bind server and client to your local IP
- Client overlay now auto-targets server at port 3001 using client hostname
- Tailwind CSS ensured to load (fixes side-by-side team layout)
- Frontend: optional Mon-Pacing QR overlay on the display; toggle in Control UI
- qrcode package integrated to render scannable QR automatically

## What’s Implemented

### Server
- TypeScript types for real-time matches and timers
  - server/src/types/match.types.ts
- Event types extended
  - server/src/types/events.types.ts
  - Server→Client: matchStateUpdate, timerUpdate
  - Client→Server: joinMatch/leaveMatch, createMatch, getMatchState, start/pause/resume/stop/setTimerDuration, updateMatchScore, addPenalty
- State manager
  - server/src/modules/state/matches/manager.ts
  - In-memory MatchStateManager keeping MatchState, score, penalties, and a 100ms timer loop
  - Emits timerUpdate to match:{matchId}
- Socket handlers wired
  - server/src/modules/socket/handlers.ts
  - Handlers added for all real-time match operations (feature-gated via ENABLE_REALTIME_MATCHES, ENABLE_MATCH_TIMERS)
- Interop tokens and API
  - server/src/modules/auth/tokens.ts: signInteropToken/verifyInteropToken ({ matchId, scope: 'monpacing' })
  - server/src/modules/api/interop/monpacing.ts:
    - POST /api/interop/mon-pacing/qr → { url, id, token }
    - POST /api/interop/mon-pacing/plan (Bearer) → initializes/loads match and maps teams
    - POST /api/interop/mon-pacing/event (Bearer) → routes timer/points/penalty events

### Client
- Mon-Pacing QR overlay
  - client/src/components/integrations/MonPacingOverlay.tsx
  - Calls /api/interop/mon-pacing/qr using baseUrl and cached matchId
  - Renders QR via qrcode package; falls back to showing raw JSON if unavailable
  - Caches payload and matchId in localStorage
- Display integration
  - client/src/components/scoreboard/ScoreboardDisplay.tsx mounts overlay (bottom-left)
- Control toggle
  - client/src/components/scoreboard/ScoreboardControl.tsx adds a toggle stored in localStorage: enableMonPacingIntegration
- QR rendering dependency
  - client/package.json: qrcode added

### Docs
- REALTIME_MATCH_INTEGRATION_DESIGN.md updated with event names, server endpoints, room strategy, and reconnection approach

## How to Use (Beta)

1) Server flags (optional but recommended)
- ENABLE_REALTIME_MATCHES=true
- ENABLE_MATCH_TIMERS=true

2) Launch server and client
- PowerShell (Windows) LAN scripts:
  - Server: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-server.ps1 -Ip YOUR_LAN_IP -Port 3001
  - Client: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-client.ps1 -Ip YOUR_LAN_IP -Port 5173
- These set PUBLIC_URL and ORIGIN for server; client binds Vite to the specified host/port.
- npm run dev:server
- npm run dev:client

3) Enable Mon-Pacing overlay
- Open Control view (#/control)
- Settings → Mon-Pacing → Enable integration overlay (QR)

4) Open Display view (#/display)
- QR appears in the bottom-left corner
- Scan with Mon-Pacing; it will call /plan and /event

## Compatibility
- Existing scoreboard features remain intact; new features are modular and opt-in
- Match event mapping interoperates without breaking the current UI

## What’s Left / Next Steps

### Server
- Accept caller-specified match IDs so the QR id equals the server’s matchId (DONE)
- Persistence for matches (align with scoreboard persistence files)
- Room isolation end-to-end and authorization hardening
- Rate-limiting / debounce for high-frequency timer updates if needed under heavy load
- Optional: add /api/interop/mon-pacing/test for quick token validation (DONE)

### Client
- Add i18n strings for Mon-Pacing UI (overlay and settings)
- Make overlay position configurable from Control UI (corner selector) (DONE)
- Provide a “Regenerate token/id” button and a “Copy token” button in Control UI (Regenerate DONE; Copy JSON available in overlay)
- Surface match state (e.g., which matchId is linked) in Control UI

### QA / Testing
- Multi-device match cycle tests (start/pause/resume/stop; points; penalties) across networks
- Reconnection handling validation during active timers
- Performance tests with many connected displays and multiple concurrent matches

### Documentation
- Expand REALTIME_MATCH_INTEGRATION_DESIGN.md with specific payload examples from Mon-Pacing
- Add user guide for referees (how to link and run a match)

## Known Limitations (in this beta)
- MatchStateManager now honors provided matchId from QR during /plan; existing matches remain in-memory only
- Timer precision depends on Node event loop; adequate for 100ms UI updates, but not hard real-time
- No per-room auth enforcement beyond token-based join; consider roles/scopes if needed

## Changelog

### 0.5.1-beta
- Scripts: start-server.ps1 and start-client.ps1 for LAN hosting; server sets PUBLIC_URL/ORIGIN; client passes --host/--port.
- Interop overlay: now posts to server base http://<client-hostname>:3001 and embeds that baseUrl in QR payload.
- Tailwind import in client main.tsx to ensure flex layout; restores side-by-side team panels.
- Type fixes and stability for JWT helpers, handlers, and mon-pacing /test route.

### 0.5.0-beta (initial)
- Added real-time match module and Mon-Pacing interop endpoints
- Extended Socket.IO event types and handlers
- Introduced display overlay for quick QR-based linking
- Added qrcode dependency for proper QR rendering

---

Send feedback by filing issues or PRs. This is a beta; interfaces may change before 0.5 stable.
