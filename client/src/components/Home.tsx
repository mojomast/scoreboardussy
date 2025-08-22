import React, { useEffect, useState } from 'react';
import {
  getRoomToken,
  setRoomToken,
  clearRoomToken,
  getRoomId,
  setRoomId,
  clearRoomId,
} from '@/utils/room';

const buildShareLink = (roomId: string, token?: string) => {
  const base = window.location.origin;
  const url = new URL(`${base}/#/control`);
  url.searchParams.set('room', roomId);
  if (token) url.searchParams.set('token', token);
  return url.toString();
};

const qrFor = (text: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

const isLikelyIpHostname = (host: string) => {
  // matches IPv4 and plain numeric host
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host === 'localhost';
};

const Home: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = getRoomToken();
      const room = getRoomId();
      if (token) setCurrentToken(token);
      if (room) setCurrentRoomId(room);

      // If no cached session and site was opened by direct IP or localhost, auto-create session
      if (!room && !token) {
        const host = window.location.hostname;
        if (isLikelyIpHostname(host)) {
          // Delay slightly to avoid blocking render
          setTimeout(() => {
            void createSession();
          }, 250);
        }
      }
    } catch {}
  }, []);

  async function createSession() {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const id: string = data.id;
      const token: string | undefined = data?.tokens?.referee;
      if (token) {
        setRoomToken(token);
        setCurrentToken(token);
      }
      if (id) {
        setRoomId(id);
        setCurrentRoomId(id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create session');
    } finally {
      setBusy(false);
    }
  }

  async function resetSession() {
    try {
      setBusy(true);
      setError(null);
      const id = currentRoomId || getRoomId();
      if (id) {
        try {
          await fetch(`/api/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' });
        } catch {}
      }
      clearRoomToken();
      clearRoomId();
      setCurrentRoomId(null);
      setCurrentToken(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset session');
    } finally {
      setBusy(false);
    }
  }

  const copyLink = async () => {
    if (!currentRoomId) return;
    const link = buildShareLink(currentRoomId, currentToken || undefined);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      setError('Copy failed - your browser may block clipboard access');
    }
  };

  const openControl = () => {
    if (!currentRoomId) return;
    const link = buildShareLink(currentRoomId, currentToken || undefined);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-center">Improv Scoreboard ✨</h1>
      <p className="text-gray-600 text-center max-w-md text-sm sm:text-base">
        Quick start: Join (creates a private session on this device). Share the session link or QR to let others join.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full max-w-md">
        {!currentRoomId ? (
          <button
            onClick={createSession}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded disabled:opacity-50 touch-manipulation min-h-[48px] text-base sm:text-sm"
          >
            {busy ? 'Creating…' : 'Join (Create Session)'}
          </button>
        ) : (
          <>
            <button
              onClick={openControl}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded touch-manipulation min-h-[48px] text-base sm:text-sm flex-1"
            >
              Open Control
            </button>
            <button
              onClick={copyLink}
              className="px-6 py-3 rounded border touch-manipulation min-h-[48px] text-base sm:text-sm flex-1"
            >
              Copy Link
            </button>
            <button
              onClick={resetSession}
              disabled={busy}
              className="px-6 py-3 rounded border text-red-600 touch-manipulation min-h-[48px] text-base sm:text-sm"
            >
              {busy ? 'Resetting…' : 'Reset Session'}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {currentRoomId && (
        <div className="w-full max-w-md mt-6 p-4 sm:p-6 border rounded shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Session ID</div>
              <div className="font-mono text-sm truncate dark:text-gray-200">{currentRoomId}</div>
            </div>
            <div className="text-right text-xs text-gray-400 dark:text-gray-500">Cached on this device</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            <div className="flex-shrink-0">
              <img
                src={qrFor(buildShareLink(currentRoomId, currentToken || undefined))}
                alt="Session QR"
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg shadow-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm mb-3 break-words dark:text-gray-200 text-center sm:text-left">
                {buildShareLink(currentRoomId, currentToken || undefined)}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={copyLink}
                  className="px-4 py-2 border rounded touch-manipulation min-h-[40px] text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Copy Link
                </button>
                <button
                  onClick={openControl}
                  className="px-4 py-2 border rounded touch-manipulation min-h-[40px] text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Open Control
                </button>
                <button
                  onClick={resetSession}
                  className="px-4 py-2 border rounded touch-manipulation min-h-[40px] text-sm text-red-600 dark:text-red-400"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-lg font-semibold mb-2">Existing Rooms</h2>
        <p className="text-gray-500 text-sm">(Administrative listing)</p>
        <div className="text-gray-500 mt-2">Use the top controls for quick sessions; the room list is left for advanced management.</div>
      </div>
    </div>
  );
};

export default Home;
