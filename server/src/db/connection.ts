import mongoose from 'mongoose';
import { config } from '../config';
import logger from '../logging';

// Connection options
const options: mongoose.ConnectOptions = {
  // No need to specify user and password in the options if they're in the URI
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  retryWrites: true, // Retry writes if they fail
  retryReads: true, // Retry reads if they fail
};

// Connect to MongoDB
export const connectToDatabase = async (): Promise<void> => {
  try {
    logger.info(`Attempting to connect to MongoDB at ${config.db.uri}`);
    await mongoose.connect(config.db.uri, options);
    logger.info('🔌 Connected to MongoDB successfully');
  } catch (error) {
    logger.error('❌ Error connecting to MongoDB:', error);
    // Don't exit the process, allow fallback to in-memory state
    
    // Try to connect to localhost if Docker hostname fails
    // This is useful for development environments
    if (config.db.uri.includes('mongodb:27017')) {
      const localUri = config.db.uri.replace('mongodb:27017', 'localhost:27017');
      logger.info(`Attempting to connect to MongoDB at ${localUri}`);
      try {
        await mongoose.connect(localUri, options);
        logger.info('🔌 Connected to MongoDB successfully via localhost');
      } catch (localError) {
        logger.error('❌ Error connecting to MongoDB via localhost:', localError);
      }
    }
  }
};

// Disconnect from MongoDB
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error);
  }
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  logger.info('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('🔌 Mongoose disconnected from MongoDB');
});

// Handle reconnection
mongoose.connection.on('reconnected', () => {
  logger.info('🔌 Mongoose reconnected to MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});