import express, { Express } from 'express';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import fs from 'fs';

// Define allowed origins for CORS (augmented by env in production)
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:5173',
];

const publicUrl = process.env.PUBLIC_URL ? process.env.PUBLIC_URL.replace(/\/$/, '') : undefined;
if (publicUrl) {
    allowedOrigins.push(publicUrl);
}
const explicitOrigin = process.env.ORIGIN ? process.env.ORIGIN.replace(/\/$/, '') : undefined;
if (explicitOrigin && !allowedOrigins.includes(explicitOrigin)) {
    allowedOrigins.push(explicitOrigin);
}

// CORS configuration
export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // In packaged mode (single EXE), allow all origins for LAN access
        if ((process as any).pkg) {
            return callback(null, true);
        }
        // In production server mode, restrict to configured origins if provided
        if (process.env.NODE_ENV === 'production' && (publicUrl || explicitOrigin)) {
            if (allowedOrigins.includes(origin)) return callback(null, true);
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error(msg);
            return callback(new Error(msg), false);
        }
        // In development, restrict to known dev origins
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error(msg);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // If you need to handle cookies or authorization headers
};

// Configure static file serving for production
export const configureStaticServing = (app: Express, isProduction: boolean = false) => {
    if (isProduction) {
        // Determine base directory depending on whether we're running as a packaged binary (pkg) or Node
        const isPackaged = (process as any).pkg !== undefined;
        const baseDir = isPackaged
            ? path.dirname(process.execPath) // directory containing the packaged exe
            : process.cwd(); // server working directory during normal Node runs

        // Candidate locations for client/dist relative to the server directory
        const candidates = [
            path.resolve(baseDir, '..', 'client', 'dist'), // sibling client/dist (typical layout)
            path.resolve(baseDir, 'client', 'dist'),        // nested client/dist
        ];

        const clientBuildPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
        console.log(`Serving static files from: ${clientBuildPath}`);

        // Serve static files from the React app build directory
        app.use(express.static(clientBuildPath));

        // The "catchall" handler: for any request that doesn't
        // match one above, send back React's index.html file.
        app.get('*', (req, res) => {
            const indexPath = path.resolve(clientBuildPath, 'index.html');
            console.log(`Attempting to serve index.html from: ${indexPath}`);
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error('Error sending index.html:', err);
                    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                        res.status(404).send('Resource not found');
                    } else {
                        res.status(500).send('Internal Server Error');
                    }
                }
            });
        });
    }
};

// Server listening options
export const getListenOptions = (port: number, isProduction: boolean = false) => ({
    port,
    host: isProduction ? '0.0.0.0' : undefined, // Listen on all interfaces in prod
});

// Configure express middleware
export const configureMiddleware = (app: Express) => {
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions)); // Enable pre-flight requests for all routes
    app.use(express.json()); // Middleware to parse JSON bodies
};

// Configure logging
export const configureLogging = (isProduction: boolean = false) => {
    if (isProduction) {
        // Add production logging configuration here
        // e.g., winston or other logging service setup
    } else {
        // Development logging
        console.log('Development logging enabled');
        console.log('[build-check] rounds/actions.ts auto-advance banner active');
    }
};

// Export server environment helper
export const isProduction = (): boolean => process.env.NODE_ENV === 'production' || (process as any).pkg !== undefined;

