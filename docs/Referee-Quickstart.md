# Referee Quickstart: Linking Mon-Pacing to Scoreboardussy (0.5-beta)

Audience: Referees and techs who want to control the scoreboard timer and teams from the Mon-Pacing mobile app.

Prerequisites
- Scoreboardussy server running and reachable on the network (default http://<server-host>:3001)
- Scoreboardussy client (display UI) running (default http://<server-host>:5173)
- Mon-Pacing mobile app (branch with realtime match integration)

Steps
1) Start the server and client
- Server: npm run dev:server (or use scripts/start-server.ps1 with your LAN IP)
- Client: npm run dev:client (or use scripts/start-client.ps1 with your LAN IP)

2) Enable the Mon-Pacing QR overlay
- Open Control view: http://<server-host>:5173/#/control
- In Settings, enable “Mon-Pacing → Enable integration overlay (QR)”
- Optionally set overlay corner and click “Regenerate QR/ID” if needed

3) Open the Display view
- Go to http://<server-host>:5173/#/display
- A QR appears in the chosen corner

4) Scan the QR from Mon-Pacing
- Use the scanner in the Mon-Pacing app to scan the QR on the display
- The QR contains { url, id, token }
  - url points to http://<server-host>:3001/api/interop/mon-pacing
  - id is the matchId used for your session
  - token is a Bearer token scoped to that matchId

5) Control the match
- The Mon-Pacing app will POST to:
  - {url}/match with the full match data
  - {url}/timer with timer status updates (start/pause/stop, with durations)
- The scoreboard will reflect team names/colors and timer state.

Troubleshooting
- No QR? Ensure the overlay toggle is enabled in Control and refresh the Display view.
- Scan fails? Verify the display and server are on the same network and that the server URL is reachable from the phone.
- Timer doesn’t move? Check that ENABLE_MATCH_TIMERS=true in the server environment and that the server logs show the /timer calls.
- Wrong server URL in QR? Set VITE_SERVER_ORIGIN on the client build or ensure both client and server run on the same host.

Notes
- Tokens are short-lived and scoped to the matchId.
- Legacy endpoint /event is still accepted but the app uses /match and /timer in current builds.

