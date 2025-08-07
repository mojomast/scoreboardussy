import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@server-types/index';

// Type for event names
type ClientEventName = keyof ClientToServerEvents;
type ServerEventName = keyof ServerToClientEvents;

// Configuration for socket connection
interface SocketConfig {
  reconnectionAttempts: number;
  initialReconnectionDelay: number;
  maxReconnectionDelay: number;
  reconnectionDelayGrowthFactor: number;
  randomizationFactor: number;
  timeout: number;
  autoConnect: boolean;
}

// Default configuration
const DEFAULT_CONFIG: SocketConfig = {
  reconnectionAttempts: 10,
  initialReconnectionDelay: 1000, // 1 second
  maxReconnectionDelay: 30000, // 30 seconds
  reconnectionDelayGrowthFactor: 1.5, // Exponential backoff factor
  randomizationFactor: 0.5, // Add randomization to prevent all clients reconnecting simultaneously
  timeout: 20000, // 20 seconds
  autoConnect: true
};

// Connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Operation queue item
interface QueuedOperation {
  event: ClientEventName;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private config: SocketConfig;
  private serverUrl: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempt: number = 0;
  private reconnectTimer: number | null = null;
  private operationQueue: QueuedOperation[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  private lastError: Error | null = null;

  constructor(serverUrl: string, config: Partial<SocketConfig> = {}) {
    this.serverUrl = serverUrl;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket) {
      console.log('Socket already exists, disconnecting first');
      this.disconnect();
    }

    this.updateConnectionState(ConnectionState.CONNECTING);
    
    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: this.config.timeout,
        reconnection: false, // We'll handle reconnection manually
        autoConnect: this.config.autoConnect
      });

      this.setupEventListeners();
      
      // Start connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.connectionState !== ConnectionState.CONNECTED) {
          console.error('Connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.config.timeout);

      // Clear timeout when connected
      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout);
      });
    } catch (error) {
      console.error('Error creating socket:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.clearReconnectTimer();
    this.updateConnectionState(ConnectionState.DISCONNECTED);
  }

  /**
   * Send an event to the server
   * @param event The event name
   * @param payload The event payload
   * @param options Options for the operation
   * @returns True if the event was sent, false if it was queued
   */
  public emit<T extends ClientEventName>(
    event: T,
    payload?: Parameters<ClientToServerEvents[T]>[0],
    options: { queueIfDisconnected?: boolean, maxRetries?: number } = {}
  ): boolean {
    const { queueIfDisconnected = true, maxRetries = 3 } = options;
    
    if (this.connectionState === ConnectionState.CONNECTED && this.socket) {
      try {
        // Use type assertion to handle the socket.io-client typing limitations
        (this.socket as any).emit(event, payload);
        return true;
      } catch (error) {
        console.error(`Error emitting event ${String(event)}:`, error);
        
        if (queueIfDisconnected) {
          this.queueOperation(event, payload, maxRetries);
        }
        
        return false;
      }
    } else if (queueIfDisconnected) {
      this.queueOperation(event, payload, maxRetries);
      return false;
    }
    
    return false;
  }

  /**
   * Add a listener for a server event
   * @param event The event name
   * @param callback The callback function
   */
  public on<T extends ServerEventName>(
    event: T,
    callback: ServerToClientEvents[T]
  ): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    
    this.listeners.get(event as string)?.add(callback);
    
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Remove a listener for a server event
   * @param event The event name
   * @param callback The callback function
   */
  public off<T extends ServerEventName>(
    event: T,
    callback?: ServerToClientEvents[T]
  ): void {
    if (callback) {
      this.listeners.get(event as string)?.delete(callback);
      
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      this.listeners.delete(event as string);
      
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * Add a listener for connection state changes
   * @param callback The callback function
   */
  public onConnectionStateChange(callback: (state: ConnectionState) => void): void {
    this.connectionStateListeners.add(callback);
    // Immediately call with current state
    callback(this.connectionState);
  }

  /**
   * Remove a listener for connection state changes
   * @param callback The callback function
   */
  public offConnectionStateChange(callback: (state: ConnectionState) => void): void {
    this.connectionStateListeners.delete(callback);
  }

  /**
   * Get the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get the last error
   */
  public getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Get the number of queued operations
   */
  public getQueueLength(): number {
    return this.operationQueue.length;
  }

  /**
   * Clear the operation queue
   */
  public clearQueue(): void {
    this.operationQueue = [];
  }

  /**
   * Setup event listeners for the socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempt = 0;
      this.updateConnectionState(ConnectionState.CONNECTED);
      this.processQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      
      // If the disconnection was initiated by the server, try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        this.updateConnectionState(ConnectionState.RECONNECTING);
        this.attemptReconnect();
      } else {
        this.updateConnectionState(ConnectionState.DISCONNECTED);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      this.handleConnectionError(error);
    });

    // Add all registered event listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        // Use type assertion to handle the socket.io-client typing limitations
        (this.socket as any)?.on(event, callback);
      });
    });
  }

  /**
   * Handle connection errors
   * @param error The error
   */
  private handleConnectionError(error: Error): void {
    this.lastError = error;
    this.updateConnectionState(ConnectionState.ERROR);
    
    // Attempt to reconnect
    this.attemptReconnect();
  }

  /**
   * Attempt to reconnect to the server with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnectionAttempts) {
      console.error(`Maximum reconnection attempts (${this.config.reconnectionAttempts}) reached`);
      this.updateConnectionState(ConnectionState.DISCONNECTED);
      return;
    }

    this.clearReconnectTimer();
    
    // Calculate delay with exponential backoff and randomization
    const delay = Math.min(
      this.config.initialReconnectionDelay * Math.pow(this.config.reconnectionDelayGrowthFactor, this.reconnectAttempt),
      this.config.maxReconnectionDelay
    );
    
    // Add randomization
    const randomizedDelay = delay * (1 + Math.random() * this.config.randomizationFactor);
    
    console.log(`Attempting to reconnect in ${Math.round(randomizedDelay)}ms (attempt ${this.reconnectAttempt + 1}/${this.config.reconnectionAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempt++;
      this.updateConnectionState(ConnectionState.RECONNECTING);
      this.connect();
    }, randomizedDelay);
  }

  /**
   * Clear the reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update the connection state and notify listeners
   * @param state The new connection state
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionStateListeners.forEach(listener => listener(state));
  }

  /**
   * Queue an operation to be sent when the connection is restored
   * @param event The event name
   * @param payload The event payload
   * @param maxRetries Maximum number of retries
   */
  private queueOperation<T extends ClientEventName>(
    event: T,
    payload: Parameters<ClientToServerEvents[T]>[0] | undefined,
    maxRetries: number
  ): void {
    this.operationQueue.push({
      event,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries
    });
    
    console.log(`Operation queued: ${event}. Queue length: ${this.operationQueue.length}`);
  }

  /**
   * Process the operation queue
   */
  private processQueue(): void {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.socket) {
      return;
    }
    
    const currentTime = Date.now();
    const queueCopy = [...this.operationQueue];
    this.operationQueue = [];
    
    queueCopy.forEach(operation => {
      // Skip operations that are too old (more than 5 minutes)
      if (currentTime - operation.timestamp > 5 * 60 * 1000) {
        console.warn(`Skipping queued operation ${operation.event} as it's too old`);
        return;
      }
      
      try {
        console.log(`Processing queued operation: ${operation.event}`);
        // Use type assertion to handle the socket.io-client typing limitations
        (this.socket as any)?.emit(operation.event, operation.payload);
      } catch (error) {
        console.error(`Error processing queued operation ${operation.event}:`, error);
        
        // Re-queue if retries are available
        if (operation.retries < operation.maxRetries) {
          operation.retries++;
          this.operationQueue.push(operation);
        } else {
          console.error(`Maximum retries reached for operation ${operation.event}`);
        }
      }
    });
    
    if (this.operationQueue.length > 0) {
      console.log(`${this.operationQueue.length} operations still in queue after processing`);
    }
  }
}

// Create and export a singleton instance
let serverUrl = '';
if (typeof window !== 'undefined') {
  serverUrl = import.meta.env.MODE === 'production'
    ? window.location.origin
    : 'http://localhost:3001';
}

export const socketManager = new SocketManager(serverUrl);

// Export a hook for React components
export const useSocketManager = () => socketManager;