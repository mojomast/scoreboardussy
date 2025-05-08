import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

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
};
