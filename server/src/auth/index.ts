import express from 'express';
import { config } from '../config';

export const setupAuth = async (app: express.Application): Promise<void> => {
    // Basic authentication middleware
    app.use((req, res, next) => {
        // Skip auth for now
        next();
    });
};
