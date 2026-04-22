import React, { useEffect, useRef, useState } from "react";

interface Team {
  name: string;
  score: number;
  color: string;
  penalties?: number;
}

interface CyberpunkScoreboardProps {
  team1: Team;
  team2: Team;
  currentRound: number;
  timer: number;
  isLive: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const CyberpunkScoreboard: React.FC<CyberpunkScoreboardProps> = ({
  team1,
  team2,
  currentRound,
  timer,
  isLive,
}) => {
  const [prevScore1, setPrevScore1] = useState(team1.score);
  const [prevScore2, setPrevScore2] = useState(team2.score);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePulse1, setScorePulse1] = useState(false);
  const [scorePulse2, setScorePulse2] = useState(false);
  const particleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  const isLowTime = timer <= 10 && timer > 0;
  const isTimeUp = timer === 0;

  const createParticles = (x: number, y: number, color: string, count = 30) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (team1.score !== prevScore1) {
      setScorePulse1(true);
      setTimeout(() => setScorePulse1(false), 600);
      const el = document.getElementById("score1-display");
      if (el) {
        const rect = el.getBoundingClientRect();
        createParticles(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          team1.color,
          40
        );
      }
      setPrevScore1(team1.score);
    }
  }, [team1.score, prevScore1, team1.color]);

  useEffect(() => {
    if (team2.score !== prevScore2) {
      setScorePulse2(true);
      setTimeout(() => setScorePulse2(false), 600);
      const el = document.getElementById("score2-display");
      if (el) {
        const rect = el.getBoundingClientRect();
        createParticles(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          team2.color,
          40
        );
      }
      setPrevScore2(team2.score);
    }
  }, [team2.score, prevScore2, team2.color]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: "100%",
      height: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0f0a1a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Orbitron', 'Courier New', monospace",
    },
    gridOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: "50px 50px",
      pointerEvents: "none",
    },
    scanlines: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)",
      pointerEvents: "none",
      zIndex: 10,
    },
    liveIndicator: {
      position: "absolute",
      top: "20px",
      right: "30px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      zIndex: 20,
    },
    liveDot: {
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      backgroundColor: "#ff0040",
      boxShadow: "0 0 10px #ff0040, 0 0 20px #ff0040, 0 0 30px #ff0040",
      animation: "pulse 1.5s ease-in-out infinite",
    },
    liveText: {
      color: "#ff0040",
      fontSize: "clamp(14px, 2vw, 20px)",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "4px",
      textShadow: "0 0 10px rgba(255, 0, 64, 0.8)",
    },
    roundDisplay: {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      textAlign: "center",
    },
    roundLabel: {
      color: "#00ffff",
      fontSize: "clamp(12px, 1.5vw, 18px)",
      textTransform: "uppercase",
      letterSpacing: "6px",
      marginBottom: "5px",
      textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
    },
    roundNumber: {
      color: "#ffffff",
      fontSize: "clamp(24px, 4vw, 48px)",
      fontWeight: "bold",
      textShadow: "0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.4)",
    },
    mainContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "90%",
      maxWidth: "1400px",
      gap: "clamp(20px, 5vw, 60px)",
      zIndex: 5,
    },
    teamSection: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    },
    teamName: {
      fontSize: "clamp(20px, 4vw, 48px)",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "4px",
      textAlign: "center",
    },
    scoreContainer: {
      position: "relative",
      padding: "clamp(20px, 4vw, 50px)",
      borderRadius: "20px",
      background: "rgba(0, 0, 0, 0.4)",
      border: "2px solid rgba(255, 255, 255, 0.1)",
    },
    score: {
      fontSize: "clamp(80px, 15vw, 200px)",
      fontWeight: "bold",
      lineHeight: 1,
      transition: "transform 0.3s ease",
    },
    vsContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
    },
    vsText: {
      fontSize: "clamp(30px, 5vw, 60px)",
      fontWeight: "bold",
      color: "#ff00ff",
      textShadow: "0 0 20px rgba(255, 0, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.5)",
      letterSpacing: "8px",
    },
    timerContainer: {
      position: "absolute",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      textAlign: "center",
    },
    timer: {
      fontSize: "clamp(40px, 8vw, 100px)",
      fontWeight: "bold",
      fontFamily: "'Courier New', monospace",
      letterSpacing: "8px",
      transition: "all 0.3s ease",
    },
    penaltyContainer: {
      display: "flex",
      gap: "8px",
      marginTop: "10px",
    },
    penaltyDot: {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      boxShadow: "0 0 10px currentColor",
    },
    particle: {
      position: "fixed",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: 100,
    },
    glitchOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "linear-gradient(90deg, transparent 0%, rgba(255, 0, 255, 0.03) 50%, transparent 100%)",
      animation: "glitch 3s infinite",
      pointerEvents: "none",
    },
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes glitch {
          0%, 90%, 100% { transform: translateX(0); }
          91% { transform: translateX(-5px); }
          92% { transform: translateX(5px); }
          93% { transform: translateX(-3px); }
          94% { transform: translateX(0); }
        }
        @keyframes scorePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes timerUrgent {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div style={styles.gridOverlay} />
      <div style={styles.scanlines} />
      <div style={styles.glitchOverlay} />

      {isLive && (
        <div style={styles.liveIndicator}>
          <div style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
      )}

      <div style={styles.roundDisplay}>
        <div style={styles.roundLabel}>ROUND</div>
        <div style={styles.roundNumber}>{currentRound}</div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.teamSection}>
          <div
            style={{
              ...styles.teamName,
              color: team1.color,
              textShadow: `0 0 20px ${hexToRgba(team1.color, 0.8)}, 0 0 40px ${hexToRgba(team1.color, 0.4)}, 0 0 60px ${hexToRgba(team1.color, 0.2)}`,
            }}
          >
            {team1.name}
          </div>
          <div
            style={{
              ...styles.scoreContainer,
              borderColor: hexToRgba(team1.color, 0.3),
              boxShadow: `0 0 30px ${hexToRgba(team1.color, 0.1)}, inset 0 0 30px ${hexToRgba(team1.color, 0.05)}`,
            }}
          >
            <div
              id="score1-display"
              style={{
                ...styles.score,
                color: team1.color,
                textShadow: `0 0 30px ${hexToRgba(team1.color, 0.9)}, 0 0 60px ${hexToRgba(team1.color, 0.6)}, 0 0 90px ${hexToRgba(team1.color, 0.3)}`,
                animation: scorePulse1 ? "scorePulse 0.6s ease" : "none",
              }}
            >
              {team1.score}
            </div>
          </div>
          <div style={styles.penaltyContainer}>
            {Array.from({ length: team1.penalties || 0 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.penaltyDot,
                  backgroundColor: team1.color,
                  color: team1.color,
                  boxShadow: `0 0 15px ${team1.color}, 0 0 30px ${hexToRgba(team1.color, 0.5)}`,
                }}
              />
            ))}
          </div>
        </div>

        <div style={styles.vsContainer}>
          <div style={styles.vsText}>VS</div>
        </div>

        <div style={styles.teamSection}>
          <div
            style={{
              ...styles.teamName,
              color: team2.color,
              textShadow: `0 0 20px ${hexToRgba(team2.color, 0.8)}, 0 0 40px ${hexToRgba(team2.color, 0.4)}, 0 0 60px ${hexToRgba(team2.color, 0.2)}`,
            }}
          >
            {team2.name}
          </div>
          <div
            style={{
              ...styles.scoreContainer,
              borderColor: hexToRgba(team2.color, 0.3),
              boxShadow: `0 0 30px ${hexToRgba(team2.color, 0.1)}, inset 0 0 30px ${hexToRgba(team2.color, 0.05)}`,
            }}
          >
            <div
              id="score2-display"
              style={{
                ...styles.score,
                color: team2.color,
                textShadow: `0 0 30px ${hexToRgba(team2.color, 0.9)}, 0 0 60px ${hexToRgba(team2.color, 0.6)}, 0 0 90px ${hexToRgba(team2.color, 0.3)}`,
                animation: scorePulse2 ? "scorePulse 0.6s ease" : "none",
              }}
            >
              {team2.score}
            </div>
          </div>
          <div style={styles.penaltyContainer}>
            {Array.from({ length: team2.penalties || 0 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.penaltyDot,
                  backgroundColor: team2.color,
                  color: team2.color,
                  boxShadow: `0 0 15px ${team2.color}, 0 0 30px ${hexToRgba(team2.color, 0.5)}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={styles.timerContainer}>
        <div
          style={{
            ...styles.timer,
            color: isTimeUp
              ? "#ff0040"
              : isLowTime
              ? "#ffaa00"
              : "#00ffff",
            textShadow: isTimeUp
              ? "0 0 30px rgba(255, 0, 64, 0.9), 0 0 60px rgba(255, 0, 64, 0.6)"
              : isLowTime
              ? "0 0 30px rgba(255, 170, 0, 0.9), 0 0 60px rgba(255, 170, 0, 0.6)"
              : "0 0 30px rgba(0, 255, 255, 0.9), 0 0 60px rgba(0, 255, 255, 0.6)",
            animation: isLowTime && !isTimeUp ? "timerUrgent 0.5s ease-in-out infinite" : "none",
          }}
        >
          {timeString}
        </div>
      </div>

      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            ...styles.particle,
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            opacity: particle.life,
          }}
        />
      ))}
    </div>
  );
};

export default CyberpunkScoreboard;
