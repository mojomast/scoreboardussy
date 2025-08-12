import { io, Socket } from 'socket.io-client';
import { getRoomToken } from './utils/room';
import { ServerToClientEvents, ClientToServerEvents } from '@server-types/index'; // Use path alias

// Determine the server URL based on the environment
// Priority:
// 1. VITE_SERVER_URL environment variable (for LoadBalancer IP)
// 2. In development: localhost:3001
// 3. In production: same origin (when server serves client)
const getServerURL = () => {
  // Check for explicit server URL (useful for LoadBalancer deployment)
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // Development mode - connect to local server
  if (!import.meta.env.PROD) {
    return 'http://localhost:3001';
  }
  
  // Production mode - use same origin (when server serves the client)
  return window.location.origin;
};

const URL = getServerURL();

console.log(`Socket connecting to: ${URL}`);

// Explicitly type the socket client
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false, // We will connect manually in the App component
  transports: ['websocket'], // Prefer WebSocket
  // reconnectionAttempts: 5,
  // reconnectionDelay: 1000,
  auth: (cb: (data: Record<string, unknown>) => void) => {
    const token = getRoomToken();
    if (token) cb({ token }); else cb({});
  },
});

// Optional: Add listeners for built-in events for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (err) => {
console.error('Socket connection error:', err.message);
});
