import React, { useState, useEffect, useCallback, useRef } from "react";

interface Team {
  id: string;
  name: string;
  score: number;
  color?: string;
  logoUrl?: string;
  penalties?: number;
}

interface GameState {
  team1: Team;
  team2: Team;
  currentRound: number;
  totalRounds: number;
  timer: number;
  timerRunning: boolean;
  isLive: boolean;
}

interface DarkControlPanelProps {
  gameState: GameState;
  onUpdateScore: (teamId: string, delta: number) => void;
  onStartRound: () => void;
  onEndRound: () => void;
  onNextRound: () => void;
  onPrevRound: () => void;
  onTimerControl: (action: "start" | "pause" | "reset", seconds?: number) => void;
  onAssignPenalty: (teamId: string, penaltyType: string) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
}

const DarkControlPanel: React.FC<DarkControlPanelProps> = ({
  gameState,
  onUpdateScore,
  onStartRound,
  onEndRound,
  onNextRound,
  onPrevRound,
  onTimerControl,
  onAssignPenalty,
  onUpdateTeam,
}) => {
  const [timerInput, setTimerInput] = useState("180");
  const [selectedPenalty, setSelectedPenalty] = useState("Foul");
  const [lastAction, setLastAction] = useState<string>("");
  const actionTimeout = useRef<ReturnType<typeof setTimeout>>();

  const showAction = useCallback((text: string) => {
    setLastAction(text);
    if (actionTimeout.current) clearTimeout(actionTimeout.current);
    actionTimeout.current = setTimeout(() => setLastAction(""), 2000);
  }, []);

  const handleScore = useCallback(
    (teamId: string, delta: number) => {
      onUpdateScore(teamId, delta);
      showAction(`${teamId === gameState.team1.id ? gameState.team1.name : gameState.team2.name} ${delta > 0 ? "+" : ""}${delta}`);
    },
    [onUpdateScore, gameState, showAction]
  );

  const handleTimer = useCallback(
    (action: "start" | "pause" | "reset") => {
      if (action === "reset") {
        const seconds = parseInt(timerInput, 10) || 180;
        onTimerControl(action, seconds);
        showAction(`Timer reset to ${formatTime(seconds)}`);
      } else {
        onTimerControl(action);
        showAction(`Timer ${action}ed`);
      }
    },
    [onTimerControl, timerInput, showAction]
  );

  const handlePenalty = useCallback(
    (teamId: string) => {
      onAssignPenalty(teamId, selectedPenalty);
      showAction(`Penalty: ${selectedPenalty} → ${teamId === gameState.team1.id ? gameState.team1.name : gameState.team2.name}`);
    },
    [onAssignPenalty, selectedPenalty, gameState, showAction]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "1":
          handleScore(gameState.team1.id, 1);
          break;
        case "2":
          handleScore(gameState.team2.id, 1);
          break;
        case "q":
          handleScore(gameState.team1.id, -1);
          break;
        case "w":
          handleScore(gameState.team2.id, -1);
          break;
        case "a":
          handleScore(gameState.team1.id, 5);
          break;
        case "s":
          handleScore(gameState.team2.id, 5);
          break;
        case " ":
          e.preventDefault();
          handleTimer(gameState.timerRunning ? "pause" : "start");
          break;
        case "r":
          handleTimer("reset");
          break;
        case "ArrowRight":
          onNextRound();
          showAction("Next round");
          break;
        case "ArrowLeft":
          onPrevRound();
          showAction("Previous round");
          break;
        case "Enter":
          onStartRound();
          showAction("Round started");
          break;
        case "Escape":
          onEndRound();
          showAction("Round ended");
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleScore, handleTimer, onNextRound, onPrevRound, onStartRound, onEndRound, gameState, showAction]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const scoreButton = (label: string, onClick: () => void, variant: "primary" | "danger" | "neutral" = "neutral") => ({
    onClick,
    style: {
      padding: "8px 14px",
      borderRadius: "6px",
      border: "none",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      backgroundColor: variant === "primary" ? "#0e639c" : variant === "danger" ? "#c75450" : "#3c3c3c",
      color: "#fff",
      transition: "all 0.1s",
      minWidth: "44px",
    },
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      (e.target as HTMLButtonElement).style.filter = "brightness(1.15)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      (e.target as HTMLButtonElement).style.filter = "brightness(1)";
    },
    children: label,
  });

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "#252526",
    borderRadius: "8px",
    padding: "14px",
    border: "1px solid #3e3e42",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#9cdcfe",
    marginBottom: "10px",
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#3c3c3c",
    border: "1px solid #3e3e42",
    color: "#cccccc",
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  };

  const TeamSection = ({ team, isTeam1 }: { team: Team; isTeam1: boolean }) => (
    <div style={sectionStyle}>
      <div style={{ ...labelStyle, color: team.color || "#9cdcfe" }}>
        {isTeam1 ? "Team 1" : "Team 2"} — {team.name}
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
        <button {...scoreButton("+1", () => handleScore(team.id, 1), "primary")} />
        <button {...scoreButton("-1", () => handleScore(team.id, -1), "danger")} />
        <button {...scoreButton("+5", () => handleScore(team.id, 5), "primary")} />
        <button {...scoreButton("Reset", () => handleScore(team.id, -team.score), "danger")} />
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
        <input
          type="text"
          value={team.name}
          onChange={(e) => onUpdateTeam(team.id, { name: e.target.value })}
          placeholder="Team name"
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="color"
          value={team.color || "#4ec9b0"}
          onChange={(e) => onUpdateTeam(team.id, { color: e.target.value })}
          style={{ width: "36px", height: "32px", border: "none", borderRadius: "4px", cursor: "pointer", padding: "2px" }}
        />
      </div>
      <input
        type="text"
        value={team.logoUrl || ""}
        onChange={(e) => onUpdateTeam(team.id, { logoUrl: e.target.value })}
        placeholder="Logo URL"
        style={inputStyle}
      />
      {team.penalties ? (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#c75450" }}>
          Penalties: {team.penalties}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: "#1e1e1e",
        color: "#cccccc",
        padding: "16px",
        borderRadius: "8px",
        minWidth: "720px",
        maxWidth: "1200px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 280px",
        gap: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Team 1 */}
      <TeamSection team={gameState.team1} isTeam1 />

      {/* Team 2 */}
      <TeamSection team={gameState.team2} isTeam1={false} />

      {/* Preview */}
      <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={labelStyle}>Live Preview</div>
        <div
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "6px",
            padding: "16px",
            border: "1px solid #3e3e42",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", color: gameState.isLive ? "#c75450" : "#858585", marginBottom: "8px", fontWeight: 600 }}>
            {gameState.isLive ? "● LIVE" : "○ STANDBY"}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "11px", color: gameState.team1.color || "#4ec9b0", marginBottom: "4px" }}>
                {gameState.team1.name}
              </div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff" }}>{gameState.team1.score}</div>
            </div>
            <div style={{ fontSize: "14px", color: "#858585", padding: "0 12px" }}>VS</div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "11px", color: gameState.team2.color || "#ce9178", marginBottom: "4px" }}>
                {gameState.team2.name}
              </div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff" }}>{gameState.team2.score}</div>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: gameState.timerRunning ? "#4ec9b0" : "#dcdcaa", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(gameState.timer)}
          </div>
          <div style={{ fontSize: "11px", color: "#858585", marginTop: "6px" }}>
            Round {gameState.currentRound} / {gameState.totalRounds}
          </div>
        </div>

        {/* Round Controls */}
        <div>
          <div style={labelStyle}>Round</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button {...scoreButton("Start", onStartRound, "primary")} />
            <button {...scoreButton("End", onEndRound, "danger")} />
            <button {...scoreButton("Prev", onPrevRound, "neutral")} />
            <button {...scoreButton("Next", onNextRound, "neutral")} />
          </div>
        </div>

        {/* Timer Controls */}
        <div>
          <div style={labelStyle}>Timer</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <button {...scoreButton(gameState.timerRunning ? "Pause" : "Start", () => handleTimer(gameState.timerRunning ? "pause" : "start"), gameState.timerRunning ? "danger" : "primary")} />
            <button {...scoreButton("Reset", () => handleTimer("reset"), "neutral")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              value={timerInput}
              onChange={(e) => setTimerInput(e.target.value)}
              placeholder="Seconds"
              style={{ ...inputStyle, width: "80px" }}
            />
            <span style={{ fontSize: "12px", color: "#858585" }}>seconds</span>
          </div>
        </div>
      </div>

      {/* Penalties */}
      <div style={{ ...sectionStyle, gridColumn: "1 / -1", display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Penalty</div>
        <select
          value={selectedPenalty}
          onChange={(e) => setSelectedPenalty(e.target.value)}
          style={{ ...inputStyle, width: "140px" }}
        >
          <option>Foul</option>
          <option>Timeout</option>
          <option>Interruption</option>
          <option>Repeat</option>
          <option>Custom</option>
        </select>
        <button
          {...scoreButton(
            `→ ${gameState.team1.name}`,
            () => handlePenalty(gameState.team1.id),
            "danger"
          )}
        />
        <button
          {...scoreButton(
            `→ ${gameState.team2.name}`,
            () => handlePenalty(gameState.team2.id),
            "danger"
          )}
        />
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#858585" }}>
          {lastAction && <span style={{ color: "#dcdcaa" }}>{lastAction}</span>}
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ ...sectionStyle, gridColumn: "1 / -1" }}>
        <div style={labelStyle}>Keyboard Shortcuts</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "4px 16px", fontSize: "12px", color: "#858585" }}>
          <div><kbd style={kbdStyle}>1</kbd> {gameState.team1.name} +1</div>
          <div><kbd style={kbdStyle}>2</kbd> {gameState.team2.name} +1</div>
          <div><kbd style={kbdStyle}>Q</kbd> {gameState.team1.name} -1</div>
          <div><kbd style={kbdStyle}>W</kbd> {gameState.team2.name} -1</div>
          <div><kbd style={kbdStyle}>A</kbd> {gameState.team1.name} +5</div>
          <div><kbd style={kbdStyle}>S</kbd> {gameState.team2.name} +5</div>
          <div><kbd style={kbdStyle}>Space</kbd> Start/Pause timer</div>
          <div><kbd style={kbdStyle}>R</kbd> Reset timer</div>
          <div><kbd style={kbdStyle}>Enter</kbd> Start round</div>
          <div><kbd style={kbdStyle}>Esc</kbd> End round</div>
          <div><kbd style={kbdStyle}>←</kbd> Previous round</div>
          <div><kbd style={kbdStyle}>→</kbd> Next round</div>
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  backgroundColor: "#3c3c3c",
  border: "1px solid #555",
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: "monospace",
  color: "#dcdcaa",
  minWidth: "22px",
  textAlign: "center",
  marginRight: "6px",
};

export default DarkControlPanel;
