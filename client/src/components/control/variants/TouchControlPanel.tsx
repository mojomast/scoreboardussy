import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScoreboardState,
  UpdateScorePayload,
  UpdatePenaltyPayload,
  ResetPenaltiesPayload,
  Team,
  UpdateVisibilityPayload,
} from '@server-types/index';
import {
  RoundConfig,
  EndRoundPayload,
} from '@server-types/rounds.types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TimerAction = 'start' | 'pause' | 'reset' | 'add' | 'subtract';

export interface TimerState {
  elapsed: number;        // seconds
  isRunning: boolean;
  isOvertime: boolean;
}

export interface TouchControlPanelProps {
  /** Full scoreboard state */
  gameState: ScoreboardState;

  /* -- Score -- */
  onUpdateScore: (payload: UpdateScorePayload) => void;

  /* -- Penalties -- */
  onUpdatePenalty: (payload: UpdatePenaltyPayload) => void;
  onResetPenalties: (payload: ResetPenaltiesPayload) => void;

  /* -- Round lifecycle -- */
  onStartRound: (config: RoundConfig) => void;
  onEndRound: (results: EndRoundPayload) => void;
  onStartGame?: () => void;
  onFinishGame?: () => void;

  /* -- Timer -- */
  timer?: TimerState;
  onTimerControl?: (action: TimerAction, value?: number) => void;

  /* -- Team config -- */
  onUpdateTeam: (payload: { teamId: 'team1' | 'team2'; updates: Partial<Pick<Team, 'name' | 'color'>> }) => void;

  /* -- Display / UI -- */
  /* -- Display / UI (optional callbacks) -- */
  onUpdateVisibility?: (payload: UpdateVisibilityPayload) => void;

  /* -- Meta -- */
  onResetAll?: () => void;
  onExportMatch?: () => void;
  onOpenDisplay?: () => void;
  isConnected?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#D946EF', '#F43F5E', '#1F2937',
];

const SWATCH_SIZE = 56; // px – big enough for a thumb

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function useHoldAction(callback: () => void, intervalMs = 150) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useCallback(() => {
    callback();
    intervalRef.current = setInterval(callback, intervalMs);
  }, [callback, intervalMs]);
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  useEffect(() => () => stop(), [stop]);
  return { start, stop };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Large, thumb-friendly score button */
const ScoreButton: React.FC<{
  label: string;
  onClick: () => void;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  disabled?: boolean;
  className?: string;
}> = ({ label, onClick, color, disabled, className = '' }) => {
  const colorMap: Record<string, string> = {
    green: 'bg-emerald-500 active:bg-emerald-700 border-emerald-600',
    red: 'bg-rose-500 active:bg-rose-700 border-rose-600',
    blue: 'bg-sky-500 active:bg-sky-700 border-sky-600',
    yellow: 'bg-amber-400 active:bg-amber-600 border-amber-500 text-black',
    gray: 'bg-gray-400 active:bg-gray-600 border-gray-500',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorMap[color]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
        flex-1 min-h-[88px] rounded-2xl border-b-4
        text-3xl font-bold text-white shadow-md
        flex items-center justify-center select-none
        transition-transform duration-75
        ${className}
      `}
    >
      {label}
    </button>
  );
};

/** Big round action button (Start / End) */
const RoundActionButton: React.FC<{
  label: string;
  onClick: () => void;
  color: 'green' | 'red' | 'blue';
  disabled?: boolean;
}> = ({ label, onClick, color, disabled }) => {
  const map: Record<string, string> = {
    green: 'bg-emerald-500 active:bg-emerald-700 border-emerald-600',
    red: 'bg-rose-600 active:bg-rose-800 border-rose-700',
    blue: 'bg-sky-600 active:bg-sky-800 border-sky-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${map[color]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
        w-full min-h-[96px] rounded-2xl border-b-4
        text-2xl font-bold text-white shadow-lg
        flex items-center justify-center select-none
        transition-transform duration-75
      `}
    >
      {label}
    </button>
  );
};

