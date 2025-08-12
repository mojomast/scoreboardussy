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
    <div className="min-h-screen flex flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Improv Scoreboard ✨</h1>
      <p className="text-gray-600">Quick start: Join (creates a private session on this device). Share the session link or QR to let others join.</p>

      <div className="flex gap-3 mt-3">
        {!currentRoomId ? (
          <button
            onClick={createSession}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Join (Create Session)'}
          </button>
        ) : (
          <>
            <button
              onClick={openControl}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
            >
              Open Control
            </button>
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded border"
            >
              Copy Link
            </button>
            <button
              onClick={resetSession}
              disabled={busy}
              className="px-4 py-2 rounded border text-red-600"
            >
              {busy ? 'Resetting…' : 'Reset Session'}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {currentRoomId && (
        <div className="w-full max-w-md mt-6 p-4 border rounded shadow-sm bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-gray-500">Current Session ID</div>
              <div className="font-mono text-sm truncate">{currentRoomId}</div>
            </div>
            <div className="text-right text-xs text-gray-400">Cached on this device</div>
          </div>

          <div className="mt-3 flex gap-3 items-center">
            <img src={qrFor(buildShareLink(currentRoomId, currentToken || undefined))} alt="Session QR" style={{ width: 140, height: 140 }} className="rounded" />
            <div className="flex-1">
              <div className="text-sm mb-2 break-words">{buildShareLink(currentRoomId, currentToken || undefined)}</div>
              <div className="flex gap-2">
                <button onClick={copyLink} className="px-3 py-1 border rounded text-sm">Copy Link</button>
                <button onClick={openControl} className="px-3 py-1 border rounded text-sm">Open Control</button>
                <button onClick={resetSession} className="px-3 py-1 border rounded text-sm text-red-600">Reset</button>
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
