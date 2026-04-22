import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScoreboardState, Team } from '@server-types/index';
import { RoundConfig, RoundType } from '@server-types/rounds.types';

interface GamepadControlPanelProps {
  gameState: ScoreboardState | null;
  isConnected: boolean;
  onUpdateScore: (payload: { teamId: 'team1' | 'team2'; action: number }) => void;
  onUpdatePenalty: (payload: { teamId: 'team1' | 'team2'; type: 'major' | 'minor'; action: number }) => void;
  onResetPenalties: (payload: { teamId: 'team1' | 'team2' }) => void;
  onUpdateTeam: (payload: { teamId: 'team1' | 'team2'; updates: Partial<Pick<Team, 'name' | 'color'>> }) => void;
  onStartRound: (config: RoundConfig) => void;
  onEndRound: (results: { points: { team1: number; team2: number }; penalties: { team1: { major: number; minor: number }; team2: { major: number; minor: number } }; notes: string }) => void;
  onTimerControl: (action: 'start' | 'pause' | 'reset' | 'add' | 'sub', value?: number) => void;
  onResetAll: () => void;
  onStartGame: () => void;
  onFinishGame: () => void;
  timerSeconds?: number;
  isTimerRunning?: boolean;
}

const BTN_A = '#22c55e'; // Green
const BTN_B = '#ef4444'; // Red
const BTN_X = '#3b82f6'; // Blue
const BTN_Y = '#eab308'; // Yellow

const CONTROLLER_BG = '#1a1a2e';
const CONTROLLER_BODY = '#16213e';
const GRIP_COLOR = '#0f3460';
const SCREEN_BG = '#0a0a0a';
const DPAD_COLOR = '#2d2d2d';
const SHOULDER_COLOR = '#e94560';
const TRIGGER_COLOR = '#533483';
const MENU_BTN = '#4a4a4a';



