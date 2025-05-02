import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@server-types/index'; // Use path alias

// Determine the server URL based on the environment
// In development, Vite proxies '/socket.io', but we connect directly to the server's port.
// In production, the server serves the client, so we connect to the same origin.
const URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001';

console.log(`Socket connecting to: ${URL}`);

// Explicitly type the socket client
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false, // We will connect manually in the App component
  transports: ['websocket'], // Prefer WebSocket
  // reconnectionAttempts: 5,
  // reconnectionDelay: 1000,
});

// Optional: Add listeners for built-in events for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message, err.cause);
});
