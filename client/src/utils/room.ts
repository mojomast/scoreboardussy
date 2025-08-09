// Utilities for room-aware auth tokens in the client

const STORAGE_KEY = 'roomToken';

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

// Parse ?token=... from URL, persist it, and optionally clean the URL
export function initRoomAuthFromUrl(cleanUrl: boolean = true) {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token) {
      setRoomToken(token);
      if (cleanUrl) {
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
    }
  } catch {
    // ignore
  }
}
