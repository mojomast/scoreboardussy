import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  color?: string;
}

interface Votes {
  team1: number;
  team2: number;
}

export interface MinimalVotingProps {
  team1: Team;
  team2: Team;
  votes: Votes;
  isActive: boolean;
  onVote: (teamId: string) => void;
  qrUrl?: string;
  showQr?: boolean;
  className?: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const useHaptic = () => {
  return useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns: Record<string, number[]> = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 20],
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);
};

const hexToRgba = (hex: string, alpha: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ─── QR Code Display ─────────────────────────────────────────────────────────

const MinimalQR: React.FC<{ url: string; size?: number }> = ({ url, size = 160 }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
    }).then(() => {
      setDataUrl(canvas.toDataURL('image/png'));
    });
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        className="rounded-2xl bg-gray-100 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      <div className="rounded-2xl bg-white p-3 shadow-sm border border-gray-100">
        <img
          src={dataUrl}
          alt="Vote QR Code"
          className="block"
          style={{ width: size, height: size }}
        />
      </div>
      <motion.p
        className="text-center text-xs text-gray-400 mt-2 font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Scan to vote
      </motion.p>
    </motion.div>
  );
};

// ─── Vote Button ─────────────────────────────────────────────────────────────

interface VoteButtonProps {
  team: Team;
  votes: number;
  totalVotes: number;
  isActive: boolean;
  onVote: () => void;
  isWinner?: boolean | null;
  align: 'left' | 'right';
}

