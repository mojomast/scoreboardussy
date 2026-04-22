import React, { useEffect, useRef, useState } from "react";

interface Team {
  name: string;
  color?: string;
}

interface CasinoVotingProps {
  team1: Team;
  team2: Team;
  votes: [number, number];
  isActive: boolean;
  onVote: (teamIndex: 0 | 1) => void;
}

const CasinoVoting: React.FC<CasinoVotingProps> = ({
  team1,
  team2,
  votes,
  isActive,
  onVote,
}) => {
  const [displayVotes, setDisplayVotes] = useState<[number, number]>([0, 0]);
  const [displayPcts, setDisplayPcts] = useState<[number, number]>([50, 50]);
  const [rolling, setRolling] = useState<[boolean, boolean]>([false, false]);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [showJackpot, setShowJackpot] = useState(false);
  const [coins, setCoins] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  const totalVotes = votes[0] + votes[1];
  const pct1 = totalVotes > 0 ? Math.round((votes[0] / totalVotes) * 100) : 50;
  const pct2 = totalVotes > 0 ? Math.round((votes[1] / totalVotes) * 100) : 50;
  const prevVotes = useRef(votes);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayVotes((prev) => {
        const next: [number, number] = [prev[0], prev[1]];
        if (prev[0] !== votes[0]) next[0] += prev[0] < votes[0] ? 1 : -1;
        if (prev[1] !== votes[1]) next[1] += prev[1] < votes[1] ? 1 : -1;
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [votes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPcts((prev) => {
        const next: [number, number] = [prev[0], prev[1]];
        if (prev[0] !== pct1) next[0] += prev[0] < pct1 ? 1 : -1;
        if (prev[1] !== pct2) next[1] += prev[1] < pct2 ? 1 : -1;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [pct1, pct2]);

  useEffect(() => {
    if (votes[0] !== prevVotes.current[0] || votes[1] !== prevVotes.current[1]) {
      setRolling([votes[0] !== prevVotes.current[0], votes[1] !== prevVotes.current[1]]);
      setTimeout(() => setRolling([false, false]), 600);
      prevVotes.current = votes;
    }
  }, [votes]);

  useEffect(() => {
    if (!isActive && totalVotes > 0) {
      const w = votes[0] > votes[1] ? 0 : votes[1] > votes[0] ? 1 : null;
      if (w !== null) {
        setWinner(w);
        setShowJackpot(true);
        const newCoins = Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          delay: Math.random() * 1.5,
        }));
        setCoins(newCoins);
        setTimeout(() => setShowJackpot(false), 4000);
        setTimeout(() => setCoins([]), 4000);
      }
    } else {
      setWinner(null);
      setShowJackpot(false);
      setCoins([]);
    }
  }, [isActive, totalVotes, votes]);

  const SlotButton = ({
    team,
    index,
    voteCount,
    pct,
    isRolling,
  }: {
    team: Team;
    index: 0 | 1;
    voteCount: number;
    pct: number;
    isRolling: boolean;
  }) => {
    const baseColor = team.color || (index === 0 ? "#e11d48" : "#2563eb");
    return (
      <button
        onClick={() => isActive && onVote(index)}
        disabled={!isActive}
        style={{
          flex: 1,
          padding: "16px 8px",
          borderRadius: "16px",
          border: `3px solid ${baseColor}`,
          background: `linear-gradient(180deg, #1a0a00 0%, #0f0500 100%)`,
          boxShadow: `0 0 20px ${baseColor}80, inset 0 0 20px ${baseColor}20`,
          color: "#fff",
          fontFamily: `'Impact', 'Arial Black', sans-serif`,
          textTransform: "uppercase",
          cursor: isActive ? "pointer" : "default",
          opacity: isActive ? 1 : 0.6,
          position: "relative",
          overflow: "hidden",
          minHeight: "140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "transform 0.1s, box-shadow 0.2s",
          transform: isActive ? "scale(1)" : "scale(0.98)",
        }}
        onMouseDown={(e) => {
          if (isActive) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)";
        }}
        onMouseUp={(e) => {
          if (isActive) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
        onTouchStart={(e) => {
          if (isActive) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)";
        }}
        onTouchEnd={(e) => {
          if (isActive) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(90deg, transparent, ${baseColor}, transparent)`,
            animation: "slotShimmer 2s infinite",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            fontWeight: 900,
            letterSpacing: "2px",
            color: baseColor,
            textShadow: `0 0 10px ${baseColor}`,
          }}
        >
          {team.name}
        </div>
        <div
          style={{
            fontSize: "42px",
            fontWeight: 900,
            lineHeight: 1,
            color: "#ffd700",
            textShadow: "0 0 20px #ffd70080, 0 2px 4px #000",
            fontFamily: `'Courier New', monospace`,
            transition: "transform 0.1s",
            transform: isRolling ? "translateY(-4px)" : "translateY(0)",
          }}
        >
          {voteCount}
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#fff",
            textShadow: `0 0 10px ${baseColor}`,
          }}
        >
          {pct}%
        </div>
        {isActive && (
          <div
            style={{
              fontSize: "10px",
              color: "#ffd700",
              letterSpacing: "1px",
              animation: "pulseText 1s infinite",
            }}
          >
            PULL TO VOTE
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      style={{
        fontFamily: `'Impact', 'Arial Black', 'Helvetica Neue', sans-serif`,
        background: `linear-gradient(180deg, #0a0a0a 0%, #1a0500 50%, #0a0a0a 100%)`,
        padding: "20px 16px",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",
        maxWidth: "480px",
        margin: "0 auto",
        boxShadow: "0 0 40px #ffd70030, inset 0 0 60px #000",
        border: "2px solid #ffd70040",
      }}
    >
      {/* Background sparkle grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle, #ffd70010 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#ffd700",
            textShadow: "0 0 20px #ffd700, 0 2px 4px #000",
            letterSpacing: "4px",
            animation: "glowPulse 2s infinite",
          }}
        >
          CASINO ROYALE
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#ff6b6b",
            letterSpacing: "6px",
            marginTop: "4px",
            textShadow: "0 0 10px #ff6b6b",
          }}
        >
          {isActive ? "VOTING LIVE" : "VOTING CLOSED"}
        </div>
      </div>

      {/* Slot Machine Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <SlotButton
          team={team1}
          index={0}
          voteCount={displayVotes[0]}
          pct={displayPcts[0]}
          isRolling={rolling[0]}
        />
        <SlotButton
          team={team2}
          index={1}
          voteCount={displayVotes[1]}
          pct={displayPcts[1]}
          isRolling={rolling[1]}
        />
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: "8px",
          background: "#1a1a1a",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
          boxShadow: "inset 0 0 8px #000",
        }}
      >
        <div
          style={{
            width: `${displayPcts[0]}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${team1.color || "#e11d48"}, #ff6b6b)`,
            boxShadow: `0 0 10px ${team1.color || "#e11d48"}`,
            transition: "width 0.3s ease-out",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </div>
      </div>

      {/* QR Code */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: "12px",
            borderRadius: "16px",
            border: "2px solid #ffd700",
            boxShadow: "0 0 20px #ffd70060, inset 0 0 20px #ffd70010",
            background: "#000",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              background: "#fff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "#000",
              fontFamily: "monospace",
            }}
          >
            <svg viewBox="0 0 100 100" width="100" height="100">
              <rect x="0" y="0" width="30" height="30" fill="#000" />
              <rect x="5" y="5" width="20" height="20" fill="#fff" />
              <rect x="10" y="10" width="10" height="10" fill="#000" />
              <rect x="70" y="0" width="30" height="30" fill="#000" />
              <rect x="75" y="5" width="20" height="20" fill="#fff" />
              <rect x="80" y="10" width="10" height="10" fill="#000" />
              <rect x="0" y="70" width="30" height="30" fill="#000" />
              <rect x="5" y="75" width="20" height="20" fill="#fff" />
              <rect x="10" y="80" width="10" height="10" fill="#000" />
              <rect x="35" y="0" width="5" height="5" fill="#000" />
              <rect x="45" y="0" width="5" height="5" fill="#000" />
              <rect x="55" y="0" width="5" height="5" fill="#000" />
              <rect x="35" y="10" width="5" height="5" fill="#000" />
              <rect x="50" y="10" width="5" height="5" fill="#000" />
              <rect x="60" y="10" width="5" height="5" fill="#000" />
              <rect x="40" y="20" width="5" height="5" fill="#000" />
              <rect x="55" y="20" width="5" height="5" fill="#000" />
              <rect x="35" y="35" width="5" height="5" fill="#000" />
              <rect x="45" y="35" width="5" height="5" fill="#000" />
              <rect x="55" y="35" width="5" height="5" fill="#000" />
              <rect x="40" y="40" width="5" height="5" fill="#000" />
              <rect x="50" y="40" width="5" height="5" fill="#000" />
              <rect x="60" y="40" width="5" height="5" fill="#000" />
              <rect x="35" y="50" width="5" height="5" fill="#000" />
              <rect x="45" y="50" width="5" height="5" fill="#000" />
              <rect x="55" y="50" width="5" height="5" fill="#000" />
              <rect x="0" y="35" width="5" height="5" fill="#000" />
              <rect x="10" y="40" width="5" height="5" fill="#000" />
              <rect x="20" y="45" width="5" height="5" fill="#000" />
              <rect x="0" y="50" width="5" height="5" fill="#000" />
              <rect x="15" y="55" width="5" height="5" fill="#000" />
              <rect x="25" y="55" width="5" height="5" fill="#000" />
              <rect x="70" y="35" width="5" height="5" fill="#000" />
              <rect x="80" y="40" width="5" height="5" fill="#000" />
              <rect x="90" y="45" width="5" height="5" fill="#000" />
              <rect x="75" y="50" width="5" height="5" fill="#000" />
              <rect x="85" y="55" width="5" height="5" fill="#000" />
              <rect x="70" y="60" width="5" height="5" fill="#000" />
              <rect x="80" y="65" width="5" height="5" fill="#000" />
              <rect x="90" y="65" width="5" height="5" fill="#000" />
              <rect x="35" y="70" width="5" height="5" fill="#000" />
              <rect x="45" y="75" width="5" height="5" fill="#000" />
              <rect x="55" y="75" width="5" height="5" fill="#000" />
              <rect x="40" y="85" width="5" height="5" fill="#000" />
              <rect x="50" y="85" width="5" height="5" fill="#000" />
              <rect x="60" y="85" width="5" height="5" fill="#000" />
              <rect x="35" y="90" width="5" height="5" fill="#000" />
              <rect x="50" y="95" width="5" height="5" fill="#000" />
              <rect x="70" y="75" width="5" height="5" fill="#000" />
              <rect x="80" y="80" width="5" height="5" fill="#000" />
              <rect x="90" y="85" width="5" height="5" fill="#000" />
              <rect x="75" y="90" width="5" height="5" fill="#000" />
              <rect x="85" y="95" width="5" height="5" fill="#000" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "-4px",
              right: "-4px",
              bottom: "-4px",
              borderRadius: "18px",
              border: "2px solid transparent",
              boxShadow: "0 0 15px #ffd70040",
              animation: "neonPulse 1.5s infinite",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#ffd700",
          letterSpacing: "2px",
          marginBottom: "8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        SCAN TO VOTE
      </div>

      {/* Total votes */}
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#888",
          position: "relative",
          zIndex: 1,
        }}
      >
        TOTAL VOTES: {" "}
        <span style={{ color: "#ffd700", fontWeight: 700 }}>{totalVotes}</span>
      </div>

      {/* Jackpot Winner */}
      {showJackpot && winner !== null && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            zIndex: 10,
            borderRadius: "20px",
            animation: "jackpotFadeIn 0.5s ease-out",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              color: "#ffd700",
              textShadow: "0 0 30px #ffd700, 0 0 60px #ff6b00",
              animation: "jackpotBounce 0.6s infinite alternate",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            JACKPOT!
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
              marginTop: "12px",
              textShadow: "0 0 20px #fff",
              textAlign: "center",
            }}
          >
            {winner === 0 ? team1.name : team2.name}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#ffd700",
              marginTop: "8px",
              letterSpacing: "2px",
            }}
          >
            WINS {winner === 0 ? displayPcts[0] : displayPcts[1]}% OF VOTES
          </div>
        </div>
      )}

      {/* Gold Coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          style={{
            position: "absolute",
            left: `${coin.x}%`,
            top: "-30px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #fffacd, #ffd700, #b8860b)",
            boxShadow: "0 0 10px #ffd700",
            zIndex: 11,
            animation: `coinDrop 2s ease-in ${coin.delay}s forwards`,
          }}
        />
      ))}

      <style>{`
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 20px #ffd700, 0 2px 4px #000; }
          50% { text-shadow: 0 0 40px #ffd700, 0 0 60px #ff6b00, 0 2px 4px #000; }
        }
        @keyframes slotShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 15px #ffd70040; }
          50% { box-shadow: 0 0 25px #ffd70080, 0 0 40px #ffd70040; }
        }
        @keyframes jackpotFadeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes jackpotBounce {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes coinDrop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CasinoVoting;
