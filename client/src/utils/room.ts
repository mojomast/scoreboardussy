// Utilities for room-aware auth tokens in the client
// Added helpers to persist roomId alongside the existing token helpers.

const STORAGE_KEY = 'roomToken';
const ROOM_ID_KEY = 'roomId';

export function getRoomToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setRoomToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {}
}

export function clearRoomToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getRoomId(): string | null {
  try {
    return localStorage.getItem(ROOM_ID_KEY);
  } catch {
    return null;
  }
}

export function setRoomId(id: string) {
  try {
    localStorage.setItem(ROOM_ID_KEY, id);
  } catch {}
}

export function clearRoomId() {
  try {
    localStorage.removeItem(ROOM_ID_KEY);
  } catch {}
}

// Parse ?token=... and ?room=... from URL, persist them, and optionally clean the URL
// This allows sharing links like /#/control?room=ROOMID&token=TOKEN or simple /?room=ROOMID
export function initRoomAuthFromUrl(cleanUrl: boolean = true) {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const room = url.searchParams.get('room');
    if (token) {
      setRoomToken(token);
    }
    if (room) {
      setRoomId(room);
    }
    if (cleanUrl && (token || room)) {
      if (token) url.searchParams.delete('token');
      if (room) url.searchParams.delete('room');
      // Preserve the hash when updating the URL
      const newUrl = url.pathname + url.search + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch {
    // ignore
  }
}
