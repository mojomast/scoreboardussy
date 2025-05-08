import { AppDataSource } from './connection';
import { Scoreboard, Team } from './entities';
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
 * Convert a database scoreboard entity to the application state format
 */
export const scoreboardEntityToState = async (scoreboard: Scoreboard): Promise<ScoreboardState> => {
  try {
    // Get the teams repository
    const teamRepository = AppDataSource.getRepository(Team);
    
    // Find teams for this scoreboard
    const teams = await teamRepository.find({ where: { scoreboardId: scoreboard._id } });
    
    // Find team1 and team2 by their id field
    const team1Entity = teams.find(team => team.id === 'team1');
    const team2Entity = teams.find(team => team.id === 'team2');
    
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
      team1: team1Entity ? {
        id: 'team1',
        name: team1Entity.name,
        color: team1Entity.color,
        score: team1Entity.score,
        penalties: {
          major: team1Entity.penalties.major,
          minor: team1Entity.penalties.minor
        }
      } : defaultTeam1,
      team2: team2Entity ? {
        id: 'team2',
        name: team2Entity.name,
        color: team2Entity.color,
        score: team2Entity.score,
        penalties: {
          major: team2Entity.penalties.major,
          minor: team2Entity.penalties.minor
        }
      } : defaultTeam2,
      logoUrl: scoreboard.logoUrl,
      logoSize: scoreboard.logoSize,
      titleText: scoreboard.titleText,
      footerText: scoreboard.footerText,
      titleTextColor: scoreboard.titleTextColor,
      titleTextSize: scoreboard.titleTextSize,
      footerTextColor: scoreboard.footerTextColor,
      footerTextSize: scoreboard.footerTextSize,
      showScore: scoreboard.showScore,
      showPenalties: scoreboard.showPenalties,
      showEmojis: scoreboard.showEmojis,
      team1Emoji: team1Entity?.emoji || null,
      team2Emoji: team2Entity?.emoji || null
    };
    
    return state;
  } catch (error) {
    console.error('Error converting scoreboard entity to state:', error);
    return getDefaultState();
  }
};

/**
 * Get the current scoreboard from the database
 * If no scoreboard exists, create a default one
 */
export const getScoreboard = async (): Promise<ScoreboardState> => {
  try {
    // Get the scoreboard repository
    const scoreboardRepository = AppDataSource.getRepository(Scoreboard);
    
    // Find the most recently updated scoreboard
    const scoreboard = await scoreboardRepository.findOne({
      order: { updatedAt: 'DESC' }
    });
    
    // If no scoreboard exists, create a default one
    if (!scoreboard) {
      const newScoreboard = await createDefaultScoreboard();
      return await scoreboardEntityToState(newScoreboard);
    }
    
    // Convert to state format
    return await scoreboardEntityToState(scoreboard);
  } catch (error) {
    console.error('Error getting scoreboard from database:', error);
    // Return default state on error
    return getDefaultState();
  }
};

/**
 * Create a default scoreboard in the database
 */
export const createDefaultScoreboard = async (): Promise<Scoreboard> => {
  try {
    // Get repositories
    const scoreboardRepository = AppDataSource.getRepository(Scoreboard);
    const teamRepository = AppDataSource.getRepository(Team);
    
    // Create scoreboard
    const scoreboard = new Scoreboard();
    scoreboard.name = 'Default Scoreboard';
    scoreboard.logoUrl = null;
    scoreboard.logoSize = 50;
    scoreboard.titleText = '';
    scoreboard.footerText = null;
    scoreboard.titleTextColor = '#FFFFFF';
    scoreboard.titleTextSize = 2;
    scoreboard.footerTextColor = '#FFFFFF';
    scoreboard.footerTextSize = 1.25;
    scoreboard.showScore = true;
    scoreboard.showPenalties = true;
    scoreboard.showEmojis = true;
    
    // Save scoreboard to get an ID
    const savedScoreboard = await scoreboardRepository.save(scoreboard);
    
    // Create team1
    const team1 = new Team();
    team1.id = 'team1';
    team1.name = 'Blue Team';
    team1.color = '#3b82f6';
    team1.score = 0;
    team1.penalties = { major: 0, minor: 0 };
    team1.emoji = null;
    team1.scoreboardId = savedScoreboard._id;
    team1.scoreboard = savedScoreboard;
    
    // Create team2
    const team2 = new Team();
    team2.id = 'team2';
    team2.name = 'Red Team';
    team2.color = '#ef4444';
    team2.score = 0;
    team2.penalties = { major: 0, minor: 0 };
    team2.emoji = null;
    team2.scoreboardId = savedScoreboard._id;
    team2.scoreboard = savedScoreboard;
    
    // Save teams
    await teamRepository.save([team1, team2]);
    
    return savedScoreboard;
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
    // Get the scoreboard repository
    const scoreboardRepository = AppDataSource.getRepository(Scoreboard);
    
    // Find the most recently updated scoreboard
    const scoreboard = await scoreboardRepository.findOne({
      order: { updatedAt: 'DESC' }
    });
    
    // If no scoreboard exists, create a default one
    if (!scoreboard) {
      const newScoreboard = await createDefaultScoreboard();
      
      // Update the new scoreboard with state values
      await updateScoreboardFields(newScoreboard, state);
      
      // Update teams
      await updateTeam('team1', state.team1);
      await updateTeam('team2', state.team2);
      
      return await scoreboardEntityToState(newScoreboard);
    }
    
    // Update existing scoreboard
    await updateScoreboardFields(scoreboard, state);
    
    // Update teams
    await updateTeam('team1', state.team1);
    await updateTeam('team2', state.team2);
    
    // Return updated state
    return await scoreboardEntityToState(scoreboard);
  } catch (error) {
    console.error('Error updating scoreboard in database:', error);
    // Return the original state on error
    return state;
  }
};

/**
 * Helper function to update scoreboard fields
 */
const updateScoreboardFields = async (scoreboard: Scoreboard, state: ScoreboardState): Promise<void> => {
  // Get the scoreboard repository
  const scoreboardRepository = AppDataSource.getRepository(Scoreboard);
  
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
  
  await scoreboardRepository.save(scoreboard);
};

/**
 * Update a team in the database
 */
export const updateTeam = async (teamId: string, teamData: TeamType): Promise<void> => {
  try {
    // Get the team repository
    const teamRepository = AppDataSource.getRepository(Team);
    
    // Find team by id
    const team = await teamRepository.findOne({ where: { id: teamId } });
    
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
      await teamRepository.save(team);
    }
  } catch (error) {
    console.error(`Error updating team ${teamId} in database:`, error);
  }
};
