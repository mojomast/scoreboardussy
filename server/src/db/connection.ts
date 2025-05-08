import { DataSource } from 'typeorm';
import path from 'path';
import config from '../config';
import logger from '../logging';
import { Team, Scoreboard, User } from './entities';

// Import reflect-metadata for TypeORM decorators
import 'reflect-metadata';

// Create a new SQLite data source
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: config.db.sqliteDbPath,
  entities: [Team, Scoreboard, User],
  synchronize: true, // Auto-create tables in development
  logging: config.server.nodeEnv === 'development',
});

// Connect to SQLite database
export const connectToDatabase = async (): Promise<void> => {
  try {
    logger.info(`Attempting to connect to SQLite database at ${config.db.sqliteDbPath}`);
    await AppDataSource.initialize();
    logger.info(' Connected to SQLite database successfully');
  } catch (error) {
    logger.error(' Error connecting to SQLite database:', error);
    // Don't exit the process, allow fallback to in-memory state
  }
};

// Disconnect from SQLite database
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info(' Disconnected from SQLite database');
    }
  } catch (error) {
    logger.error(' Error disconnecting from SQLite database:', error);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});