import { getPrisma } from '../db';
import { WebSocketManager } from '../socket';
import { getState, updateState } from '../state';

export interface SyncOptions {
  syncInterval?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncResult {
  success: boolean;
  syncedRecords?: number;
  error?: string;
  timestamp: Date;
}

export interface VersionEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  previousState?: Record<string, any>;
}

export class DataSyncService {
  private prisma = getPrisma();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(
    private webSocketManager: WebSocketManager,
    private options: SyncOptions = {}
  ) {
    this.options = {
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      ...options
    };

    this.setupEventListeners();
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.syncData();
      }
    }, this.options.syncInterval);

    console.log(`Auto-sync started with ${this.options.syncInterval}ms interval`);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Manual data synchronization
   */
  async syncData(): Promise<SyncResult> {
    try {
      const timestamp = new Date();

      // Sync current state to database
      const state = getState();

      // Create or update room with current state
      if (state.roomCode) {
        await this.prisma.room.upsert({
          where: { code: state.roomCode },
          update: {
            // Room is already created, we could update metadata here if needed
          },
          create: {
            code: state.roomCode,
            createdAt: new Date()
          }
        });

        // Create event for current state
        await this.prisma.roomEvent.create({
          data: {
            roomId: state.roomCode,
            type: 'state_sync',
            payload: state
          }
        });

        // Create snapshot periodically (every 10 syncs or so)
        if (Math.random() < 0.1) { // 10% chance
          await this.prisma.roomSnapshot.create({
            data: {
              roomId: state.roomCode,
              version: Date.now(),
              state: state
            }
          });
        }
      }

      // Sync with connected clients
      this.broadcastSyncStatus(true);

      return {
        success: true,
        syncedRecords: 1,
        timestamp
      };

    } catch (error) {
      console.error('Data sync failed:', error);
      this.broadcastSyncStatus(false);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get synchronization status
   */
  getSyncStatus(): { isOnline: boolean; lastSync?: Date; nextSync?: Date } {
    return {
      isOnline: this.isOnline,
      nextSync: this.syncInterval ? new Date(Date.now() + this.options.syncInterval!) : undefined
    };
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<SyncResult> {
    return this.syncData();
  }

  private setupEventListeners(): void {
    // Listen for WebSocket connection events
    this.webSocketManager.on('client_connected', (clientId: string) => {
      console.log(`Client ${clientId} connected, triggering sync`);
      this.syncData();
    });

    // Listen for state changes to sync immediately
    this.webSocketManager.on('state_changed', () => {
      this.syncData();
    });
  }

  private broadcastSyncStatus(success: boolean): void {
    this.webSocketManager.broadcast('sync_status', {
      success,
      timestamp: new Date().toISOString(),
      isOnline: this.isOnline
    });
  }
}

export class VersionHistoryService {
  private prisma = getPrisma();
  private maxVersions: number = 50;

  /**
   * Record a version entry
   */
  async recordVersion(
    entityType: string,
    entityId: string,
    action: string,
    changes: Record<string, any>,
    previousState?: Record<string, any>,
    userId?: string
  ): Promise<VersionEntry> {
    const versionEntry: VersionEntry = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      entityType,
      entityId,
      changes,
      previousState
    };

    // In a real implementation, you'd store this in a database table
    // For now, we'll just return the version entry
    console.log('Version recorded:', versionEntry);

    // Clean up old versions to prevent unlimited growth
    await this.cleanupOldVersions(entityType, entityId);

    return versionEntry;
  }

  /**
   * Get version history for an entity
   */
  async getVersionHistory(entityType: string, entityId: string, limit: number = 20): Promise<VersionEntry[]> {
    // In a real implementation, you'd query the database
    // For now, return empty array
    console.log(`Getting version history for ${entityType}:${entityId}`);
    return [];
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(versionId: string): Promise<boolean> {
    try {
      // In a real implementation, you'd:
      // 1. Find the version entry
      // 2. Apply the previous state
      // 3. Record a new version entry for the rollback
      console.log(`Rolling back to version: ${versionId}`);
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  /**
   * Get differences between two versions
   */
  async getVersionDiff(versionId1: string, versionId2: string): Promise<Record<string, any>> {
    // In a real implementation, you'd compare the changes
    console.log(`Getting diff between ${versionId1} and ${versionId2}`);
    return {};
  }

  private async cleanupOldVersions(entityType: string, entityId: string): Promise<void> {
    // In a real implementation, you'd delete versions beyond maxVersions
    console.log(`Cleaning up old versions for ${entityType}:${entityId}`);
  }
}

// Export singleton instances
export const versionHistoryService = new VersionHistoryService();