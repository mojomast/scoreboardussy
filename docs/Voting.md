# Audience Voting API

Status: experimental (in-memory only)

This document describes the voting endpoints exposed by the server under /api/voting. Voting allows audience members to vote for Team 1 or Team 2 during a session started by the referee.

Base URL
- http://<server-host>:3001/api/voting

Endpoints

1) GET /state
Returns current voting state.

Response:
{
  "active": boolean,
  "matchId": string | null,
  "votes": { "team1": number, "team2": number },
  "enabled": boolean
}

2) POST /enable
Enable or disable the voting feature globally. Useful to hide or block voting when not wanted.

Request JSON:
{ "enabled": boolean }

Response JSON:
{ "enabled": boolean }

3) POST /start
Start a voting session. Resets counts to 0 for team1 and team2.

Request JSON:
{ "matchId"?: string }

Response JSON:
{
  "active": true,
  "votes": { "team1": 0, "team2": 0 },
  "enabled": boolean,
  "ok": boolean
}

4) POST /vote/:teamId
Cast a vote for a team while a session is active.

Path params:
- teamId: "team1" | "team2"

Response JSON (on success):
{ "ok": true, "votes": { "team1": number, "team2": number } }

Errors:
- 400 { "error": "Voting not active" }
- 400 { "error": "Invalid team" }

5) POST /end
End the voting session and optionally auto-award a point to the winner in the scoreboard totals.

Request JSON:
{ "matchId"?: string, "autoAward"?: boolean }

Response JSON:
{
  "active": false,
  "result": {
    "winner": "team1" | "team2" | null,
    "team1": number,
    "team2": number
  }
}

Behavior notes
- When a session ends, winner is null if tied.
- If autoAward=true and there is a winner, the server increments that team’s score in the main scoreboard state.
- Votes are stored in-memory and reset each time /start is called; they do not persist across server restarts.

## UI Integration

The scoreboard display automatically shows voting elements when a session is active:

### Live Vote Count Display
- **Prominent center overlay** showing real-time vote counts for both teams
- **Updates every 2 seconds** with live vote tallies
- **Team colors and names** clearly displayed (blue for Team 1, red for Team 2)
- **Professional styling** with yellow border and "AUDIENCE VOTING" header
- **Automatically appears/disappears** based on voting session state

### QR Code for Voting
- **QR code** appears in bottom-right corner during active voting
- **Links to `/api/voting/page`** - mobile-friendly voting interface
- **"Scan to vote" instruction** for audience guidance
- **140x140 pixel size** for easy scanning from distance

## Session-Based Voting

**New Features:**
- **One vote per person** - Each user gets a unique session ID
- **Vote switching** - Users can change their vote until voting ends
- **Session persistence** - Vote choice saved in browser localStorage
- **Enhanced UI** - Beautiful mobile-friendly voting page with visual feedback

## Example Voting Flow

1. **Start Voting Session** (from Control panel):
   ```
   POST /api/voting/start
   { "matchId": "round-5" }
   ```
   - Resets vote counts to 0
   - Clears all previous sessions
   - QR code appears on display
   - Audience can scan and vote

2. **During Voting**:
   - Audience visits `/api/voting/page` via QR
   - Clicks "Team 1" or "Team 2" buttons
   - Each click sends: `POST /api/voting/vote/team1` or `POST /api/voting/vote/team2`
   - Vote counts increment in real-time

3. **End Voting Session** (from Control panel):
   
   **Option A - End with Auto-Award:**
   ```
   POST /api/voting/end
   { "autoAward": true }
   ```
   - Determines winner based on vote count
   - Automatically adds 1 point to winning team's scoreboard
   - QR disappears from display
   
   **Option B - End without Award:**
   ```
   POST /api/voting/end
   { "autoAward": false }
   ```
   - Ends voting but doesn't change scoreboard
   - Referee can manually award points if desired
   - QR disappears from display

## Control Panel Integration

The Control panel (`#/control`) provides three buttons for voting:
- **"Start Vote (show QR)"** - Starts a new voting session
- **"End Vote + Auto-Award"** - Ends voting and awards point to winner
- **"End Vote (no award)"** - Ends voting without changing scores

## QR Code Access

- **Display Integration**: QR automatically appears/disappears based on voting state
- **Direct QR Image**: Available at `/api/voting/qr` (240x240 PNG)
- **Voting Page**: Available at `/api/voting/page` (mobile-friendly HTML)

