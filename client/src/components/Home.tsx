import React, { useEffect, useState } from 'react';

type Room = { id: string; createdAt: string; team1Name?: string; team2Name?: string; team1Score?: number; team2Score?: number };

const Home: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  async function refreshRooms() {
    try {
      setLoadingRooms(true);
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  }

  useEffect(() => { refreshRooms(); }, []);

  async function createRoom() {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Navigate to control URL with referee token
      const url = new URL(data.urls.control, window.location.origin);
      url.searchParams.set('token', data.tokens.referee);
      window.location.assign(url.toString());
    } catch (e: any) {
      setError(e?.message || 'Failed to create room');
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoom(id: string) {
    try {
      setError(null);
      const res = await fetch(`/api/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshRooms();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete room');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Improv Scoreboard</h1>
      <p className="text-gray-600">Start a new match or open an existing one.</p>
      <div className="flex gap-3">
        <button
          onClick={createRoom}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create Room'}
        </button>
        <button onClick={refreshRooms} className="px-4 py-2 rounded border">Refresh Rooms</button>
        <a href="#/control" className="px-4 py-2 rounded border">Open Local Control</a>
        <a href="#/display" className="px-4 py-2 rounded border">Open Local Display</a>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-lg font-semibold mb-2">Existing Rooms</h2>
        {loadingRooms ? (
          <p className="text-gray-500">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-500">No rooms yet. Create one to get started.</p>
        ) : (
          <ul className="divide-y border rounded">
            {rooms.map(r => (
              <li key={r.id} className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{r.id}</div>
                  <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  {(r.team1Name || r.team2Name) && (
                    <div className="text-sm mt-1">
                      <span className="font-medium">{r.team1Name || 'Team 1'}</span> {typeof r.team1Score === 'number' ? r.team1Score : '-'}
                      <span className="mx-2">vs</span>
                      <span className="font-medium">{r.team2Name || 'Team 2'}</span> {typeof r.team2Score === 'number' ? r.team2Score : '-'}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <a className="px-3 py-1 border rounded text-sm" href={`#/control?room=${encodeURIComponent(r.id)}`}>Open Control</a>
                  <a className="px-3 py-1 border rounded text-sm" href={`#/display?room=${encodeURIComponent(r.id)}`}>Open Display</a>
                  <button className="px-3 py-1 border rounded text-sm text-red-600" onClick={() => deleteRoom(r.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
