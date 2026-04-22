# Version 0.5 — Deployment and Multi‑Session Progress

This document summarizes the recent work to make Scoreboardussy easy to distribute and run on Windows, to package it in containers for ops, and to evolve the backend into a multi‑tenant, cloud‑ready service.

Last updated: 2025-08-09

## Highlights
- One‑click Windows portable build (no Docker/Node required)
- Optional Windows installer pipeline (Inno Setup)
- Container packaging (Dockerfile + compose) and a TLS reverse proxy stack for a VPS
- Multi‑session groundwork: Rooms API, signed join tokens, Socket.IO room auth, and client join flow
- CI workflows for build/test and Windows portable release
- M2 scaffolding for true per‑room state via Redis + Postgres (Prisma)

---

## Deployment deliverables

### Windows portable build (no install required)
- Script: `installer/windows/build-windows-installer.ps1`
  - Builds client (`client/dist`) and server (`server/dist`)
  - Packages server as a single exe via `pkg` (bundles Node runtime)
  - Stages client + server so Express serves the built frontend
  - Produces a portable ZIP: `release/windows/artifacts/ImprovScoreboard_Portable_<version>.zip`
- Usage:
  1) Extract the zip.
  2) Run `server/ImprovScoreboard.exe`.
  3) Open `http://localhost:3001/` and `http://localhost:3001/#/control`.
- LAN access: browse to `http://<your-ip>:3001/` from devices on the same network.
- CORS: Packaged mode allows all origins for easy LAN usage.

### Windows installer (optional)
- Inno Setup script: `installer/windows/ImprovScoreboard.iss`
- The build script will compile the installer if `iscc` (Inno Setup 6) is in PATH.
- Installer does:
  - Installs to `Program Files\ImprovScoreboard`
  - Lays out `server/ImprovScoreboard.exe` and `client/dist` (server serves the client)
  - Adds firewall rule for TCP 3001
  - Creates shortcuts; optional autorun
  - Launches app post‑install

### Container packaging
- Dockerfile (multi‑stage): builds client + server, runtime serves on port 3001, volume for `server/data`.
- `docker-compose.yml`: single container for local usage (exposes 3001).
- `.dockerignore`: trims build context.
- Start/Stop convenience: `Start-Scoreboard.bat`, `Stop-Scoreboard.bat` for Windows users with Docker Desktop.

### VPS reverse proxy stack
- `docker-compose.vps.yml`: `web` (Node app) + `caddy` for TLS (Let’s Encrypt).
- `Caddyfile`: replace `yourdomain.com` with the real domain.
- Env to set on VPS:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `JWT_SECRET=your-strong-secret`
  - `PUBLIC_URL=https://yourdomain.com`
  - Optional (M2): `DATABASE_URL`, `REDIS_URL`

### CORS policy
- Dev: allow localhost:5173.
- Packaged EXE: allow all origins (intended for LAN usage).
- Production server: if `PUBLIC_URL` or `ORIGIN` provided, restrict to those.

### GitHub Release automation
- Uses `gh` CLI to create a tag and upload the portable zip.
- CI workflow `release-windows.yml`: on tag push (`v*`), builds portable zip via the PowerShell script and attaches it to the release.

### CI build/test
- `ci.yml` builds client, type‑checks server, and runs tests for both (non‑blocking if tests are flaky for now).

---

## Multi‑session (Rooms) — Current Status (M1)

### What’s implemented
- Rooms API
  - `POST /api/rooms` creates a room and returns:
    - `room`: `{ id, code }`
    - `urls`: display `/room/<code>`, control `/room/<code>#/control`
    - `tokens`: JWTs for roles: `referee`, `display`, `viewer`
  - `GET /api/rooms/:code` resolves basic info.
- Auth tokens
  - JWTs signed with `JWT_SECRET` identifying `{ roomId, role }`.
- Socket.IO auth middleware
  - Accepts token via handshake `auth.token` or `x-room-token` header.
  - Verifies token; socket joins `room:<roomId>` channel.
