import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
];

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
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/improvscoreboard',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
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
};

export default config;