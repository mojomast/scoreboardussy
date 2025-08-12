import express, { Router, Request, Response } from 'express';
import {
    getState,
    updateScore,
    createStateBackup,
    restoreStateFromBackup,
    listStateBackups,
    persistState
} from '../state';

import monPacingRouter from './interop/monpacing';
import votingRouter from './voting';

// Create and configure the router
const router: Router = express.Router();

// Mount interop routes for mon-pacing
router.use('/interop/mon-pacing', monPacingRouter);
// Voting endpoints (audience + control)
router.use('/voting', votingRouter);

// GET /api/state - Get current scoreboard state
router.get('/state', (req: Request, res: Response) => {
    res.json(getState());
});

// GET /api/scoring-mode - Get current scoring mode
router.get('/scoring-mode', (req: Request, res: Response) => {
    const s = getState();
    res.json({ mode: s.scoringMode || 'round' });
});

// POST /api/scoring-mode - Set scoring mode
router.post('/scoring-mode', (req: Request, res: Response) => {
    try {
        const { mode } = req.body || {};
        if (mode !== 'round' && mode !== 'manual') {
            return res.status(400).json({ error: 'Invalid mode. Use "round" or "manual".' });
        }
        // Lazy import to avoid circulars in some bundlers
        const { updateState } = require('../state');
        updateState({ scoringMode: mode });
        res.json(getState());
    } catch (error) {
        console.error('Error setting scoring mode:', error);
        res.status(500).json({ error: 'Failed to set scoring mode' });
    }
});

// POST /api/score/:teamId/:action - Update team score
router.post('/score/:teamId/:action', (req: Request, res: Response) => {
    const { teamId, action } = req.params;
    
    // Validate parameters
    if ((teamId === 'team1' || teamId === 'team2') && 
        (action === 'increment' || action === 'decrement')) {
        updateScore(teamId, action);
        res.json(getState());
    } else {
        res.status(400).json({ 
            error: 'Invalid parameters',
            message: 'TeamId must be team1 or team2, action must be increment or decrement'
        });
    }
});

// GET /api/backup/list - List all available backups
router.get('/backup/list', async (req: Request, res: Response) => {
    try {
        const backups = await listStateBackups();
        res.json({
            success: true,
            backups: backups.map(backup => ({
                path: backup.path,
                date: backup.date,
                size: backup.size,
                filename: backup.path.split('/').pop() || backup.path.split('\\').pop()
            }))
        });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list backups',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/backup/create - Create a new backup
router.post('/backup/create', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const backupPath = await createStateBackup(name);
        
        if (backupPath) {
            res.json({
                success: true,
                message: 'Backup created successfully',
                path: backupPath,
                filename: backupPath.split('/').pop() || backupPath.split('\\').pop()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create backup'
            });
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create backup',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/backup/restore - Restore from a backup
router.post('/backup/restore', async (req: Request, res: Response) => {
    try {
        const { path } = req.body;
        
        if (!path) {
            return res.status(400).json({
                success: false,
                error: 'Backup path is required'
            });
        }
        
        const success = await restoreStateFromBackup(path);
        
        if (success) {
            res.json({
                success: true,
                message: 'State restored successfully',
                state: getState()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to restore from backup'
            });
        }
    } catch (error) {
        console.error('Error restoring from backup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore from backup',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/state/save - Force save current state
router.post('/state/save', async (req: Request, res: Response) => {
    try {
        const success = await persistState();
        
        if (success) {
            res.json({
                success: true,
                message: 'State saved successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save state'
            });
        }
    } catch (error) {
        console.error('Error saving state:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save state',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// Export the configured router
export default router;