const GamepadControlPanel: React.FC<GamepadControlPanelProps> = ({
  gameState,
  isConnected,
  onUpdateScore,
  onUpdatePenalty,
  onResetPenalties,
  onUpdateTeam,
  onStartRound,
  onEndRound,
  onTimerControl,
  onResetAll,
  onStartGame,
  onFinishGame,
  timerSeconds = 0,
  isTimerRunning = false,
}) => {
  const [flashes, setFlashes] = useState<Record<string, boolean>>({});
  const [showTeamMenu, setShowTeamMenu] = useState<'team1' | 'team2' | null>(null);
  const [teamNameInputs, setTeamNameInputs] = useState({ team1: '', team2: '' });
  const [teamColorInputs, setTeamColorInputs] = useState({ team1: '#0000FF', team2: '#FF0000' });
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localTimer, setLocalTimer] = useState(timerSeconds);

  useEffect(() => {
    setLocalTimer(timerSeconds);
  }, [timerSeconds]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setLocalTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (gameState) {
      setTeamNameInputs({ team1: gameState.team1.name, team2: gameState.team2.name });
      setTeamColorInputs({ team1: gameState.team1.color, team2: gameState.team2.color });
    }
  }, [gameState?.team1.name, gameState?.team2.name, gameState?.team1.color, gameState?.team2.color]);

  const flashBtn = useCallback((id: string) => {
    setFlashes((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setFlashes((prev) => ({ ...prev, [id]: false })), 150);
  }, []);

  const handleScore = useCallback(
    (teamId: 'team1' | 'team2', action: number, btnId: string) => {
      flashBtn(btnId);
      onUpdateScore({ teamId, action });
    },
    [onUpdateScore, flashBtn]
  );

  const handlePenalty = useCallback(
    (teamId: 'team1' | 'team2', type: 'major' | 'minor', btnId: string) => {
      flashBtn(btnId);
      onUpdatePenalty({ teamId, type, action: 1 });
    },
    [onUpdatePenalty, flashBtn]
  );

  const handleTimer = useCallback(
    (action: 'start' | 'pause' | 'reset' | 'add' | 'sub', btnId: string, value?: number) => {
      flashBtn(btnId);
      onTimerControl(action, value);
      if (action === 'reset') setLocalTimer(0);
      if (action === 'add') setLocalTimer((prev) => prev + (value || 60));
      if (action === 'sub') setLocalTimer((prev) => Math.max(0, prev - (value || 60)));
    },
    [onTimerControl, flashBtn]
  );

  const handleRoundEnd = useCallback(() => {
    flashBtn('endRound');
    onEndRound({
      points: { team1: 0, team2: 0 },
      penalties: {
        team1: { major: 0, minor: 0 },
        team2: { major: 0, minor: 0 },
      },
      notes: '',
    });
  }, [onEndRound, flashBtn]);

  const handleRoundStart = useCallback(() => {
    flashBtn('startRound');
    const config: RoundConfig = {
      number: (gameState?.rounds?.history?.length || 0) + 1,
      isMixed: false,
      theme: '',
      type: RoundType.SHORTFORM,
      minPlayers: 2,
      maxPlayers: 8,
      timeLimit: null,
    };
    onStartRound(config);
  }, [onStartRound, gameState, flashBtn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isBetweenRounds = gameState?.rounds?.isBetweenRounds !== false;
  const gameStatus = (gameState as any)?.rounds?.gameStatus ?? 'notStarted';
  const isLive = gameStatus === 'live';

  const btnStyle = (color: string, size: number = 56, isFlashing: boolean = false): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: color,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: size > 40 ? 18 : 14,
    cursor: isConnected ? 'pointer' : 'not-allowed',
    opacity: isConnected ? 1 : 0.5,
    boxShadow: isFlashing
      ? `0 0 20px ${color}, inset 0 -4px 8px rgba(0,0,0,0.3)`
      : `0 4px 0 ${darken(color, 30)}, inset 0 -4px 8px rgba(0,0,0,0.2)`,
    transform: isFlashing ? 'scale(0.92)' : 'scale(1)',
    transition: 'all 0.05s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  const shoulderStyle = (isFlashing: boolean): React.CSSProperties => ({
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: 'none',
    backgroundColor: SHOULDER_COLOR,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    cursor: isConnected ? 'pointer' : 'not-allowed',
    opacity: isConnected ? 1 : 0.5,
    boxShadow: isFlashing
      ? `0 0 15px ${SHOULDER_COLOR}`
      : `0 3px 0 ${darken(SHOULDER_COLOR, 30)}`,
    transform: isFlashing ? 'translateY(2px)' : 'translateY(0)',
    transition: 'all 0.05s ease',
  });

  const triggerStyle = (isFlashing: boolean): React.CSSProperties => ({
    width: 80,
    height: 44,
    borderRadius: '22px 22px 8px 8px',
    border: 'none',
    backgroundColor: TRIGGER_COLOR,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    cursor: isConnected ? 'pointer' : 'not-allowed',
    opacity: isConnected ? 1 : 0.5,
    boxShadow: isFlashing
      ? `0 0 15px ${TRIGGER_COLOR}`
      : `0 4px 0 ${darken(TRIGGER_COLOR, 30)}`,
    transform: isFlashing ? 'translateY(2px)' : 'translateY(0)',
    transition: 'all 0.05s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  });

  const dpadBtnStyle = (isFlashing: boolean): React.CSSProperties => ({
    width: 44,
    height: 44,
    border: 'none',
    backgroundColor: DPAD_COLOR,
    color: '#fff',
    fontSize: 18,
    cursor: isConnected ? 'pointer' : 'not-allowed',
    opacity: isConnected ? 1 : 0.5,
    boxShadow: isFlashing
      ? '0 0 10px rgba(255,255,255,0.5)'
      : '0 3px 0 #1a1a1a, inset 0 2px 4px rgba(255,255,255,0.1)',
    transform: isFlashing ? 'scale(0.92)' : 'scale(1)',
    transition: 'all 0.05s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const menuBtnStyle = (isFlashing: boolean): React.CSSProperties => ({
    width: 64,
    height: 28,
    borderRadius: 14,
    border: 'none',
    backgroundColor: MENU_BTN,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    cursor: isConnected ? 'pointer' : 'not-allowed',
    opacity: isConnected ? 1 : 0.5,
    boxShadow: isFlashing
      ? '0 0 8px rgba(255,255,255,0.4)'
      : '0 2px 0 #2a2a2a',
    transform: isFlashing ? 'translateY(1px)' : 'translateY(0)',
    transition: 'all 0.05s ease',
  });

  const team1 = gameState?.team1;
  const team2 = gameState?.team2;

  return (
    <div
      style={{
        backgroundColor: CONTROLLER_BG,
        borderRadius: 24,
        padding: '20px 16px',
        maxWidth: 720,
        margin: '0 auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.05)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* Shoulder Buttons (Penalties) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <button
          style={shoulderStyle(flashes['pen1-major'])}
          onClick={() => handlePenalty('team1', 'major', 'pen1-major')}
          disabled={!isConnected}
        >
          L1 MAJ
        </button>
        <button
          style={shoulderStyle(flashes['pen1-minor'])}
          onClick={() => handlePenalty('team1', 'minor', 'pen1-minor')}
          disabled={!isConnected}
        >
          L2 MIN
        </button>
        <div style={{ width: 120 }} />
        <button
          style={shoulderStyle(flashes['pen2-major'])}
          onClick={() => handlePenalty('team2', 'major', 'pen2-major')}
          disabled={!isConnected}
        >
          R1 MAJ
        </button>
        <button
          style={shoulderStyle(flashes['pen2-minor'])}
          onClick={() => handlePenalty('team2', 'minor', 'pen2-minor')}
          disabled={!isConnected}
        >
          R2 MIN
        </button>
      </div>

      {/* Main Controller Body */}
      <div
        style={{
          backgroundColor: CONTROLLER_BODY,
          borderRadius: 20,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          position: 'relative',
        }}
      >
        {/* Left Grip */}
        <div
          style={{
            position: 'absolute',
            left: -12,
            top: 20,
            bottom: 20,
            width: 40,
            backgroundColor: GRIP_COLOR,
            borderRadius: '20px 0 0 20px',
            zIndex: 0,
          }}
        />
        {/* Right Grip */}
        <div
          style={{
            position: 'absolute',
            right: -12,
            top: 20,
            bottom: 20,
            width: 40,
            backgroundColor: GRIP_COLOR,
            borderRadius: '0 20px 20px 0',
            zIndex: 0,
          }}
        />

        {/* Left Side: D-Pad + Team 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1, flexShrink: 0 }}>
          {/* D-Pad */}
          <div
            style={{
              width: 136,
              height: 136,
              backgroundColor: DPAD_COLOR,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.05)',
              position: 'relative',
            }}
          >
            <button
              style={{ ...dpadBtnStyle(flashes['t1-up']), borderRadius: '8px 8px 0 0', width: 44, height: 40 }}
              onClick={() => handleScore('team1', 1, 't1-up')}
              disabled={!isConnected}
            >
              +1
            </button>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                style={{ ...dpadBtnStyle(flashes['t1-left']), borderRadius: '8px 0 0 8px', width: 40, height: 44 }}
                onClick={() => {
                  flashBtn('t1-left');
                  setShowTeamMenu('team1');
                }}
                disabled={!isConnected}
              >
                ⚙
              </button>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#666',
                }}
              >
                {team1?.name?.slice(0, 2).toUpperCase() || 'T1'}
              </div>
              <button
                style={{ ...dpadBtnStyle(flashes['t1-right']), borderRadius: '0 8px 8px 0', width: 40, height: 44 }}
                onClick={() => handlePenalty('team1', 'major', 't1-right')}
                disabled={!isConnected}
              >
                🚩
              </button>
            </div>
            <button
              style={{ ...dpadBtnStyle(flashes['t1-down']), borderRadius: '0 0 8px 8px', width: 44, height: 40 }}
              onClick={() => handleScore('team1', -1, 't1-down')}
              disabled={!isConnected}
            >
              -1
            </button>
          </div>

          {/* Team 1 Score Badge */}
          <div
            style={{
              backgroundColor: team1?.color || '#0000FF',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: 80,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.8 }}>{team1?.name || 'Team 1'}</div>
            <div style={{ fontSize: 22 }}>{team1?.score ?? 0}</div>
          </div>
        </div>

        {/* Center: Screen + Menu + Triggers */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 1, minWidth: 0 }}>
          {/* Menu Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              style={menuBtnStyle(flashes['menu-left'])}
              onClick={() => {
                flashBtn('menu-left');
                setMenuOpen((p) => !p);
              }}
              disabled={!isConnected}
            >
              MENU
            </button>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#4ade80' : '#f87171',
                boxShadow: isConnected ? '0 0 8px #4ade80' : 'none',
                transition: 'all 0.3s',
              }}
            />
            <button
              style={menuBtnStyle(flashes['menu-right'])}
              onClick={() => {
                flashBtn('menu-right');
                if (isLive) onFinishGame();
                else onStartGame();
              }}
              disabled={!isConnected}
            >
              {isLive ? 'STOP' : 'START'}
            </button>
          </div>

          {/* Screen */}
          <div
            style={{
              backgroundColor: SCREEN_BG,
              borderRadius: 12,
              padding: 12,
              width: '100%',
              maxWidth: 280,
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.1)',
              border: '2px solid #333',
            }}
          >
            {/* Screen Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold' }}>
                {isLive ? '● LIVE' : '○ STANDBY'}
              </span>
              <span style={{ color: '#888', fontSize: 10 }}>
                R{gameState?.rounds?.history?.length || 0}
              </span>
            </div>

            {/* Timer Display */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 42,
                fontWeight: 'bold',
                color: isTimerRunning ? '#4ade80' : '#fff',
                fontFamily: 'monospace',
                letterSpacing: 2,
                textShadow: isTimerRunning ? '0 0 12px rgba(74,222,128,0.5)' : 'none',
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {formatTime(localTimer)}
            </div>

            {/* Score Preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 10, color: team1?.color || '#60a5fa', fontWeight: 'bold' }}>
                  {team1?.name?.slice(0, 8) || 'Team 1'}
                </div>
                <div style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>{team1?.score ?? 0}</div>
              </div>
              <div style={{ fontSize: 14, color: '#666', padding: '0 8px' }}>VS</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 10, color: team2?.color || '#f87171', fontWeight: 'bold' }}>
                  {team2?.name?.slice(0, 8) || 'Team 2'}
                </div>
                <div style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>{team2?.score ?? 0}</div>
              </div>
            </div>

            {/* Penalty Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flex: 1 }}>
                {Array.from({ length: team1?.penalties?.major || 0 }).map((_, i) => (
                  <div key={`t1-maj-${i}`} style={{ width: 8, height: 8, backgroundColor: '#f87171', borderRadius: 2 }} />
                ))}
                {Array.from({ length: team1?.penalties?.minor || 0 }).map((_, i) => (
                  <div key={`t1-min-${i}`} style={{ width: 8, height: 8, backgroundColor: '#facc15', borderRadius: 2 }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flex: 1 }}>
                {Array.from({ length: team2?.penalties?.major || 0 }).map((_, i) => (
                  <div key={`t2-maj-${i}`} style={{ width: 8, height: 8, backgroundColor: '#f87171', borderRadius: 2 }} />
                ))}
                {Array.from({ length: team2?.penalties?.minor || 0 }).map((_, i) => (
                  <div key={`t2-min-${i}`} style={{ width: 8, height: 8, backgroundColor: '#facc15', borderRadius: 2 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Buttons (Timer Controls) */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={triggerStyle(flashes['lt-start'])}
              onClick={() => handleTimer('start', 'lt-start')}
              disabled={!isConnected || isTimerRunning}
            >
              <span style={{ fontSize: 10 }}>LT</span>
              <span>▶</span>
            </button>
            <button
              style={triggerStyle(flashes['lt-pause'])}
              onClick={() => handleTimer('pause', 'lt-pause')}
              disabled={!isConnected || !isTimerRunning}
            >
              <span style={{ fontSize: 10 }}>LT</span>
              <span>⏸</span>
            </button>
            <button
              style={triggerStyle(flashes['rt-reset'])}
              onClick={() => handleTimer('reset', 'rt-reset')}
              disabled={!isConnected}
            >
              <span style={{ fontSize: 10 }}>RT</span>
              <span>↺</span>
            </button>
            <button
              style={triggerStyle(flashes['rt-add'])}
              onClick={() => handleTimer('add', 'rt-add', 60)}
              disabled={!isConnected}
            >
              <span style={{ fontSize: 10 }}>RT</span>
              <span>+1m</span>
            </button>
          </div>
        </div>

        {/* Right Side: ABXY + Team 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1, flexShrink: 0 }}>
          {/* ABXY Buttons */}
          <div
            style={{
              width: 140,
              height: 140,
              position: 'relative',
            }}
          >
            {/* Y - Top */}
            <button
              style={{
                ...btnStyle(BTN_Y, 52, flashes['btn-y']),
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: flashes['btn-y'] ? 'translateX(-50%) scale(0.92)' : 'translateX(-50%) scale(1)',
              }}
              onClick={() => handleScore('team2', 1, 'btn-y')}
              disabled={!isConnected}
            >
              Y
            </button>
            {/* X - Left */}
            <button
              style={{
                ...btnStyle(BTN_X, 52, flashes['btn-x']),
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: flashes['btn-x'] ? 'translateY(-50%) scale(0.92)' : 'translateY(-50%) scale(1)',
              }}
              onClick={() => handleScore('team1', 1, 'btn-x')}
              disabled={!isConnected}
            >
              X
            </button>
            {/* B - Right */}
            <button
              style={{
                ...btnStyle(BTN_B, 52, flashes['btn-b']),
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: flashes['btn-b'] ? 'translateY(-50%) scale(0.92)' : 'translateY(-50%) scale(1)',
              }}
              onClick={() => handleScore('team2', -1, 'btn-b')}
              disabled={!isConnected}
            >
              B
            </button>
            {/* A - Bottom */}
            <button
              style={{
                ...btnStyle(BTN_A, 52, flashes['btn-a']),
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: flashes['btn-a'] ? 'translateX(-50%) scale(0.92)' : 'translateX(-50%) scale(1)',
              }}
              onClick={() => handleScore('team1', -1, 'btn-a')}
              disabled={!isConnected}
            >
              A
            </button>
          </div>

          {/* Team 2 Score Badge */}
          <div
            style={{
              backgroundColor: team2?.color || '#FF0000',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: 80,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.8 }}>{team2?.name || 'Team 2'}</div>
            <div style={{ fontSize: 22 }}>{team2?.score ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Bottom: Round Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
        {isBetweenRounds && isLive ? (
          <button
            style={{
              padding: '10px 24px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: '#4ade80',
              color: '#000',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: isConnected ? 'pointer' : 'not-allowed',
              opacity: isConnected ? 1 : 0.5,
              boxShadow: flashes['startRound']
                ? '0 0 20px #4ade80'
                : '0 4px 0 #16a34a',
              transform: flashes['startRound'] ? 'translateY(2px)' : 'translateY(0)',
              transition: 'all 0.05s ease',
            }}
            onClick={handleRoundStart}
            disabled={!isConnected}
          >
            ▶ START ROUND
          </button>
        ) : isLive ? (
          <button
            style={{
              padding: '10px 24px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: '#f87171',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: isConnected ? 'pointer' : 'not-allowed',
              opacity: isConnected ? 1 : 0.5,
              boxShadow: flashes['endRound']
                ? '0 0 20px #f87171'
                : '0 4px 0 #dc2626',
              transform: flashes['endRound'] ? 'translateY(2px)' : 'translateY(0)',
              transition: 'all 0.05s ease',
            }}
            onClick={handleRoundEnd}
            disabled={!isConnected}
          >
            ■ END ROUND
          </button>
        ) : (
          <button
            style={{
              padding: '10px 24px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: '#60a5fa',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 14,
              cursor: isConnected ? 'pointer' : 'not-allowed',
              opacity: isConnected ? 1 : 0.5,
              boxShadow: '0 4px 0 #2563eb',
              transition: 'all 0.05s ease',
            }}
            onClick={() => {
              flashBtn('startGame');
              onStartGame();
            }}
            disabled={!isConnected}
          >
            🎮 START GAME
          </button>
        )}

        <button
          style={{
            padding: '10px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: '#666',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 12,
            cursor: isConnected ? 'pointer' : 'not-allowed',
            opacity: isConnected ? 1 : 0.5,
            boxShadow: '0 3px 0 #444',
          }}
          onClick={() => {
            flashBtn('resetAll');
            onResetAll();
          }}
          disabled={!isConnected}
        >
          ↺ RESET
        </button>
      </div>

      {/* Team Config Modal */}
      {showTeamMenu && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#0a0a0a',
            border: '2px solid #333',
            borderRadius: 16,
            padding: 20,
            zIndex: 100,
            minWidth: 260,
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>
            Configure {showTeamMenu === 'team1' ? team1?.name : team2?.name}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 4 }}>Team Name</label>
            <input
              type="text"
              value={teamNameInputs[showTeamMenu]}
              onChange={(e) => setTeamNameInputs((prev) => ({ ...prev, [showTeamMenu]: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #333',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 4 }}>Team Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={teamColorInputs[showTeamMenu]}
                onChange={(e) => setTeamColorInputs((prev) => ({ ...prev, [showTeamMenu]: e.target.value }))}
                style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <span style={{ color: '#888', fontSize: 12 }}>{teamColorInputs[showTeamMenu]}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#4ade80',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => {
                onUpdateTeam({
                  teamId: showTeamMenu,
                  updates: { name: teamNameInputs[showTeamMenu], color: teamColorInputs[showTeamMenu] },
                });
                setShowTeamMenu(null);
              }}
            >
              SAVE
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#333',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => setShowTeamMenu(null)}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Menu Overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(10,10,10,0.95)',
            border: '2px solid #333',
            borderRadius: 16,
            padding: 20,
            zIndex: 100,
            minWidth: 280,
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 16, fontSize: 16, textAlign: 'center' }}>
            SYSTEM MENU
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#1a1a2e',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => {
                setShowTeamMenu('team1');
                setMenuOpen(false);
              }}
            >
              ⚙ Configure {team1?.name || 'Team 1'}
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#1a1a2e',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => {
                setShowTeamMenu('team2');
                setMenuOpen(false);
              }}
            >
              ⚙ Configure {team2?.name || 'Team 2'}
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#1a1a2e',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => {
                onResetPenalties({ teamId: 'team1' });
                onResetPenalties({ teamId: 'team2' });
                setMenuOpen(false);
              }}
            >
              🚫 Clear All Penalties
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => {
                onResetAll();
                setMenuOpen(false);
              }}
            >
              ⚠ Reset Everything
            </button>
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#333',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: 8,
              }}
              onClick={() => setMenuOpen(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Overlay backdrop for modals */}
      {(showTeamMenu || menuOpen) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => {
            setShowTeamMenu(null);
            setMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Helper to darken a hex color by a percentage
function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default GamepadControlPanel;
