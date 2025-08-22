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
import { backupService } from '../backup';
import { leagueService } from '../league';
import { roundConfigService } from '../rounds';
import { webhookService, apiService } from '../webhooks';
import { integrationManager } from '../integrations';
import { customizationService } from '../customization';

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

// === ENHANCED BACKUP ENDPOINTS (Database-level backups) ===

// GET /api/database/backup/list - List database backups
router.get('/database/backup/list', async (req: Request, res: Response) => {
    try {
        const backups = await backupService.listBackups();
        res.json({
            success: true,
            backups: backups.map(backup => ({
                filename: backup.filename,
                size: backup.size,
                created: backup.created.toISOString(),
                metadata: backup.metadata
            }))
        });
    } catch (error) {
        console.error('Error listing database backups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list database backups',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/database/backup/create - Create database backup
router.post('/database/backup/create', async (req: Request, res: Response) => {
    try {
        const {
            includeSnapshots = false,
            compress = true,
            retentionDays = 30
        } = req.body;

        const result = await backupService.createBackup({
            includeSnapshots,
            compress,
            retentionDays
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Database backup created successfully',
                backup: {
                    filePath: result.filePath,
                    size: result.size,
                    timestamp: result.timestamp.toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to create database backup'
            });
        }
    } catch (error) {
        console.error('Error creating database backup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create database backup',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/database/backup/restore - Restore from database backup
router.post('/database/backup/restore', async (req: Request, res: Response) => {
    try {
        const { backupFilePath } = req.body;

        if (!backupFilePath) {
            return res.status(400).json({
                success: false,
                error: 'Backup file path is required'
            });
        }

        const result = await backupService.restoreBackup(backupFilePath);

        if (result.success) {
            res.json({
                success: true,
                message: 'Database restored successfully',
                recordsRestored: result.recordsRestored
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to restore database'
            });
        }
    } catch (error) {
        console.error('Error restoring database backup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore database backup',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === LEAGUE MANAGEMENT ENDPOINTS ===

// POST /api/league/create - Create a new league
router.post('/league/create', async (req: Request, res: Response) => {
    try {
        const { name, description, season, startDate, endDate, settings } = req.body;

        if (!name || !season || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Name, season, startDate, and endDate are required'
            });
        }

        const result = await leagueService.createLeague({
            name,
            description,
            season,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            settings
        });

        if (result.success && result.data) {
            res.json({
                success: true,
                message: 'League created successfully',
                league: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to create league'
            });
        }
    } catch (error) {
        console.error('Error creating league:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create league',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/league/:leagueId/team/add - Add team to league
router.post('/league/:leagueId/team/add', async (req: Request, res: Response) => {
    try {
        const { leagueId } = req.params;
        const { name, captainId, contactInfo } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Team name is required'
            });
        }

        const result = await leagueService.addTeamToLeague({
            name,
            leagueId,
            captainId,
            contactInfo
        });

        if (result.success && result.data) {
            res.json({
                success: true,
                message: 'Team added to league successfully',
                team: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to add team to league'
            });
        }
    } catch (error) {
        console.error('Error adding team to league:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add team to league',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/league/:leagueId/match/schedule - Schedule a match
router.post('/league/:leagueId/match/schedule', async (req: Request, res: Response) => {
    try {
        const { leagueId } = req.params;
        const { homeTeamId, awayTeamId, scheduledDate, venueId } = req.body;

        if (!homeTeamId || !awayTeamId || !scheduledDate) {
            return res.status(400).json({
                success: false,
                error: 'Home team ID, away team ID, and scheduled date are required'
            });
        }

        const result = await leagueService.scheduleMatch({
            leagueId,
            homeTeamId,
            awayTeamId,
            scheduledDate: new Date(scheduledDate),
            venueId
        });

        if (result.success && result.data) {
            res.json({
                success: true,
                message: 'Match scheduled successfully',
                match: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to schedule match'
            });
        }
    } catch (error) {
        console.error('Error scheduling match:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule match',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/league/:leagueId/schedule/generate - Generate league schedule
router.post('/league/:leagueId/schedule/generate', async (req: Request, res: Response) => {
    try {
        const { leagueId } = req.params;

        const result = await leagueService.generateSchedule(leagueId);

        if (result.success && result.data) {
            res.json({
                success: true,
                message: 'Schedule generated successfully',
                matches: result.data,
                totalMatches: result.data.length
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to generate schedule'
            });
        }
    } catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate schedule',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/league/:leagueId/standings - Get league standings
router.get('/league/:leagueId/standings', async (req: Request, res: Response) => {
    try {
        const { leagueId } = req.params;

        const result = await leagueService.getStandings(leagueId);

        if (result.success && result.data) {
            res.json({
                success: true,
                standings: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to get standings'
            });
        }
    } catch (error) {
        console.error('Error getting standings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get standings',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/league/:leagueId/standings/update - Update league standings
router.post('/league/:leagueId/standings/update', async (req: Request, res: Response) => {
    try {
        const { leagueId } = req.params;

        const result = await leagueService.updateStandings(leagueId);

        if (result.success && result.data) {
            res.json({
                success: true,
                message: 'Standings updated successfully',
                standings: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to update standings'
            });
        }
    } catch (error) {
        console.error('Error updating standings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update standings',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === DYNAMIC ROUND CONFIGURATION ENDPOINTS ===

// POST /api/rounds/config/create - Create a new round configuration
router.post('/rounds/config/create', async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            category,
            type,
            duration,
            minPlayers,
            maxPlayers,
            rules,
            scoring,
            timeBasedChallenges,
            audienceParticipation,
            interactiveElements,
            difficulty,
            tags
        } = req.body;

        if (!name || !category || !type || !duration || !minPlayers || !maxPlayers) {
            return res.status(400).json({
                success: false,
                error: 'Name, category, type, duration, minPlayers, and maxPlayers are required'
            });
        }

        const config = await roundConfigService.createRoundConfig({
            name,
            description,
            category,
            type,
            duration,
            minPlayers,
            maxPlayers,
            rules,
            scoring,
            timeBasedChallenges,
            audienceParticipation,
            interactiveElements,
            difficulty,
            tags
        });

        res.json({
            success: true,
            message: 'Round configuration created successfully',
            config
        });
    } catch (error) {
        console.error('Error creating round configuration:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create round configuration',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/rounds/config/list - Get all round configurations
router.get('/rounds/config/list', async (req: Request, res: Response) => {
    try {
        const { category, difficulty } = req.query;

        const configs = await roundConfigService.getRoundConfigs(
            category as any,
            difficulty as string
        );

        res.json({
            success: true,
            configs
        });
    } catch (error) {
        console.error('Error getting round configurations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get round configurations',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/rounds/template/create - Create a round template
router.post('/rounds/template/create', async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            category,
            difficulty,
            baseConfig,
            variations,
            tags,
            isPublic
        } = req.body;

        if (!name || !description || !category || !difficulty || !baseConfig) {
            return res.status(400).json({
                success: false,
                error: 'Name, description, category, difficulty, and baseConfig are required'
            });
        }

        const template = await roundConfigService.createRoundTemplate({
            name,
            description,
            category,
            difficulty,
            baseConfig,
            variations,
            tags,
            isPublic
        });

        res.json({
            success: true,
            message: 'Round template created successfully',
            template
        });
    } catch (error) {
        console.error('Error creating round template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create round template',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/rounds/template/list - Get all round templates
router.get('/rounds/template/list', async (req: Request, res: Response) => {
    try {
        const { category, tags } = req.query;

        const templates = await roundConfigService.getRoundTemplates(
            category as any,
            tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined
        );

        res.json({
            success: true,
            templates
        });
    } catch (error) {
        console.error('Error getting round templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get round templates',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/rounds/session/start - Start a round session
router.post('/rounds/session/start', async (req: Request, res: Response) => {
    try {
        const { roomCode, roundConfigId } = req.body;

        if (!roomCode || !roundConfigId) {
            return res.status(400).json({
                success: false,
                error: 'Room code and round configuration ID are required'
            });
        }

        const session = await roundConfigService.startRoundSession(roomCode, roundConfigId);

        res.json({
            success: true,
            message: 'Round session started successfully',
            session
        });
    } catch (error) {
        console.error('Error starting round session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start round session',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/rounds/session/:sessionId/suggestion - Add audience suggestion
router.post('/rounds/session/:sessionId/suggestion', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { content, category, submittedBy } = req.body;

        if (!content || !category || !submittedBy) {
            return res.status(400).json({
                success: false,
                error: 'Content, category, and submittedBy are required'
            });
        }

        const suggestion = await roundConfigService.addAudienceSuggestion(sessionId, {
            content,
            category,
            submittedBy
        });

        res.json({
            success: true,
            message: 'Audience suggestion added successfully',
            suggestion
        });
    } catch (error) {
        console.error('Error adding audience suggestion:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add audience suggestion',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/rounds/session/:sessionId/score - Submit score
router.post('/rounds/session/:sessionId/score', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { playerId, criteria, score, awardedBy, notes } = req.body;

        if (!playerId || !criteria || typeof score !== 'number' || !awardedBy) {
            return res.status(400).json({
                success: false,
                error: 'Player ID, criteria, score, and awardedBy are required'
            });
        }

        const scoreResult = await roundConfigService.submitScore(sessionId, {
            playerId,
            criteria,
            score,
            awardedBy,
            notes
        });

        res.json({
            success: true,
            message: 'Score submitted successfully',
            score: scoreResult
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit score',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/rounds/templates/generate-default - Generate default templates
router.post('/rounds/templates/generate-default', async (req: Request, res: Response) => {
    try {
        const templates = await roundConfigService.generateDefaultTemplates();

        res.json({
            success: true,
            message: 'Default templates generated successfully',
            templates,
            count: templates.length
        });
    } catch (error) {
        console.error('Error generating default templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate default templates',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === WEBHOOK MANAGEMENT ENDPOINTS ===

// POST /api/webhooks/create - Create a new webhook
router.post('/webhooks/create', async (req: Request, res: Response) => {
    try {
        const { url, name, description, events, retryCount, timeout, headers } = req.body;

        if (!url || !name || !events || !Array.isArray(events)) {
            return res.status(400).json({
                success: false,
                error: 'URL, name, and events array are required'
            });
        }

        const webhook = await webhookService.createWebhook({
            url,
            name,
            description,
            events,
            retryCount: retryCount || 3,
            timeout: timeout || 10000,
            headers,
            isActive: true
        });

        res.json({
            success: true,
            message: 'Webhook created successfully',
            webhook: {
                id: webhook.id,
                url: webhook.url,
                name: webhook.name,
                events: webhook.events,
                isActive: webhook.isActive,
                secret: webhook.secret // Only returned on creation
            }
        });
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create webhook',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/webhooks/list - Get all webhooks
router.get('/webhooks/list', async (req: Request, res: Response) => {
    try {
        const webhooks = await webhookService.getWebhooks();

        res.json({
            success: true,
            webhooks: webhooks.map(webhook => ({
                id: webhook.id,
                url: webhook.url,
                name: webhook.name,
                description: webhook.description,
                events: webhook.events,
                isActive: webhook.isActive,
                retryCount: webhook.retryCount,
                timeout: webhook.timeout,
                lastTriggered: webhook.lastTriggered,
                failureCount: webhook.failureCount
            }))
        });
    } catch (error) {
        console.error('Error getting webhooks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get webhooks',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// PUT /api/webhooks/:webhookId - Update webhook
router.put('/webhooks/:webhookId', async (req: Request, res: Response) => {
    try {
        const { webhookId } = req.params;
        const updates = req.body;

        const webhook = await webhookService.updateWebhook(webhookId, updates);

        if (webhook) {
            res.json({
                success: true,
                message: 'Webhook updated successfully',
                webhook: {
                    id: webhook.id,
                    url: webhook.url,
                    name: webhook.name,
                    description: webhook.description,
                    events: webhook.events,
                    isActive: webhook.isActive,
                    retryCount: webhook.retryCount,
                    timeout: webhook.timeout
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update webhook',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// DELETE /api/webhooks/:webhookId - Delete webhook
router.delete('/webhooks/:webhookId', async (req: Request, res: Response) => {
    try {
        const { webhookId } = req.params;

        const deleted = await webhookService.deleteWebhook(webhookId);

        if (deleted) {
            res.json({
                success: true,
                message: 'Webhook deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete webhook',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/webhooks/:webhookId/test - Test webhook
router.post('/webhooks/:webhookId/test', async (req: Request, res: Response) => {
    try {
        const { webhookId } = req.params;

        const result = await webhookService.testWebhook(webhookId);

        res.json({
            success: result.success,
            message: result.success ? 'Webhook test successful' : 'Webhook test failed',
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            error: result.error
        });
    } catch (error) {
        console.error('Error testing webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test webhook',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/webhooks/stats - Get webhook statistics
router.get('/webhooks/stats', async (req: Request, res: Response) => {
    try {
        const stats = await webhookService.getWebhookStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting webhook stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get webhook statistics',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === API MANAGEMENT ENDPOINTS ===

// GET /api/docs - Get API documentation
router.get('/docs', (req: Request, res: Response) => {
    try {
        const docs = apiService.generateAPIDocs();

        res.setHeader('Content-Type', 'text/markdown');
        res.send(docs);
    } catch (error) {
        console.error('Error generating API docs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate API documentation',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/endpoints - Get all registered API endpoints
router.get('/endpoints', (req: Request, res: Response) => {
    try {
        const endpoints = apiService.getEndpoints();

        res.json({
            success: true,
            endpoints: endpoints.map(endpoint => ({
                id: endpoint.id,
                path: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                authentication: endpoint.authentication,
                rateLimit: endpoint.rateLimit,
                version: endpoint.version
            }))
        });
    } catch (error) {
        console.error('Error getting endpoints:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get API endpoints',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/events/trigger - Manually trigger webhook event (for testing)
router.post('/events/trigger', async (req: Request, res: Response) => {
    try {
        const { event, data, roomCode } = req.body;

        if (!event) {
            return res.status(400).json({
                success: false,
                error: 'Event name is required'
            });
        }

        await webhookService.triggerEvent(event, data, roomCode, 'server');

        res.json({
            success: true,
            message: 'Event triggered successfully'
        });
    } catch (error) {
        console.error('Error triggering event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger event',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === THIRD-PARTY INTEGRATIONS ENDPOINTS ===

// POST /api/integrations/social/post - Post to social media
router.post('/integrations/social/post', async (req: Request, res: Response) => {
    try {
        const { platform, content, mediaUrls, hashtags, scheduledTime } = req.body;

        if (!platform || !content) {
            return res.status(400).json({
                success: false,
                error: 'Platform and content are required'
            });
        }

        const post = {
            platform,
            content,
            mediaUrls,
            hashtags,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined
        };

        const result = await integrationManager.socialMedia.postToSocialMedia(post);

        res.json({
            success: result.success,
            message: result.success ? 'Post created successfully' : 'Failed to create post',
            postId: result.postId,
            url: result.url,
            error: result.error
        });
    } catch (error) {
        console.error('Error posting to social media:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to post to social media',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/social/match-summary - Generate match summary
router.post('/integrations/social/match-summary', async (req: Request, res: Response) => {
    try {
        const { roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({
                success: false,
                error: 'Room code is required'
            });
        }

        const post = integrationManager.socialMedia.generateMatchSummary(roomCode);
        const result = await integrationManager.socialMedia.postToSocialMedia(post);

        res.json({
            success: result.success,
            message: result.success ? 'Match summary posted successfully' : 'Failed to post match summary',
            postId: result.postId,
            url: result.url,
            error: result.error
        });
    } catch (error) {
        console.error('Error posting match summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to post match summary',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/video/start - Start video recording
router.post('/integrations/video/start', async (req: Request, res: Response) => {
    try {
        const { roomCode, provider, streamUrl, streamKey, title, description } = req.body;

        if (!roomCode || !provider) {
            return res.status(400).json({
                success: false,
                error: 'Room code and provider are required'
            });
        }

        const config = {
            enabled: true,
            provider,
            streamUrl,
            streamKey,
            title,
            description,
            privacy: 'public' as const
        };

        const result = await integrationManager.videoRecording.startRecording(roomCode, config);

        res.json({
            success: result.success,
            message: result.success ? 'Video recording started successfully' : 'Failed to start recording',
            streamId: result.streamId,
            url: result.url,
            error: result.error
        });
    } catch (error) {
        console.error('Error starting video recording:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start video recording',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/video/stop - Stop video recording
router.post('/integrations/video/stop', async (req: Request, res: Response) => {
    try {
        const { roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({
                success: false,
                error: 'Room code is required'
            });
        }

        const result = await integrationManager.videoRecording.stopRecording(roomCode);

        res.json({
            success: result.success,
            message: result.success ? 'Video recording stopped successfully' : 'Failed to stop recording',
            error: result.error
        });
    } catch (error) {
        console.error('Error stopping video recording:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop video recording',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/integrations/video/status/:roomCode - Get recording status
router.get('/integrations/video/status/:roomCode', (req: Request, res: Response) => {
    try {
        const { roomCode } = req.params;

        const status = integrationManager.videoRecording.getRecordingStatus(roomCode);

        res.json({
            success: true,
            isRecording: status.isRecording,
            config: status.config
        });
    } catch (error) {
        console.error('Error getting recording status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recording status',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/timer/connect - Connect external timer
router.post('/integrations/timer/connect', async (req: Request, res: Response) => {
    try {
        const { roomCode, provider, deviceId, syncInterval } = req.body;

        if (!roomCode || !provider) {
            return res.status(400).json({
                success: false,
                error: 'Room code and provider are required'
            });
        }

        const config = {
            enabled: true,
            provider,
            deviceId,
            syncInterval: syncInterval || 30000,
            offset: 0
        };

        const success = await integrationManager.externalTimer.connectExternalTimer(roomCode, config);

        res.json({
            success,
            message: success ? 'External timer connected successfully' : 'Failed to connect external timer'
        });
    } catch (error) {
        console.error('Error connecting external timer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect external timer',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/timer/disconnect - Disconnect external timer
router.post('/integrations/timer/disconnect', async (req: Request, res: Response) => {
    try {
        const { roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({
                success: false,
                error: 'Room code is required'
            });
        }

        const success = await integrationManager.externalTimer.disconnectExternalTimer(roomCode);

        res.json({
            success,
            message: success ? 'External timer disconnected successfully' : 'Failed to disconnect external timer'
        });
    } catch (error) {
        console.error('Error disconnecting external timer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disconnect external timer',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/integrations/timer/status/:roomCode - Get timer status
router.get('/integrations/timer/status/:roomCode', (req: Request, res: Response) => {
    try {
        const { roomCode } = req.params;

        const status = integrationManager.externalTimer.getTimerStatus(roomCode);

        res.json({
            success: true,
            isConnected: status.isConnected,
            config: status.config
        });
    } catch (error) {
        console.error('Error getting timer status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get timer status',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/iot/device/register - Register IoT device
router.post('/integrations/iot/device/register', async (req: Request, res: Response) => {
    try {
        const { name, type, protocol, endpoint, config } = req.body;

        if (!name || !type || !protocol || !endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Name, type, protocol, and endpoint are required'
            });
        }

        const device = {
            id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type,
            protocol,
            endpoint,
            config: config || {},
            isActive: true,
            lastSeen: new Date()
        };

        const success = await integrationManager.iot.registerDevice(device);

        res.json({
            success,
            message: success ? 'IoT device registered successfully' : 'Failed to register IoT device',
            deviceId: device.id
        });
    } catch (error) {
        console.error('Error registering IoT device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register IoT device',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/integrations/iot/device/:deviceId/command - Send command to IoT device
router.post('/integrations/iot/device/:deviceId/command', async (req: Request, res: Response) => {
    try {
        const { deviceId } = req.params;
        const { command, params } = req.body;

        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'Command is required'
            });
        }

        const result = await integrationManager.iot.sendDeviceCommand(deviceId, command, params);

        res.json({
            success: result.success,
            message: result.success ? 'Command sent successfully' : 'Failed to send command',
            response: result.response,
            error: result.error
        });
    } catch (error) {
        console.error('Error sending IoT command:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send IoT command',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/integrations/iot/devices - Get all IoT devices
router.get('/integrations/iot/devices', (req: Request, res: Response) => {
    try {
        const devices = integrationManager.iot.getDevices();

        res.json({
            success: true,
            devices
        });
    } catch (error) {
        console.error('Error getting IoT devices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get IoT devices',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/integrations/list - Get all integrations
router.get('/integrations/list', (req: Request, res: Response) => {
    try {
        const integrations = integrationManager.getIntegrations();

        res.json({
            success: true,
            integrations
        });
    } catch (error) {
        console.error('Error getting integrations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get integrations',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// === ADVANCED CUSTOMIZATION ENDPOINTS ===

// GET /api/customization/themes - Get all available themes
router.get('/customization/themes', (req: Request, res: Response) => {
    try {
        const themes = customizationService.themes.getAllThemes();

        res.json({
            success: true,
            themes
        });
    } catch (error) {
        console.error('Error getting themes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get themes',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/customization/themes/generate-default - Generate default themes
router.post('/customization/themes/generate-default', async (req: Request, res: Response) => {
    try {
        const themes = await customizationService.themes.generateDefaultThemes();

        res.json({
            success: true,
            message: 'Default themes generated successfully',
            themes,
            count: themes.length
        });
    } catch (error) {
        console.error('Error generating default themes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate default themes',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/customization/profiles - Get all customization profiles
router.get('/customization/profiles', (req: Request, res: Response) => {
    try {
        const profiles = Array.from(customizationService['profiles'].values());

        res.json({
            success: true,
            profiles
        });
    } catch (error) {
        console.error('Error getting customization profiles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get customization profiles',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/customization/profiles/generate-default - Generate default profiles
router.post('/customization/profiles/generate-default', async (req: Request, res: Response) => {
    try {
        const profiles = await customizationService.generateDefaultProfiles();

        res.json({
            success: true,
            message: 'Default customization profiles generated successfully',
            profiles,
            count: profiles.length
        });
    } catch (error) {
        console.error('Error generating default profiles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate default profiles',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// GET /api/customization/profiles/active - Get active customization profile
router.get('/customization/profiles/active', (req: Request, res: Response) => {
    try {
        const activeProfile = customizationService.getActiveProfile();

        if (activeProfile) {
            res.json({
                success: true,
                profile: activeProfile
            });
        } else {
            res.json({
                success: true,
                profile: null,
                message: 'No active customization profile'
            });
        }
    } catch (error) {
        console.error('Error getting active profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get active profile',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/customization/profiles/:profileId/apply - Apply customization profile
router.post('/customization/profiles/:profileId/apply', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.params;
        const result = await customizationService.applyProfile(profileId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Customization profile applied successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to apply customization profile'
            });
        }
    } catch (error) {
        console.error('Error applying customization profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to apply customization profile',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// Export the configured router
export default router;

