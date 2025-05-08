import mongoose from 'mongoose';
import { ScoreboardState, Team } from '../types';

// Define MongoDB schemas
const teamSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, required: true }
});

const matchupSchema = new mongoose.Schema({
    id: { type: String, required: true },
    players: [{ type: String, required: true }],
    scores: { type: Map, of: Number },
    timestamp: { type: Number, required: true }
});

const scoreboardStateSchema = new mongoose.Schema({
    teams: [teamSchema],
    currentMatchup: { type: matchupSchema, required: false },
    matchHistory: [matchupSchema]
});

// Create models
const TeamModel = mongoose.model('Team', teamSchema);
const ScoreboardStateModel = mongoose.model('ScoreboardState', scoreboardStateSchema);

const convertToScoreboardState = (doc: any): ScoreboardState => {
    return {
        teams: doc.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            score: team.score
        })),
        currentMatchup: doc.currentMatchup ? {
            id: doc.currentMatchup.id,
            players: doc.currentMatchup.players,
            scores: Object.fromEntries(doc.currentMatchup.scores),
            timestamp: doc.currentMatchup.timestamp
        } : null,
        matchHistory: doc.matchHistory.map((matchup: any) => ({
            id: matchup.id,
            players: matchup.players,
            scores: Object.fromEntries(matchup.scores),
            timestamp: matchup.timestamp
        }))
    };
};

export const saveState = async (state: ScoreboardState): Promise<void> => {
    try {
        await ScoreboardStateModel.findOneAndUpdate({}, state, { upsert: true });
    } catch (error) {
        console.error('Failed to save state:', error);
        throw error;
    }
};

export const loadState = async (): Promise<ScoreboardState | null> => {
    try {
        const doc = await ScoreboardStateModel.findOne().lean();
        return doc ? convertToScoreboardState(doc) : null;
    } catch (error) {
        console.error('Failed to load state:', error);
        throw error;
    }
};