const VoteButton: React.FC<VoteButtonProps> = ({
  team,
  votes,
  totalVotes,
  isActive,
  onVote,
  isWinner,
  align,
}) => {
  const haptic = useHaptic();
  const [justVoted, setJustVoted] = useState(false);
  const [displayPercentage, setDisplayPercentage] = useState(totalVotes > 0 ? (votes / totalVotes) * 100 : 50);
  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 50;

  const color = team.color || '#6366f1';
  const bgColor = hexToRgba(color, 0.06);
  const borderColor = hexToRgba(color, 0.15);
  const progressColor = hexToRgba(color, 0.85);

  useEffect(() => {
    let raf: number;
    const start = displayPercentage;
    const end = percentage;
    const duration = 400;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercentage(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [percentage]);

  const handleClick = () => {
    if (!isActive) return;
    haptic('medium');
    setJustVoted(true);
    setTimeout(() => setJustVoted(false), 600);
    onVote();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={!isActive}
      className="relative w-full overflow-hidden rounded-3xl text-left transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: bgColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow: justVoted
          ? `0 0 0 4px ${hexToRgba(color, 0.2)}, 0 8px 32px ${hexToRgba(color, 0.15)}`
          : `0 2px 12px ${hexToRgba(color, 0.08)}`,
      } as React.CSSProperties}
      whileHover={isActive ? { scale: 1.02, y: -2 } : {}}
      whileTap={isActive ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Progress bar background */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-3xl"
        style={{
          width: `${displayPercentage}%`,
          backgroundColor: progressColor,
          opacity: 0.12,
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 py-7 md:px-8 md:py-9">
        <div
          className={`flex items-center justify-between ${
            align === 'right' ? 'flex-row-reverse' : ''
          }`}
        >
          <div className={align === 'right' ? 'text-right' : ''}>
            <motion.h3
              className="text-lg md:text-xl font-semibold tracking-tight text-gray-900"
              layout
            >
              {team.name}
            </motion.h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={votes}
                className="text-sm text-gray-500 mt-0.5 font-medium tabular-nums"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {votes.toLocaleString()} votes
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Percentage */}
          <motion.div
            className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight"
            style={{ color }}
            animate={justVoted ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {Math.round(displayPercentage)}%
          </motion.div>
        </div>

        {/* Thin progress indicator */}
        <div className="mt-5 h-1 rounded-full bg-gray-200/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              width: `${displayPercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Winner crown */}
      <AnimatePresence>
        {isWinner === true && (
          <motion.div
            className="absolute top-3 right-3 md:top-4 md:right-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-sm"
            >
              <path
                d="M5 16L3 5L8.5 9L12 4L15.5 9L21 5L19 16H5Z"
                fill={color}
                fillOpacity="0.9"
              />
              <path
                d="M5 16L3 5L8.5 9L12 4L15.5 9L21 5L19 16H5Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ─── Winner Reveal ───────────────────────────────────────────────────────────

const WinnerReveal: React.FC<{
  team: Team;
  votes: number;
  totalVotes: number;
  onDismiss?: () => void;
}> = ({ team, votes, totalVotes, onDismiss }) => {
  const color = team.color || '#6366f1';
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-white/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        className="relative z-10 text-center max-w-sm w-full"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: hexToRgba(color, 0.1) }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 16L3 5L8.5 9L12 4L15.5 9L21 5L19 16H5Z"
              fill={color}
            />
            <path
              d="M5 16L3 5L8.5 9L12 4L15.5 9L21 5L19 16H5Z"
              stroke={color}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <motion.p
          className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Winner
        </motion.p>

        <motion.h2
          className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {team.name}
        </motion.h2>

        <motion.p
          className="text-lg text-gray-500 font-medium tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {votes.toLocaleString()} votes ({percentage}%)
        </motion.p>

        {onDismiss && (
          <motion.button
            onClick={onDismiss}
            className="mt-8 px-6 py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const MinimalVoting: React.FC<MinimalVotingProps> = ({
  team1,
  team2,
  votes,
  isActive,
  onVote,
  qrUrl,
  showQr = true,
  className = '',
}) => {
  const totalVotes = votes.team1 + votes.team2;
  const [showWinner, setShowWinner] = useState(false);

  const winner = useMemo(() => {
    if (totalVotes === 0) return null;
    if (votes.team1 > votes.team2) return 'team1';
    if (votes.team2 > votes.team1) return 'team2';
    return 'tie';
  }, [votes, totalVotes]);

  const handleVote = useCallback(
    (teamId: string) => {
      onVote(teamId);
    },
    [onVote]
  );

  return (
    <div
      className={`relative w-full max-w-lg mx-auto flex flex-col items-center ${className}`}
      style={{ minHeight: '100vh', paddingTop: '12vh', paddingBottom: '8vh' }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-12 md:mb-16 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Audience Vote
        </h1>
        <p className="text-gray-400 text-sm md:text-base font-medium">
          Tap to cast your vote
        </p>
      </motion.div>

      {/* Vote Buttons */}
      <motion.div
        className="w-full px-5 md:px-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
      >
        <VoteButton
          team={team1}
          votes={votes.team1}
          totalVotes={totalVotes}
          isActive={isActive}
          onVote={() => handleVote(team1.id)}
          isWinner={!isActive && winner === 'team1'}
          align="left"
        />

        <div className="flex items-center justify-center py-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="px-4 text-xs font-semibold text-gray-300 uppercase tracking-widest">
            vs
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <VoteButton
          team={team2}
          votes={votes.team2}
          totalVotes={totalVotes}
          isActive={isActive}
          onVote={() => handleVote(team2.id)}
          isWinner={!isActive && winner === 'team2'}
          align="right"
        />
      </motion.div>

      {/* Total votes */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
          {totalVotes.toLocaleString()} total votes
        </p>
      </motion.div>

      {/* QR Code */}
      <AnimatePresence>
        {showQr && qrUrl && (
          <motion.div
            className="mt-12 md:mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <MinimalQR url={qrUrl} size={140} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Reveal */}
      <AnimatePresence>
        {showWinner && winner && winner !== 'tie' && (
          <WinnerReveal
            team={winner === 'team1' ? team1 : team2}
            votes={winner === 'team1' ? votes.team1 : votes.team2}
            totalVotes={totalVotes}
            onDismiss={() => setShowWinner(false)}
          />
        )}
      </AnimatePresence>

      {/* Trigger winner reveal when voting ends */}
      {!isActive && winner && winner !== 'tie' && !showWinner && (
        <motion.button
          className="mt-8 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => setShowWinner(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reveal Winner
        </motion.button>
      )}
    </div>
  );
};

export default MinimalVoting;
