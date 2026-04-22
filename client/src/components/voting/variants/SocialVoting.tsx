import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

interface Team {
  id: string;
  name: string;
  color: string;
}

interface Votes {
  team1: number;
  team2: number;
}

interface SocialVotingProps {
  team1: Team;
  team2: Team;
  votes: Votes;
  isActive: boolean;
  onVote: (teamId: "team1" | "team2") => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  color: string;
  scale: number;
  rotation: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  life: number;
}

const SocialVoting: React.FC<SocialVotingProps> = ({
  team1,
  team2,
  votes,
  isActive,
  onVote,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [lastVotedTeam, setLastVotedTeam] = useState<"team1" | "team2" | null>(null);
  const [showResults, setShowResults] = useState(false);
  const heartIdRef = useRef(0);
  const confettiIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalVotes = votes.team1 + votes.team2;
  const team1Percent = totalVotes > 0 ? (votes.team1 / totalVotes) * 100 : 50;
  const team2Percent = totalVotes > 0 ? (votes.team2 / totalVotes) * 100 : 50;
  const team1Leading = votes.team1 > votes.team2;
  const team2Leading = votes.team2 > votes.team1;
  const isTied = votes.team1 === votes.team2 && totalVotes > 0;

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/api/voting/page`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#00000000",
          },
        });
        setQrDataUrl(dataUrl);
      } catch {
        // QR generation failed silently
      }
    };
    generateQR();
  }, []);

  const spawnHeart = useCallback((x: number, y: number, color: string) => {
    const id = heartIdRef.current++;
    const heart: FloatingHeart = {
      id,
      x,
      y,
      color,
      scale: 0.5 + Math.random() * 0.5,
      rotation: (Math.random() - 0.5) * 60,
    };
    setHearts((prev) => [...prev, heart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  }, []);

  const spawnConfetti = useCallback((color: string) => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      pieces.push({
        id: confettiIdRef.current++,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 50,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 15,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        size: 6 + Math.random() * 10,
        life: 1,
      });
    }
    setConfetti((prev) => [...prev, ...pieces]);
  }, []);

  useEffect(() => {
    if (confetti.length === 0) return;
    let animationId: number;
    const animate = () => {
      setConfetti((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.5,
            y: p.y + p.vy * 0.5,
            vy: p.vy + 0.4,
            vx: p.vx * 0.98,
            rotation: p.rotation + p.rotationSpeed,
            life: p.life - 0.015,
          }))
          .filter((p) => p.life > 0)
      );
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [confetti.length]);

  const handleVote = useCallback(
    (teamId: "team1" | "team2", e: React.MouseEvent | React.TouchEvent) => {
      if (!isActive) return;

      const clientX =
        "touches" in e
          ? e.touches[0].clientX
          : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e
          ? e.touches[0].clientY
          : (e as React.MouseEvent).clientY;

      const color = teamId === "team1" ? team1.color : team2.color;
      spawnHeart(clientX, clientY, color);
      setLastVotedTeam(teamId);
      onVote(teamId);

      setTimeout(() => setLastVotedTeam(null), 800);
    },
    [isActive, team1.color, team2.color, onVote, spawnHeart]
  );

  useEffect(() => {
    if (!isActive && totalVotes > 0 && !showResults) {
      setShowResults(true);
      const winnerColor = team1Leading
        ? team1.color
        : team2Leading
        ? team2.color
        : "#ffffff";
      if (!isTied) {
        setTimeout(() => spawnConfetti(winnerColor), 300);
      }
    }
    if (isActive) {
      setShowResults(false);
    }
  }, [isActive, totalVotes, showResults, team1Leading, team2Leading, isTied, team1.color, team2.color, spawnConfetti]);

  const hexToRgba = useMemo(
    () => (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    []
  );

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: "100%",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      background: "#000000",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 16px",
      background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
    },
    liveBadge: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 14px",
      borderRadius: "20px",
      background: "rgba(255, 0, 64, 0.2)",
      border: "1px solid rgba(255, 0, 64, 0.4)",
    },
    liveDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: "#ff0040",
      boxShadow: "0 0 8px #ff0040",
    },
    liveText: {
      color: "#ff0040",
      fontSize: "13px",
      fontWeight: 700,
      letterSpacing: "2px",
    },
    voteArea: {
      flex: 1,
      display: "flex",
      flexDirection: "row",
      position: "relative",
    },
    teamSide: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      cursor: isActive ? "pointer" : "default",
      transition: "transform 0.15s ease",
    },
    teamName: {
      fontSize: "clamp(24px, 8vw, 56px)",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "2px",
      textAlign: "center",
      lineHeight: 1.1,
      marginBottom: "12px",
      padding: "0 16px",
      wordBreak: "break-word",
    },
    voteCount: {
      fontSize: "clamp(48px, 15vw, 120px)",
      fontWeight: 900,
      lineHeight: 1,
      transition: "all 0.3s ease",
    },
    percentLabel: {
      fontSize: "clamp(16px, 5vw, 32px)",
      fontWeight: 700,
      marginTop: "8px",
      opacity: 0.9,
    },
    tapHint: {
      position: "absolute",
      bottom: "20%",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "3px",
      textTransform: "uppercase",
      opacity: 0.5,
      animation: "fadePulse 2s ease-in-out infinite",
    },
    progressBarContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "8px",
      display: "flex",
      background: "rgba(255,255,255,0.1)",
    },
    progressBar: {
      height: "100%",
      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    centerDivider: {
      position: "absolute",
      left: "50%",
      top: "15%",
      bottom: "15%",
      width: "2px",
      transform: "translateX(-50%)",
      background:
        "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)",
      zIndex: 10,
    },
    vsBadge: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 20,
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.8)",
      border: "2px solid rgba(255,255,255,0.2)",
      fontSize: "18px",
      fontWeight: 900,
      color: "#ffffff",
      letterSpacing: "1px",
    },
    qrContainer: {
      position: "absolute",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    },
    qrCode: {
      width: "100px",
      height: "100px",
      borderRadius: "12px",
      padding: "8px",
      background: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(10px)",
    },
    qrLabel: {
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "2px",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.6)",
    },
    heart: {
      position: "fixed",
      pointerEvents: "none",
      zIndex: 1000,
      animation: "heartFloat 1.2s ease-out forwards",
    },
    confettiPiece: {
      position: "fixed",
      pointerEvents: "none",
      zIndex: 999,
    },
    resultsOverlay: {
      position: "absolute",
      inset: 0,
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(20px)",
      animation: "fadeIn 0.5s ease",
    },
    winnerText: {
      fontSize: "clamp(32px, 10vw, 72px)",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "4px",
      textAlign: "center",
      marginBottom: "16px",
    },
    resultsStats: {
      fontSize: "clamp(18px, 5vw, 36px)",
      fontWeight: 700,
      textAlign: "center",
      opacity: 0.9,
    },
    inactiveOverlay: {
      position: "absolute",
      inset: 0,
      zIndex: 150,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
    },
    inactiveText: {
      fontSize: "clamp(20px, 6vw, 40px)",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "4px",
      color: "rgba(255,255,255,0.5)",
      textAlign: "center",
      padding: "0 24px",
    },
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <style>{`
        @keyframes fadePulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes heartFloat {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
          20% { transform: translate(-50%, -50%) scale(1.2) rotate(-10deg); opacity: 1; }
          100% { transform: translate(-50%, calc(-50% - 150px)) scale(0.6) rotate(10deg); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px currentColor; }
          50% { box-shadow: 0 0 60px currentColor, 0 0 100px currentColor; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Live Badge */}
      {isActive && (
        <div style={styles.topBar}>
          <div style={styles.liveBadge}>
            <div style={styles.liveDot} />
            <span style={styles.liveText}>LIVE VOTING</span>
          </div>
        </div>
      )}

      {/* Main Vote Area */}
      <div style={styles.voteArea}>
        {/* Team 1 Side */}
        <div
          style={{
            ...styles.teamSide,
            background: `linear-gradient(180deg, ${hexToRgba(
              team1.color,
              0.15
            )} 0%, ${hexToRgba(team1.color, 0.05)} 50%, transparent 100%)`,
            animation: team1Leading && isActive ? "pulseGlow 2s ease-in-out infinite" : "none",
            color: team1.color,
          }}
          onClick={(e) => handleVote("team1", e)}
          onTouchStart={(e) => handleVote("team1", e)}
        >
          <div style={styles.teamName}>{team1.name}</div>
          <div
            style={{
              ...styles.voteCount,
              textShadow: `0 0 40px ${hexToRgba(team1.color, 0.6)}`,
              transform: lastVotedTeam === "team1" ? "scale(1.2)" : "scale(1)",
            }}
          >
            {votes.team1}
          </div>
          <div style={styles.percentLabel}>{team1Percent.toFixed(1)}%</div>
          {isActive && <div style={styles.tapHint}>Tap to Vote</div>}
        </div>

        {/* Center Divider */}
        <div style={styles.centerDivider} />
        <div style={styles.vsBadge}>VS</div>

        {/* Team 2 Side */}
        <div
          style={{
            ...styles.teamSide,
            background: `linear-gradient(180deg, ${hexToRgba(
              team2.color,
              0.15
            )} 0%, ${hexToRgba(team2.color, 0.05)} 50%, transparent 100%)`,
            animation: team2Leading && isActive ? "pulseGlow 2s ease-in-out infinite" : "none",
            color: team2.color,
          }}
          onClick={(e) => handleVote("team2", e)}
          onTouchStart={(e) => handleVote("team2", e)}
        >
          <div style={styles.teamName}>{team2.name}</div>
          <div
            style={{
              ...styles.voteCount,
              textShadow: `0 0 40px ${hexToRgba(team2.color, 0.6)}`,
              transform: lastVotedTeam === "team2" ? "scale(1.2)" : "scale(1)",
            }}
          >
            {votes.team2}
          </div>
          <div style={styles.percentLabel}>{team2Percent.toFixed(1)}%</div>
          {isActive && <div style={styles.tapHint}>Tap to Vote</div>}
        </div>
      </div>

      {/* Progress Bars */}
      <div style={styles.progressBarContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${team1Percent}%`,
            background: team1.color,
            boxShadow: team1Leading
              ? `0 0 20px ${hexToRgba(team1.color, 0.8)}`
              : "none",
          }}
        />
        <div
          style={{
            ...styles.progressBar,
            width: `${team2Percent}%`,
            background: team2.color,
            boxShadow: team2Leading
              ? `0 0 20px ${hexToRgba(team2.color, 0.8)}`
              : "none",
          }}
        />
      </div>

      {/* QR Code */}
      {qrDataUrl && isActive && (
        <div style={styles.qrContainer}>
          <img
            src={qrDataUrl}
            alt="Scan to vote"
            style={styles.qrCode}
            draggable={false}
          />
          <span style={styles.qrLabel}>Scan to Vote</span>
        </div>
      )}

      {/* Inactive Overlay */}
      {!isActive && totalVotes === 0 && (
        <div style={styles.inactiveOverlay}>
          <div style={styles.inactiveText}>Voting Not Active</div>
        </div>
      )}

      {/* Results Celebration */}
      {showResults && (
        <div style={styles.resultsOverlay}>
          <div
            style={{
              ...styles.winnerText,
              color: isTied ? "#ffffff" : team1Leading ? team1.color : team2.color,
              textShadow: isTied
                ? "0 0 40px rgba(255,255,255,0.5)"
                : `0 0 40px ${hexToRgba(
                    team1Leading ? team1.color : team2.color,
                    0.6
                  )}`,
              animation: "slideUp 0.6s ease",
            }}
          >
            {isTied ? "It's a Tie!" : `${team1Leading ? team1.name : team2.name} Wins!`}
          </div>
          <div
            style={{
              ...styles.resultsStats,
              color: "rgba(255,255,255,0.8)",
              animation: "slideUp 0.6s ease 0.2s both",
            }}
          >
            {votes.team1} - {votes.team2}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "8px",
              animation: "slideUp 0.6s ease 0.4s both",
            }}
          >
            {totalVotes} total votes
          </div>
        </div>
      )}

      {/* Floating Hearts */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          style={{
            ...styles.heart,
            left: heart.x,
            top: heart.y,
            color: heart.color,
            transform: `translate(-50%, -50%) scale(${heart.scale}) rotate(${heart.rotation}deg)`,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}

      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            ...styles.confettiPiece,
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: piece.life,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

export default SocialVoting;
