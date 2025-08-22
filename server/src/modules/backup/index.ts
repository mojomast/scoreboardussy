import { getPrisma } from '../db';
import { promises as fs } from 'fs';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupOptions {
  includeSnapshots?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  retentionDays?: number;
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  size?: number;
  timestamp: Date;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  recordsRestored?: number;
  error?: string;
}

export class BackupService {
  private backupDir: string;
  private prisma = getPrisma();

  constructor(backupDir: string = './backups') {
    this.backupDir = backupDir;
  }

  /**
   * Create a full database backup
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const timestamp = new Date();
      const backupId = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}`;
      const backupPath = path.join(this.backupDir, backupId);

      // Ensure backup directory exists
      await fs.mkdir(backupPath, { recursive: true });

      // Export room data
      const rooms = await this.prisma.room.findMany({
        include: {
          events: true,
          snapshots: options.includeSnapshots || false
        }
      });

      const backupData = {
        metadata: {
          timestamp: timestamp.toISOString(),
          version: '1.0',
          options,
          recordCounts: {
              rooms: rooms.length,
              events: rooms.reduce((sum: number, room: any) => sum + room.events.length, 0),
              snapshots: rooms.reduce((sum: number, room: any) => sum + (room.snapshots?.length || 0), 0)
            }
        },
        data: {
          rooms
        }
      };

      // Write backup file
      const dataFile = path.join(backupPath, 'data.json');
      await fs.writeFile(dataFile, JSON.stringify(backupData, null, 2));

      // Compress if requested
      let finalPath = dataFile;
      let size = (await fs.stat(dataFile)).size;

      if (options.compress) {
        const compressedPath = `${dataFile}.gz`;
        await this.compressFile(dataFile, compressedPath);
        await fs.unlink(dataFile); // Remove uncompressed file
        finalPath = compressedPath;
        size = (await fs.stat(compressedPath)).size;
      }

      // Clean up old backups based on retention policy
      if (options.retentionDays) {
        await this.cleanupOldBackups(options.retentionDays);
      }

      return {
        success: true,
        filePath: finalPath,
        size,
        timestamp
      };

    } catch (error) {
      return {
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFilePath: string): Promise<RestoreResult> {
    try {
      let dataFile = backupFilePath;

      // Decompress if needed
      if (backupFilePath.endsWith('.gz')) {
        dataFile = backupFilePath.replace('.gz', '');
        await this.decompressFile(backupFilePath, dataFile);
      }

      // Read and parse backup data
      const backupData = JSON.parse(await fs.readFile(dataFile, 'utf-8'));

      // Validate backup format
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup format');
      }

      // Clear existing data
      await this.prisma.roomEvent.deleteMany({});
      await this.prisma.roomSnapshot.deleteMany({});
      await this.prisma.room.deleteMany({});

      // Restore data
      let totalRecords = 0;

      for (const room of backupData.data.rooms) {
        // Create room
        const createdRoom = await this.prisma.room.create({
          data: {
            id: room.id,
            code: room.code,
            createdAt: new Date(room.createdAt)
          }
        });

        // Create events
        for (const event of room.events) {
          await this.prisma.roomEvent.create({
            data: {
              id: event.id,
              roomId: createdRoom.id,
              type: event.type,
              payload: event.payload,
              createdAt: new Date(event.createdAt)
            }
          });
          totalRecords++;
        }

        // Create snapshots if included
        if (room.snapshots) {
          for (const snapshot of room.snapshots) {
            await this.prisma.roomSnapshot.create({
              data: {
                id: snapshot.id,
                roomId: createdRoom.id,
                version: snapshot.version,
                state: snapshot.state,
                createdAt: new Date(snapshot.createdAt)
              }
            });
            totalRecords++;
          }
        }

        totalRecords++; // Count the room itself
      }

      // Clean up decompressed file if it was created
      if (dataFile !== backupFilePath) {
        await fs.unlink(dataFile);
      }

      return {
        success: true,
        recordsRestored: totalRecords
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date; metadata?: any }>> {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backupDirs = entries.filter(entry => entry.isDirectory() && entry.name.startsWith('backup_'));

      const backups = [];

      for (const dir of backupDirs) {
        const backupPath = path.join(this.backupDir, dir.name);
        const dataFile = path.join(backupPath, 'data.json');
        const compressedFile = `${dataFile}.gz`;

        let metadata = null;
        let size = 0;
        let fileExists = false;

        // Try compressed first, then uncompressed
        if (await this.fileExists(compressedFile)) {
          size = (await fs.stat(compressedFile)).size;
          fileExists = true;
        } else if (await this.fileExists(dataFile)) {
          size = (await fs.stat(dataFile)).size;
          fileExists = true;

          // Try to read metadata
          try {
            const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
            metadata = data.metadata;
          } catch (e) {
            // Ignore metadata read errors
          }
        }

        if (fileExists) {
          const created = new Date(dir.name.replace('backup_', '').replace(/-/g, ':'));

          backups.push({
            filename: dir.name,
            size,
            created,
            metadata
          });
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutoBackup(cronExpression: string, options: BackupOptions = {}): void {
    // This would integrate with a cron job scheduler like node-cron
    // For now, just log the configuration
    console.log(`Auto-backup scheduled: ${cronExpression}`, options);
  }

  private async compressFile(inputPath: string, outputPath: string): Promise<void> {
    const { createGzip } = await import('zlib');
    const gzip = createGzip();

    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    await pipeline(source, gzip, destination);
  }

  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const { createGunzip } = await import('zlib');
    const gunzip = createGunzip();

    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    await pipeline(source, gunzip, destination);
  }

  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backups = await this.listBackups();

    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        const backupPath = path.join(this.backupDir, backup.filename);
        await fs.rm(backupPath, { recursive: true, force: true });
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const backupService = new BackupService();