import React, { useState } from 'react';

const Home: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
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
        <a href="#/control" className="px-4 py-2 rounded border">Open Local Control</a>
        <a href="#/display" className="px-4 py-2 rounded border">Open Local Display</a>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export default Home;