- Broadcasting shim
  - `broadcastState(io, roomId?)` emits to that room channel when available.
  - Underlying app state remains global (M1), so functionality is unchanged; routing is ready.
- Client join flow
  - New Home screen `#/home` with “Create Room” button (calls `POST /api/rooms`).
  - Client captures `?token=...` from URL and stores it; Socket.IO handshake includes the token automatically.
  - Existing `#/display` and `#/control` still work for local single‑room use.
- Env/config docs and scaffolds
  - `server/.env.example`, README updates.
  - Optional Socket.IO Redis adapter (if `REDIS_URL` set) — adapter enabled at startup.

### Why it matters
- You can now issue role‑based, signed tokens for sessions and logically separate sockets into rooms — essential groundwork for multi‑tenant hosting.

---

## M2 (Per‑Room State) — Scaffolding in place

M2’s goal: true isolation so many matches (rooms) can run at the same time across processes, with persistence and recovery.

### Building blocks added
- Room state service interface
  - `server/src/modules/roomState/types.ts` — `RoomStateService` (get, set, update).
- Implementations
  - In‑memory (default) — `inMemory.ts` (seeds from current global state for now).
  - Redis live store — `redis.ts` (`room:<id>:state` JSON); enables horizontal scaling and shared live state.
  - Prisma event store — `prismaEventStore.ts` for append‑only events and periodic snapshots in Postgres.
- Data model (Prisma)
  - `Room`, `RoomEvent`, `RoomSnapshot` — see `server/prisma/schema.prisma`.
- Local dev stack
  - `docker-compose.dev.yml`: Postgres (app/example) and Redis services exposed locally.
  - Example env:
    - `DATABASE_URL=postgresql://app:example@localhost:5432/improvscoreboard?schema=public`
    - `REDIS_URL=redis://localhost:6379`

### What Phase B will do (next)
- Refactor socket handlers to read/write room state via `RoomStateService` (no more shared global state), and to append events + snapshots (if DB enabled).
- Recovery path: when a room is first used on a node, hydrate from latest snapshot + subsequent events into Redis.
- Smoke test: create two rooms, change state independently, confirm isolation client‑side and via events.

---

## Usage cheat‑sheet

### Dev (no DB/Redis)
- Server: `server/` → `npm install` → `npm run dev`
- Client: `client/` → `npm install` → `npm run dev`
- Create room: open `http://localhost:5173/#/home` → Create Room

### Dev with Postgres + Redis
- Start services: `docker compose -f docker-compose.dev.yml up -d`
- Env (server/.env): set `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`
- Generate Prisma client: `npx prisma generate`
- Start server/client as above

### VPS
- Set env: `JWT_SECRET`, `PUBLIC_URL`, `PORT=3001`, optional `DATABASE_URL`, `REDIS_URL`
- Put domain in `Caddyfile`, then: `docker compose -f docker-compose.vps.yml up -d --build`

### Windows portable
- Build zip locally: `powershell.exe -File installer/windows/build-windows-installer.ps1 -Version <v>`
- Run: extract → `server/ImprovScoreboard.exe` → open `http://localhost:3001/`

---

## Open items / Next steps
- Phase B (M2) — Switch to per‑room state
  - Replace direct state calls in socket handlers with `RoomStateService`.
  - If Redis present: use Redis live store; enable Socket.IO Redis adapter (already scaffolded).
  - If Postgres present: append events; write snapshots periodically; add recovery on room init.
- QA: room isolation smoke test with two concurrent rooms.
- Security hardening for production server mode
  - CORS restricted to `PUBLIC_URL`/`ORIGIN`.
  - Add rate limiting, input validation (zod), and logging polish.
- Release automation
  - Optionally add installer build to GitHub Actions (requires Inno Setup on a Windows runner).
- Documentation
  - Admin guide for VPS deployment and backups (Postgres), and ops runbook for Redis.

---

## Notes
- Packaged EXE mode is optimized for “one host on the LAN” usage (fast setup, minimal friction). Production multi‑tenant hosting is addressed by the VPS stack with Caddy + Node + optional Redis/Postgres.
- The client’s new room join flow is backward‑compatible: local single‑room work continues to function.
