import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Penalties {
  major: number;
  minor: number;
}

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  penalties: Penalties;
  logoUrl?: string;
}

interface TimerState {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
}

export interface MinimalistScoreboardProps {
  team1: Team;
  team2: Team;
  currentRound: {
    number: number;
    type: string;
    theme?: string;
    timeLimit?: number;
  };
  timer: TimerState;
  isLive: boolean;
  lightTheme?: boolean;
  showPenalties?: boolean;
  showLogos?: boolean;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 128, g: 128, b: 128 };
};

const getBrightness = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const getTextColor = (bgColor: string) =>
  getBrightness(bgColor) > 128 ? '#1a1a1a' : '#ffffff';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ─── Circular Progress Timer ─────────────────────────────────────────────────

const CircularTimer: React.FC<{
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  lightTheme: boolean;
}> = ({ timeRemaining, totalTime, isRunning, lightTheme }) => {
  const radius = 48;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const isLow = timeRemaining <= 10 && timeRemaining > 0;
  const isDone = timeRemaining <= 0;

  const trackColor = lightTheme ? '#e5e7eb' : '#374151';
  const progressColor = isDone
    ? '#ef4444'
    : isLow
    ? '#f59e0b'
    : isRunning
    ? '#10b981'
    : '#6b7280';

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke={trackColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={progressColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-xl font-bold tabular-nums tracking-tight ${
            lightTheme ? 'text-gray-900' : 'text-white'
          }`}
        >
          {formatTime(Math.max(0, timeRemaining))}
        </span>
      </div>
      {isRunning && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Penalty Cards ───────────────────────────────────────────────────────────

const PenaltyCards: React.FC<{
  penalties: Penalties;
  lightTheme: boolean;
}> = ({ penalties, lightTheme }) => {
  return (
    <div className="flex items-center gap-2 mt-2">
      {penalties.minor > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(penalties.minor, 4) }).map((_, i) => (
            <motion.div
              key={`minor-${i}`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              className="w-4 h-6 rounded-sm shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          ))}
          {penalties.minor > 4 && (
            <span
              className={`text-xs font-bold ${
                lightTheme ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              +{penalties.minor - 4}
            </span>
          )}
        </div>
      )}
      {penalties.major > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(penalties.major, 3) }).map((_, i) => (
            <motion.div
              key={`major-${i}`}
              initial={{ scale: 0, rotate: 10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              className="w-4 h-6 rounded-sm shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          ))}
          {penalties.major > 3 && (
            <span
              className={`text-xs font-bold ${
                lightTheme ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              +{penalties.major - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Team Section ────────────────────────────────────────────────────────────

const TeamSection: React.FC<{
  team: Team;
  showPenalties: boolean;
  showLogo: boolean;
  lightTheme: boolean;
  align: 'left' | 'right';
}> = ({ team, showPenalties, showLogo, lightTheme, align }) => {
  const textColor = getTextColor(team.color);
  const isLeft = align === 'left';

  return (
    <motion.div
      className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden ${
        isLeft ? 'pr-8 md:pr-16' : 'pl-8 md:pl-16'
      }`}
      style={{
        background: `linear-gradient(135deg, ${team.color}dd 0%, ${team.color} 50%, ${team.color}ee 100%)`,
      }}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${textColor} 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        {showLogo && team.logoUrl && (
          <motion.div
            className="mb-4 w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden shadow-lg border-4 border-white/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Team Name */}
        <motion.h2
          className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-center uppercase"
          style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {team.name}
        </motion.h2>

        {/* Score */}
        <motion.div
          className="mt-4 md:mt-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={team.score}
              className="text-7xl md:text-9xl lg:text-[10rem] font-black tabular-nums leading-none"
              style={{
                color: textColor,
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {team.score}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Penalties */}
        {showPenalties && (team.penalties.major > 0 || team.penalties.minor > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PenaltyCards penalties={team.penalties} lightTheme={lightTheme} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const MinimalistScoreboard: React.FC<MinimalistScoreboardProps> = ({
  team1,
  team2,
  currentRound,
  timer,
  isLive,
  lightTheme = false,
  showPenalties = true,
  showLogos = true,
  className = '',
}) => {
  const { t } = useTranslation();

  const bgClass = lightTheme
    ? 'bg-gradient-to-b from-gray-50 to-white'
    : 'bg-gradient-to-b from-gray-900 to-gray-800';

  const textClass = lightTheme ? 'text-gray-900' : 'text-white';
  const subTextClass = lightTheme ? 'text-gray-500' : 'text-gray-400';
  const cardBg = lightTheme
    ? 'bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200'
    : 'bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-700';

  return (
    <div
      className={`min-h-screen w-full flex flex-col ${bgClass} ${className}`}
    >
      {/* Top Bar: Round Info & Live Badge */}
      <motion.div
        className="w-full px-4 md:px-8 py-3 flex items-center justify-between"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full ${cardBg}`}>
            <span className={`text-sm font-bold tracking-wider uppercase ${textClass}`}>
              {t('rounds.numberLabel', 'Round {{number}}', {
                number: currentRound.number,
              })}
            </span>
          </div>
          <div className={`px-3 py-1.5 rounded-full ${cardBg}`}>
            <span className={`text-sm font-medium ${subTextClass}`}>
              {currentRound.type}
            </span>
          </div>
          {currentRound.theme && (
            <div className={`hidden md:block px-3 py-1.5 rounded-full ${cardBg}`}>
              <span className={`text-sm font-medium ${subTextClass}`}>
                {currentRound.theme}
              </span>
            </div>
          )}
        </div>

        {isLive && (
          <motion.div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-red-500 uppercase tracking-wider">
              {t('scoreboardDisplay.live', 'Live')}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Main Scoreboard Area */}
      <div className="flex-1 flex flex-row min-h-0">
        <TeamSection
          team={team1}
          showPenalties={showPenalties}
          showLogo={showLogos}
          lightTheme={lightTheme}
          align="left"
        />

        {/* Center Divider with Timer */}
        <div
          className={`relative flex flex-col items-center justify-center px-4 md:px-8 z-20 ${
            lightTheme ? 'bg-white' : 'bg-gray-900'
          }`}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-400/30 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-400/30 to-transparent" />

          <CircularTimer
            timeRemaining={timer.timeRemaining}
            totalTime={timer.totalTime}
            isRunning={timer.isRunning}
            lightTheme={lightTheme}
          />

          {/* VS Badge */}
          <motion.div
            className={`mt-4 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${
              lightTheme
                ? 'bg-gray-100 text-gray-500'
                : 'bg-gray-800 text-gray-400'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            VS
          </motion.div>
        </div>

        <TeamSection
          team={team2}
          showPenalties={showPenalties}
          showLogo={showLogos}
          lightTheme={lightTheme}
          align="right"
        />
      </div>

      {/* Bottom Bar */}
      <motion.div
        className="w-full px-4 md:px-8 py-3 flex items-center justify-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className={`flex items-center gap-4 px-6 py-2 rounded-full ${cardBg}`}>
          {currentRound.timeLimit && (
            <span className={`text-xs font-medium ${subTextClass}`}>
              {t('rounds.timeLimit', 'Time Limit')}: {currentRound.timeLimit}s
            </span>
          )}
          <span className={`text-xs ${subTextClass}`}>•</span>
          <span className={`text-xs font-medium ${subTextClass}`}>
            {team1.name} {team1.score} - {team2.score} {team2.name}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default MinimalistScoreboard;
