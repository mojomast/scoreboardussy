import React, { useEffect, useState } from "react";

interface Team {
  name: string;
  score: number;
  color?: string;
}

interface RetroScoreboardProps {
  team1: Team;
  team2: Team;
  currentRound: number;
  timer: number;
  isLive: boolean;
}

const RetroScoreboard: React.FC<RetroScoreboardProps> = ({
  team1,
  team2,
  currentRound,
  timer,
  isLive,
}) => {
  const [blink, setBlink] = useState(true);
  const [coinBlink, setCoinBlink] = useState(true);
  const [soundFlash, setSoundFlash] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((b) => !b), 800);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const coinInterval = setInterval(() => setCoinBlink((b) => !b), 1200);
    return () => clearInterval(coinInterval);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const flashInterval = setInterval(() => {
      setSoundFlash(true);
      setTimeout(() => setSoundFlash(false), 150);
    }, 3000);
    return () => clearInterval(flashInterval);
  }, [isLive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const pixelBorder = {
    boxShadow:
      "inset 0 0 0 4px #1a1a1a, inset 0 0 0 8px #444, 0 0 0 4px #000, 0 0 0 8px #333, 0 0 20px rgba(0,0,0,0.8)",
  };

  return (
    <div
      style={{
        fontFamily:
          '"Press Start 2P", "Courier New", Courier, monospace',
        backgroundColor: "#0d0d0d",
        color: "#33ff33",
        padding: "24px",
        borderRadius: "4px",
        position: "relative",
        overflow: "hidden",
        minWidth: "600px",
        ...pixelBorder,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#ffcc00",
            marginBottom: "16px",
            textShadow: "2px 2px 0px #b38f00",
            letterSpacing: "2px",
          }}
        >
          {isLive ? (
            <span style={{ color: "#ff3333" }}>LIVE</span>
          ) : (
            "STANDBY"
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            gap: "32px",
          }}
        >
          <TeamDisplay team={team1} align="left" blink={blink} />
          <div
            style={{
              textAlign: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                color: "#ffcc00",
                textShadow: "3px 3px 0px #b38f00",
                marginBottom: "8px",
              }}
            >
              VS
            </div>
            <div style={{ color: "#888" }}>ROUND {currentRound}</div>
          </div>
          <TeamDisplay team={team2} align="right" blink={blink} />
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "32px",
            color: "#33ff33",
            textShadow: "3px 3px 0px #1a801a",
            marginBottom: "16px",
            letterSpacing: "4px",
          }}
        >
          {formatTime(timer)}
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: coinBlink ? "#ffcc00" : "#665200",
            textShadow: coinBlink ? "1px 1px 0px #b38f00" : "none",
            marginTop: "16px",
            transition: "color 0.2s",
          }}
        >
          INSERT COIN TO CONTINUE
        </div>

        {soundFlash && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "10px",
              color: "#ff00ff",
              textShadow: "1px 1px 0px #800080",
              pointerEvents: "none",
              animation: "retroPop 0.15s ease-out",
            }}
          >
            *BEEP*
          </div>
        )}
      </div>

      <style>{`
        @keyframes retroPop {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
};

interface TeamDisplayProps {
  team: Team;
  align: "left" | "right";
  blink: boolean;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ team, align, blink }) => {
  const isLeading =
    team.score >= 0;

  return (
    <div
      style={{
        flex: 1,
        textAlign: align,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: team.color || "#33ff33",
          textShadow: `2px 2px 0px ${team.color ? team.color + "80" : "#1a801a"}`,
          marginBottom: "8px",
          wordBreak: "break-word",
        }}
      >
        {team.name.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: "48px",
          color: "#fff",
          textShadow: "4px 4px 0px #666",
          lineHeight: 1,
          imageRendering: "pixelated",
        }}
      >
        {team.score}
      </div>
      {isLeading && blink && (
        <div
          style={{
            fontSize: "10px",
            color: "#ffcc00",
            marginTop: "4px",
            textShadow: "1px 1px 0px #b38f00",
          }}
        >
          ★ HIGH SCORE
        </div>
      )}
    </div>
  );
};

export default RetroScoreboard;
