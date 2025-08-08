Mon‑Pacing ↔ ImprovScoreboard Concept Mapping

Source: Mon‑Pacing Flutter models (lib/models/*) and integrations (lib/integrations/*)
Target: improvscoreboard2 server/client types

Core entities
- Team
  - Mon‑Pacing: TeamModel { id:int, name:string, color:int (Flutter Color), performers: PerformerModel[] }
  - Scoreboard: state.team1/state.team2 { id:'team1'|'team2', name:string, color:string (#RRGGBB), score:number, penalties:{major,minor} }
  - Mapping rules:
    - name: direct
    - color: convert Flutter color int to #RRGGBB (ignore alpha)
    - performers: not modeled in scoreboard; ignored for now (can carry via notes if needed)
    - id: we support two teams; additional teams ignored

- Improvisation (Round)
  - Mon‑Pacing: ImprovisationModel { id, type: 'mixed'|'compared', category:string, theme:string, durationsInSeconds:number[], notes, timeBufferInSeconds, huddleTimerInSeconds }
  - Scoreboard: RoundConfig { number, isMixed:boolean, type: RoundType, theme:string, minPlayers:number, maxPlayers:number, timeLimit:number|null }
  - Mapping rules:
    - isMixed: type === 'mixed'
    - type (RoundType): derived from category via configured category map; fallback heuristics (music→MUSICAL, long→LONGFORM, narrative→NARRATIVE, character→CHARACTER, short→SHORTFORM, else CHALLENGE)
    - theme: direct from ImprovisationModel.theme
    - timeLimit: primary durationsInSeconds[0] (seconds); if missing, 180s default
    - min/maxPlayers: left to defaults (2..8) unless we add advanced mapping UI
    - timeBuffer/huddle: not modeled; potential future extension to secondary timers

- Pacing (Playlist/Queue)
  - Mon‑Pacing: PacingModel { name, improvisations: ImprovisationModel[], defaultNumberOfTeams }
  - Scoreboard: nextRoundDraft + upcoming[] (RoundConfig queue), or a RoundPlaylist (templates-based)
  - Mapping rules:
    - Plan import: first improvisation → nextRoundDraft; rest → upcoming queue
    - Alternatively, we could synthesize a transient RoundPlaylist from improvisations if useful; current implementation uses queue

- Match
  - Mon‑Pacing: MatchModel { name, teams: TeamModel[], improvisations, penalties: PenaltyModel[], points: PointModel[], stars, tags, + integration fields }
  - Scoreboard: rounds.history[] (RoundHistory) + team total scores (derived in round mode)
  - Mapping rules:
    - points: during end_round event, payload.points { team1, team2 } populate RoundHistory.points and (in round mode) update totals
    - penalties: end_round payload.penalties (array) is reduced to per-team counts { major, minor }
    - stars/tags: not modeled currently
    - enablePenaltiesImpactPoints etc.: not modeled; scoreboard keeps a simple penalty display only

- Penalty
  - Mon‑Pacing: PenaltyModel { teamId:int, major:boolean, type:string, improvisationId }
  - Scoreboard: penalties cached per round result as counts, and live display per team (major/minor totals)
  - Mapping rules:
    - For end_round: reduce array to per-team counts
    - For live penalty event: updatePenalty(teamKey, 'major'|'minor') increments per team live display

- Points
  - Mon‑Pacing: PointModel { teamId, improvisationId, value }
  - Scoreboard: end_round payload includes points for team1/team2
  - Mapping rules:
    - Use end_round payload.points to reflect outcome; scoreboard does not store per-vote granularity

- Timer
  - Mon‑Pacing: TimerStatus { started, paused, stopped }
  - Scoreboard: state.timer { status:'started'|'paused'|'stopped', durationSec, remainingSec, startedAt }
  - Mapping rules:
    - pause/resume/timer { start|stop|set } events map to server timer module
    - Display visibility: showTimer flag toggles badge on Display; color changes to red at ≤ 15s

Transport/events
- Plan import (one-shot): POST /api/interop/mon-pacing/plan { teams:[{name,color}], rounds: Improvisation-like[] }
- Live control (stateless events): POST /api/interop/mon-pacing/event
  - start_round { payload:{ number, round: Improvisation-like } }
  - end_round { payload:{ points:{team1,team2}, penalties?: PenaltyLike[], notes? } }
  - penalty { payload:{ teamId:1|2, major:boolean } }
  - score { payload:{ teamId:1|2, delta:int } }
  - set_visibility { payload:{ target:string, visible:boolean } }
  - pause | resume
  - timer { payload:{ action:'start'|'stop'|'set', durationSec?, remainingSec? } }

Configuration
- Category map (persisted): GET/PUT /api/interop/mon-pacing/category-map; stored at data/monpacing.category-map.json
- Auth: Optional MONPACING_TOKEN (Authorization: Bearer <token>) and feature gate MONPACING_INTEROP_ENABLED

Known gaps / future
- Performers and detailed role/number metadata are not shown in the scoreboard; could be used in future templates
- Penalties impact points: not modeled (scoreboard displays penalties but does not auto-impact totals)
- Export (telemetry): GET /api/interop/mon-pacing/plan returns only teams; can be extended to include upcoming/history
- WebSocket transport for interop: current implementation is HTTP; can add a WS namespace if desired

