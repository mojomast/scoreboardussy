import mongoose from 'mongoose';
import { Scoreboard, Team, ScoreboardDocument, TeamDocument } from './models';
import { ScoreboardState, Team as TeamType } from '../types';

/**
 * Get default state for fallback
 */
export const getDefaultState = (): ScoreboardState => {
  return {
    team1: {
      id: 'team1',
      name: 'Blue Team',
      color: '#3b82f6',
      score: 0,
      penalties: { major: 0, minor: 0 }
    },
    team2: {
      id: 'team2',
      name: 'Red Team',
      color: '#ef4444',
      score: 0,
      penalties: { major: 0, minor: 0 }
    },
    logoUrl: null,
    logoSize: 50,
    titleText: '',
    footerText: null,
    titleTextColor: '#FFFFFF',
    titleTextSize: 2,
    footerTextColor: '#FFFFFF',
    footerTextSize: 1.25,
    showScore: true,
    showPenalties: true,
    showEmojis: true,
    team1Emoji: null,
    team2Emoji: null
  };
};

/**
 * Convert a database scoreboard document to the application state format
 */
export const scoreboardDocToState = async (doc: ScoreboardDocument): Promise<ScoreboardState> => {
  try {
    // Populate teams
    await (doc as any).populate('teams');
    
    // Get teams from the populated document
    const teams = doc.teams as unknown as TeamDocument[];
    
    // Find team1 and team2 by their id field
    const team1Doc = teams.find(team => team.id === 'team1');
    const team2Doc = teams.find(team => team.id === 'team2');
    
    // Default team objects
    const defaultTeam1: TeamType = {
      id: 'team1',
      name: 'Blue Team',
      color: '#3b82f6',
      score: 0,
      penalties: { major: 0, minor: 0 }
    };
    
    const defaultTeam2: TeamType = {
      id: 'team2',
      name: 'Red Team',
      color: '#ef4444',
      score: 0,
      penalties: { major: 0, minor: 0 }
    };
    
    // Convert to state format
    const state: ScoreboardState = {
      team1: team1Doc ? {
        id: 'team1',
        name: team1Doc.name,
        color: team1Doc.color,
        score: team1Doc.score,
        penalties: {
          major: team1Doc.penalties.major,
          minor: team1Doc.penalties.minor
        }
      } : defaultTeam1,
      team2: team2Doc ? {
        id: 'team2',
        name: team2Doc.name,
        color: team2Doc.color,
        score: team2Doc.score,
        penalties: {
          major: team2Doc.penalties.major,
          minor: team2Doc.penalties.minor
        }
      } : defaultTeam2,
      logoUrl: doc.logoUrl,
      logoSize: doc.logoSize,
      titleText: doc.titleText,
      footerText: doc.footerText,
      titleTextColor: doc.titleTextColor,
      titleTextSize: doc.titleTextSize,
      footerTextColor: doc.footerTextColor,
      footerTextSize: doc.footerTextSize,
      showScore: doc.showScore,
      showPenalties: doc.showPenalties,
      showEmojis: doc.showEmojis,
      team1Emoji: team1Doc?.emoji || null,
      team2Emoji: team2Doc?.emoji || null
    };
    
    return state;
  } catch (error) {
    console.error('Error converting scoreboard document to state:', error);
    return getDefaultState();
  }
};

/**
 * Get the current scoreboard from the database
 * If no scoreboard exists, create a default one
 */
export const getScoreboard = async (): Promise<ScoreboardState> => {
  try {
    // Find the most recently updated scoreboard
    const scoreboard = await Scoreboard.findOne().sort({ updatedAt: -1 });
    
    // If no scoreboard exists, create a default one
    if (!scoreboard) {
      const newScoreboard = await createDefaultScoreboard();
      return await scoreboardDocToState(newScoreboard);
    }
    
    // Convert to state format
    return await scoreboardDocToState(scoreboard as ScoreboardDocument);
  } catch (error) {
    console.error('Error getting scoreboard from database:', error);
    // Return default state on error
    return getDefaultState();
  }
};

/**
 * Create a default scoreboard in the database
 */