/** Quick penalty badge */
const PenaltyBadge: React.FC<{
  count: number;
  type: 'major' | 'minor';
}> = ({ count, type }) => {
  const isMajor = type === 'major';
  return (
    <div
      className={`
        inline-flex items-center justify-center
        min-w-[48px] h-10 rounded-full px-3
        text-xl font-bold text-white
        ${isMajor ? 'bg-red-500' : 'bg-amber-400 text-black'}
      `}
    >
      {count}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const TouchControlPanel: React.FC<TouchControlPanelProps> = ({
  gameState,
  onUpdateScore,
  onUpdatePenalty,
  onResetPenalties,
  onStartRound,
  onEndRound,
  onStartGame,
  onFinishGame,
  timer,
  onTimerControl,
  onUpdateTeam,
  onUpdateVisibility,
  onResetAll,
  onExportMatch,
  onOpenDisplay,
  isConnected = true,
}) => {
  const { t } = useTranslation();
  const { team1, team2, rounds, titleText, footerText, showScore, showPenalties } = gameState;
  const currentRound = rounds.current;
  const isBetween = rounds.isBetweenRounds;
  const gameStatus = (rounds as any).gameStatus ?? 'notStarted';
  const isLive = gameStatus === 'live';

  /* -- Local state for team names (commit on blur or explicit save) -- */
  const [name1, setName1] = useState(team1.name);
  const [name2, setName2] = useState(team2.name);
  useEffect(() => setName1(team1.name), [team1.name]);
  useEffect(() => setName2(team2.name), [team2.name]);

  /* -- Timer gestures -- */
  const timerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTimerTouchStart = (e: React.TouchEvent) => {
    const tch = e.touches[0];
    touchStartX.current = tch.clientX;
    touchStartY.current = tch.clientY;
  };

  const handleTimerTouchEnd = (e: React.TouchEvent) => {
    if (!onTimerControl || !timer) return;
    const tch = e.changedTouches[0];
    const dx = tch.clientX - touchStartX.current;
    const dy = tch.clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 40) return; // too small

    if (absDx > absDy) {
      // horizontal swipe
      onTimerControl(dx > 0 ? 'add' : 'subtract', 10);
    } else {
      // vertical swipe
      onTimerControl(dy > 0 ? 'reset' : timer.isRunning ? 'pause' : 'start');
    }
  };

  /* -- Hold-to-repeat for score -- */
  const makeHold = (cb: () => void) => useHoldAction(cb);

  const inc1 = useCallback(() => onUpdateScore({ teamId: 'team1', action: 1 }), [onUpdateScore]);
  const dec1 = useCallback(() => onUpdateScore({ teamId: 'team1', action: -1 }), [onUpdateScore]);
  const inc2 = useCallback(() => onUpdateScore({ teamId: 'team2', action: 1 }), [onUpdateScore]);
  const dec2 = useCallback(() => onUpdateScore({ teamId: 'team2', action: -1 }), [onUpdateScore]);

  const holdInc1 = makeHold(inc1);
  const holdDec1 = makeHold(dec1);
  const holdInc2 = makeHold(inc2);
  const holdDec2 = makeHold(dec2);

  /* -- Round helpers -- */
  const handleStartRound = () => {
    const nextNum = (rounds.history?.length || 0) + 1;
    onStartRound({
      number: nextNum,
      isMixed: false,
      theme: '',
      type: 'shortform' as any,
      minPlayers: 2,
      maxPlayers: 8,
      timeLimit: null,
    });
    if (onStartGame && gameStatus === 'notStarted') onStartGame();
  };

  const handleEndRound = () => {
    onEndRound({
      points: { team1: 0, team2: 0 },
      penalties: {
        team1: { major: team1.penalties.major, minor: team1.penalties.minor },
        team2: { major: team2.penalties.major, minor: team2.penalties.minor },
      },
      notes: '',
    });
  };

  /* -- Team color swatches -- */
  const handleColorPick = (teamId: 'team1' | 'team2', color: string) => {
    onUpdateTeam({ teamId, updates: { color } });
  };

  /* -- Visibility toggles -- */
  const toggleScore = () => onUpdateVisibility?.({ target: 'score', visible: !showScore });
  const togglePenalties = () => onUpdateVisibility?.({ target: 'penalties', visible: !showPenalties });

  /* -- Derived timer display -- */
  const timerDisplay = timer ? formatTime(timer.elapsed) : '00:00';
  const timerColor = timer?.isOvertime ? 'text-rose-500' : 'text-white';

  return (
    <div className="min-h-screen bg-gray-950 text-white select-none overflow-x-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight">{t('touchControl.title', 'Backstage Control')}</h1>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <span className="px-3 py-1 rounded-full bg-rose-600 text-sm font-semibold">Offline</span>
          )}
          {onOpenDisplay && (
            <button
              onClick={onOpenDisplay}
              className="px-4 py-2 rounded-xl bg-sky-600 active:bg-sky-800 text-sm font-bold border-b-4 border-sky-800 active:scale-95 transition-transform"
            >
              {t('touchControl.openDisplay', 'Open Display')}
            </button>
          )}
        </div>
      </header>

      <main className="p-4 grid grid-cols-12 gap-4">
        {/* ============================================================ */}
        {/* LEFT COLUMN – Score & Penalties (6 cols)                     */}
        {/* ============================================================ */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          {/* ---- Team 1 Card ---- */}
          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full border-2 border-white/20 shrink-0"
                style={{ backgroundColor: team1.color }}
              />
              <input
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                onBlur={() => {
                  if (name1.trim() && name1 !== team1.name) {
                    onUpdateTeam({ teamId: 'team1', updates: { name: name1.trim() } });
                  }
                }}
                className="bg-transparent text-2xl font-bold w-full outline-none border-b-2 border-transparent focus:border-sky-500 transition-colors placeholder-gray-600"
                placeholder={t('touchControl.teamNamePlaceholder', 'Team Name')}
              />
            </div>

            {/* Score */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-6xl font-black tabular-nums">{team1.score}</div>
              <div className="flex gap-3">
                <ScoreButton
                  label="−"
                  color="red"
                  disabled={team1.score <= 0}
                  onClick={dec1}
                  // @ts-ignore – custom props for hold
                  onTouchStart={holdDec1.start}
                  onTouchEnd={holdDec1.stop}
                  onMouseDown={holdDec1.start}
                  onMouseUp={holdDec1.stop}
                  onMouseLeave={holdDec1.stop}
                />
                <ScoreButton
                  label="+"
                  color="green"
                  onClick={inc1}
                  // @ts-ignore
                  onTouchStart={holdInc1.start}
                  onTouchEnd={holdInc1.stop}
                  onMouseDown={holdInc1.start}
                  onMouseUp={holdInc1.stop}
                  onMouseLeave={holdInc1.stop}
                />
              </div>
            </div>

            {/* Penalties */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onUpdatePenalty({ teamId: 'team1', type: 'major', action: 1 })}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 active:bg-red-500/40 border border-red-500/30 transition-colors"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-red-300">Major</span>
                  <PenaltyBadge count={team1.penalties.major} type="major" />
                </button>
                <button
                  onClick={() => onUpdatePenalty({ teamId: 'team1', type: 'minor', action: 1 })}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400/20 active:bg-amber-400/40 border border-amber-400/30 transition-colors"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-amber-300">Minor</span>
                  <PenaltyBadge count={team1.penalties.minor} type="minor" />
                </button>
              </div>
              <button
                onClick={() => onResetPenalties({ teamId: 'team1' })}
                className="px-3 py-2 rounded-xl bg-gray-800 active:bg-gray-700 text-gray-400 text-sm font-bold border border-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ---- Team 2 Card ---- */}
          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full border-2 border-white/20 shrink-0"
                style={{ backgroundColor: team2.color }}
              />
              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                onBlur={() => {
                  if (name2.trim() && name2 !== team2.name) {
                    onUpdateTeam({ teamId: 'team2', updates: { name: name2.trim() } });
                  }
                }}
                className="bg-transparent text-2xl font-bold w-full outline-none border-b-2 border-transparent focus:border-sky-500 transition-colors placeholder-gray-600"
                placeholder={t('touchControl.teamNamePlaceholder', 'Team Name')}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-6xl font-black tabular-nums">{team2.score}</div>
              <div className="flex gap-3">
                <ScoreButton
                  label="−"
                  color="red"
                  disabled={team2.score <= 0}
                  onClick={dec2}
                  // @ts-ignore
                  onTouchStart={holdDec2.start}
                  onTouchEnd={holdDec2.stop}
                  onMouseDown={holdDec2.start}
                  onMouseUp={holdDec2.stop}
                  onMouseLeave={holdDec2.stop}
                />
                <ScoreButton
                  label="+"
                  color="green"
                  onClick={inc2}
                  // @ts-ignore
                  onTouchStart={holdInc2.start}
                  onTouchEnd={holdInc2.stop}
                  onMouseDown={holdInc2.start}
                  onMouseUp={holdInc2.stop}
                  onMouseLeave={holdInc2.stop}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onUpdatePenalty({ teamId: 'team2', type: 'major', action: 1 })}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 active:bg-red-500/40 border border-red-500/30 transition-colors"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-red-300">Major</span>
                  <PenaltyBadge count={team2.penalties.major} type="major" />
                </button>
                <button
                  onClick={() => onUpdatePenalty({ teamId: 'team2', type: 'minor', action: 1 })}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400/20 active:bg-amber-400/40 border border-amber-400/30 transition-colors"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-amber-300">Minor</span>
                  <PenaltyBadge count={team2.penalties.minor} type="minor" />
                </button>
              </div>
              <button
                onClick={() => onResetPenalties({ teamId: 'team2' })}
                className="px-3 py-2 rounded-xl bg-gray-800 active:bg-gray-700 text-gray-400 text-sm font-bold border border-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ---- Round Controls ---- */}
          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-lg">
            <h2 className="text-lg font-bold text-gray-300 mb-3 uppercase tracking-wider">
              {t('touchControl.round', 'Round')}
            </h2>
            {isLive && !isBetween && currentRound ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-xl font-semibold">
                    {t('touchControl.roundNum', 'Round {{n}}', { n: currentRound.number })}
                  </span>
                  <span className="text-sm bg-gray-800 px-3 py-1 rounded-full">{currentRound.type}</span>
                </div>
                {currentRound.theme && (
                  <p className="text-gray-400 text-sm italic">{currentRound.theme}</p>
                )}
                <RoundActionButton
                  label={t('touchControl.endRound', 'End Round')}
                  color="red"
                  onClick={handleEndRound}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-gray-400 text-sm">
                  {isBetween
                    ? t('touchControl.betweenRounds', 'Between rounds')
                    : t('touchControl.noRound', 'No active round')}
                </p>
                <RoundActionButton
                  label={t('touchControl.startRound', 'Start Round')}
                  color="green"
                  onClick={handleStartRound}
                  disabled={!isConnected}
                />
                {gameStatus === 'live' && onFinishGame && (
                  <RoundActionButton
                    label={t('touchControl.finishGame', 'Finish Game')}
                    color="red"
                    onClick={onFinishGame}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN – Timer, Config, Preview (6 cols)               */}
        {/* ============================================================ */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          {/* ---- Timer ---- */}
          <div
            ref={timerRef}
            className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-lg relative overflow-hidden"
            onTouchStart={handleTimerTouchStart}
            onTouchEnd={handleTimerTouchEnd}
          >
            <h2 className="text-lg font-bold text-gray-300 mb-2 uppercase tracking-wider">
              {t('touchControl.timer', 'Timer')}
            </h2>
            <div className={`text-7xl font-black text-center tabular-nums tracking-tight ${timerColor}`}>
              {timerDisplay}
            </div>
            {timer?.isRunning && (
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            )}

            {/* Timer controls */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <button
                onClick={() => onTimerControl?.('reset')}
                className="py-4 rounded-xl bg-gray-800 active:bg-gray-700 text-gray-300 font-bold text-lg border-b-4 border-gray-900 active:scale-95 transition-transform"
              >
                Reset
              </button>
              <button
                onClick={() => onTimerControl?.(timer?.isRunning ? 'pause' : 'start')}
                className={`
                  py-4 rounded-xl font-bold text-lg border-b-4 active:scale-95 transition-transform
                  ${timer?.isRunning
                    ? 'bg-amber-500 active:bg-amber-700 border-amber-700 text-black'
                    : 'bg-emerald-500 active:bg-emerald-700 border-emerald-700 text-white'}
                `}
              >
                {timer?.isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => onTimerControl?.('add', 30)}
                className="py-4 rounded-xl bg-sky-600 active:bg-sky-800 text-white font-bold text-lg border-b-4 border-sky-800 active:scale-95 transition-transform"
              >
                +30s
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Swipe ↔ to ±10s · Swipe ↓ to start/pause · Swipe ↑ to reset
            </p>
          </div>

          {/* ---- Team Config (colors) ---- */}
          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-lg">
            <h2 className="text-lg font-bold text-gray-300 mb-3 uppercase tracking-wider">
              {t('touchControl.teamColors', 'Team Colors')}
            </h2>
            <div className="space-y-4">
              {/* Team 1 swatches */}
              <div>
                <p className="text-sm text-gray-400 mb-2 font-semibold">{team1.name || 'Team 1'}</p>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorPick('team1', c)}
                      className={`
                        rounded-full border-2 transition-transform active:scale-90
                        ${team1.color.toUpperCase() === c.toUpperCase() ? 'border-white scale-110' : 'border-transparent'}
                      `}
                      style={{ width: SWATCH_SIZE, height: SWATCH_SIZE, backgroundColor: c }}
                      aria-label={`Set Team 1 color ${c}`}
                    />
                  ))}
                </div>
              </div>
              {/* Team 2 swatches */}
              <div>
                <p className="text-sm text-gray-400 mb-2 font-semibold">{team2.name || 'Team 2'}</p>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorPick('team2', c)}
                      className={`
                        rounded-full border-2 transition-transform active:scale-90
                        ${team2.color.toUpperCase() === c.toUpperCase() ? 'border-white scale-110' : 'border-transparent'}
                      `}
                      style={{ width: SWATCH_SIZE, height: SWATCH_SIZE, backgroundColor: c }}
                      aria-label={`Set Team 2 color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---- Audience Preview ---- */}
          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 shadow-lg">
            <h2 className="text-lg font-bold text-gray-300 mb-3 uppercase tracking-wider">
              {t('touchControl.preview', 'Audience Preview')}
            </h2>
            <div className="bg-black rounded-2xl overflow-hidden border border-gray-800 relative h-48">
              {/* Title */}
              {titleText && (
                <div className="absolute top-2 left-0 right-0 text-center text-xs font-bold text-gray-300 truncate px-4">
                  {titleText}
                </div>
              )}
              {/* Scores */}
              <div className="flex h-full items-center justify-between px-6 pt-6">
                <div className="text-center w-1/3">
                  <div className="text-xs font-bold truncate mb-1" style={{ color: team1.color }}>
                    {team1.name}
                  </div>
                  <div className="text-4xl font-black">{showScore ? team1.score : '—'}</div>
                  {showPenalties && (team1.penalties.major > 0 || team1.penalties.minor > 0) && (
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: team1.penalties.major }).map((_, i) => (
                        <div key={`m1-${i}`} className="w-2 h-2 bg-red-500 rounded-sm" />
                      ))}
                      {Array.from({ length: team1.penalties.minor }).map((_, i) => (
                        <div key={`n1-${i}`} className="w-2 h-2 bg-amber-400 rounded-sm" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-gray-600 text-xl font-light">vs</div>
                <div className="text-center w-1/3">
                  <div className="text-xs font-bold truncate mb-1" style={{ color: team2.color }}>
                    {team2.name}
                  </div>
                  <div className="text-4xl font-black">{showScore ? team2.score : '—'}</div>
                  {showPenalties && (team2.penalties.major > 0 || team2.penalties.minor > 0) && (
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: team2.penalties.major }).map((_, i) => (
                        <div key={`m2-${i}`} className="w-2 h-2 bg-red-500 rounded-sm" />
                      ))}
                      {Array.from({ length: team2.penalties.minor }).map((_, i) => (
                        <div key={`n2-${i}`} className="w-2 h-2 bg-amber-400 rounded-sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Footer */}
              {footerText && (
                <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500 truncate px-4">
                  {footerText}
                </div>
              )}
            </div>

            {/* Quick visibility toggles */}
            <div className="flex gap-3 mt-3">
              <button
                onClick={toggleScore}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-b-4 active:scale-95 transition-transform ${
                  showScore
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-gray-800 border-gray-900 text-gray-500'
                }`}
              >
                Score {showScore ? 'On' : 'Off'}
              </button>
              <button
                onClick={togglePenalties}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-b-4 active:scale-95 transition-transform ${
                  showPenalties
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-gray-800 border-gray-900 text-gray-500'
                }`}
              >
                Penalties {showPenalties ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* ---- Utility Row ---- */}
          <div className="grid grid-cols-2 gap-4">
            {onExportMatch && (
              <button
                onClick={onExportMatch}
                className="py-4 rounded-xl bg-indigo-600 active:bg-indigo-800 text-white font-bold border-b-4 border-indigo-800 active:scale-95 transition-transform"
              >
                Export Match
              </button>
            )}
            {onResetAll && (
              <button
                onClick={onResetAll}
                className="py-4 rounded-xl bg-rose-700 active:bg-rose-900 text-white font-bold border-b-4 border-rose-900 active:scale-95 transition-transform"
              >
                Restart Match
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TouchControlPanel;
