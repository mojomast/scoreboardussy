import React, { useState } from 'react';

const Home: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');

  async function createRoom() {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoomCode(data.code);
    } catch (e: any) {
      setError(e?.message || 'Failed to create room');
    } finally {
      setBusy(false);
    }
  }

  function joinRoom() {
    if (!joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    window.location.href = `#/room/${code}`;
  }

  function goToDisplay() {
    if (!roomCode) return;
    window.location.href = `#/room/${roomCode}`;
  }

  function goToControl() {
    if (!roomCode) return;
    window.location.href = `#/room/${roomCode}/control`;
  }

  const displayUrl = roomCode ? `${window.location.origin}/#/room/${roomCode}` : '';
  const controlUrl = roomCode ? `${window.location.origin}/#/room/${roomCode}/control` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            🏆 Scoreboardussy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time improv scoreboard for your shows
          </p>
        </div>

        {!roomCode ? (
          /* Create/Join Room View */
          <div className="space-y-6">
            {/* Create New Room */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Create New Scoreboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Start a new scoreboard session. You'll get a unique room code to share.
              </p>
              <button
                onClick={createRoom}
                disabled={busy}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {busy ? '⏳ Creating...' : '✨ Create New Room'}
              </button>
            </div>

            {/* Join Existing Room */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Join Existing Room
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Have a room code? Enter it below to join.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code (e.g., ABC123)"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                />
                <button
                  onClick={joinRoom}
                  disabled={!joinCode.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">❌ {error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Room Created View */
          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-800">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
                Room Created!
              </h2>
              <div className="text-sm text-green-700 dark:text-green-400 mb-4">
                Your room code is:
              </div>
              <div className="inline-block px-8 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="font-mono text-5xl font-bold tracking-widest text-blue-600 dark:text-blue-400">
                  {roomCode}
                </div>
              </div>
            </div>

            {/* QR Codes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display QR */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
                  📺 Display View
                </h3>
                <img
                  src={`/api/rooms/${roomCode}/qr?type=display`}
                  alt="Display QR Code"
                  className="w-48 h-48 mx-auto mb-3 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 break-all">
                  {displayUrl}
                </p>
                <button
                  onClick={goToDisplay}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Open Display
                </button>
              </div>

              {/* Control QR */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
                  🎮 Control Panel
                </h3>
                <img
                  src={`/api/rooms/${roomCode}/qr?type=control`}
                  alt="Control QR Code"
                  className="w-48 h-48 mx-auto mb-3 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 break-all">
                  {controlUrl}
                </p>
                <button
                  onClick={goToControl}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Open Control
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📱 How to use:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• <strong>Display</strong>: For projector/audience screen (shows scores)</li>
                <li>• <strong>Control</strong>: For referee device (manages the game)</li>
                <li>• Scan QR codes with your phone to access on other devices</li>
                <li>• Room stays active for 2 hours after last activity</li>
              </ul>
            </div>

            {/* Create Another */}
            <button
              onClick={() => { setRoomCode(null); setError(null); }}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Create Another Room
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Scoreboardussy v0.5.7 • Hosted at scoreboard.ussy.host
      </div>
    </div>
  );
};

export default Home;