export const createDefaultScoreboard = async (): Promise<ScoreboardDocument> => {
  try {
    // Create team1
    const team1 = await Team.create({
      id: 'team1',
      name: 'Blue Team',
      color: '#3b82f6',
      score: 0,
      penalties: { major: 0, minor: 0 },
      emoji: null
    });
    
    // Create team2
    const team2 = await Team.create({
      id: 'team2',
      name: 'Red Team',
      color: '#ef4444',
      score: 0,
      penalties: { major: 0, minor: 0 },
      emoji: null
    });
    
    // Create scoreboard
    const scoreboard = await Scoreboard.create({
      name: 'Default Scoreboard',
      teams: [team1._id, team2._id],
      logoUrl: null,
      logoSize: 50,
      titleText: '',
      footerText: null,
      titleTextColor: '#FFFFFF',
      titleTextSize: 2,
      footerTextColor: '#FFFFFF',
      footerTextSize: 1.25,
      showScore: true,
      showPenalties: true,
      showEmojis: true
    });
    
    // Update teams with reference to scoreboard
    await Team.updateMany(
      { _id: { $in: [team1._id, team2._id] } },
      { scoreboard: scoreboard._id }
    );
    
    return scoreboard as ScoreboardDocument;
  } catch (error) {
    console.error('Error creating default scoreboard:', error);
    throw error;
  }
};

/**
 * Update the scoreboard in the database
 */
export const updateScoreboard = async (state: ScoreboardState): Promise<ScoreboardState> => {
  try {
    // Find the most recently updated scoreboard
    const scoreboard = await Scoreboard.findOne().sort({ updatedAt: -1 });
    
    // If no scoreboard exists, create a default one
    if (!scoreboard) {
      const newScoreboard = await createDefaultScoreboard();
      
      // Update the new scoreboard with state values
      await updateScoreboardFields(newScoreboard, state);
      
      // Update teams
      await updateTeam('team1', state.team1);
      await updateTeam('team2', state.team2);
      
      return await scoreboardDocToState(newScoreboard);
    }
    
    // Update existing scoreboard
    await updateScoreboardFields(scoreboard as ScoreboardDocument, state);
    
    // Update teams
    await updateTeam('team1', state.team1);
    await updateTeam('team2', state.team2);
    
    // Return updated state
    return await scoreboardDocToState(scoreboard as ScoreboardDocument);
  } catch (error) {
    console.error('Error updating scoreboard in database:', error);
    // Return the original state on error
    return state;
  }
};

/**
 * Helper function to update scoreboard fields
 */
const updateScoreboardFields = async (scoreboard: ScoreboardDocument, state: ScoreboardState): Promise<void> => {
  scoreboard.logoUrl = state.logoUrl;
  scoreboard.logoSize = state.logoSize || 50;
  scoreboard.titleText = state.titleText || '';
  scoreboard.footerText = state.footerText;
  scoreboard.titleTextColor = state.titleTextColor;
  scoreboard.titleTextSize = state.titleTextSize;
  scoreboard.footerTextColor = state.footerTextColor;
  scoreboard.footerTextSize = state.footerTextSize;
  scoreboard.showScore = state.showScore !== undefined ? state.showScore : true;
  scoreboard.showPenalties = state.showPenalties !== undefined ? state.showPenalties : true;
  scoreboard.showEmojis = state.showEmojis;
  
  await scoreboard.save();
};

/**
 * Update a team in the database
 */
export const updateTeam = async (teamId: string, teamData: TeamType): Promise<void> => {
  try {
    // Find team by id
    const team = await Team.findOne({ id: teamId });
    
    if (team) {
      // Update team fields
      team.name = teamData.name;
      team.color = teamData.color;
      team.score = teamData.score;
      
      team.penalties = teamData.penalties;
      
      // Update emoji if it exists in the state
      if ('emoji' in teamData) {
        team.emoji = (teamData as any).emoji as 'hand' | 'fist' | null;
      }
      
      // Save team
      await team.save();
    }
  } catch (error) {
    console.error(`Error updating team ${teamId} in database:`, error);
  }
};
