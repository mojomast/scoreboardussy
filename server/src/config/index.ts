import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

<<<<<<< HEAD
// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

// Throw error if any required environment variables are missing
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

// Parse CORS allowed origins
const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173',
    ];

// Configuration object
const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
  cors: {
    allowedOrigins: corsAllowedOrigins,
  },
  db: {
    sqliteDbPath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../../data/improvscoreboard.sqlite'),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_token_secret',
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  paths: {
    clientBuildPath: path.resolve(__dirname, '../../../client/dist'),
  },
=======
export const config = {
    port: PORT,
    host: '0.0.0.0',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/improvscoreboard',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        allowedOrigins: [process.env.CORS_ORIGIN || 'http://localhost:5173']
    },
    auth: {
        adminUsername: process.env.ADMIN_USERNAME || 'admin',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiration: process.env.JWT_EXPIRATION || '1h',
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
        refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d'
    },
    server: {
        host: '0.0.0.0',
        port: PORT,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        isProduction: process.env.NODE_ENV === 'production'
    },
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/improvscoreboard',
        name: 'improvscoreboard'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    paths: {
        uploads: process.env.UPLOAD_PATH || './uploads',
        clientBuildPath: process.env.CLIENT_BUILD_PATH || '../client/dist'
    }
>>>>>>> 032adbf04f7d7a01ab10513234f76b30671dbe4d
};
