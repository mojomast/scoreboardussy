import { getPrisma } from '../db';
import { getState } from '../state';

export interface League {
  id: string;
  name: string;
  description?: string;
  season: string;
  startDate: Date;
  endDate: Date;
  teams: Team[];
  matches: Match[];
  standings: Standing[];
  settings: LeagueSettings;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  players: Player[];
  captainId?: string;
  contactInfo?: ContactInfo;
  stats: TeamStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'player' | 'captain' | 'alternate';
  stats: PlayerStats;
  availability: Availability[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledDate: Date;
  venue?: Venue;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: MatchScore;
  events: MatchEvent[];
  officials?: Official[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Standing {
  teamId: string;
  leagueId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface LeagueSettings {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  matchDuration: number; // minutes
  allowSelfScheduling: boolean;
  requireOfficials: boolean;
  notifications: NotificationSettings;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  emergencyContact?: string;
}

export interface TeamStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface PlayerStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  rating: number;
}

export interface Availability {
  date: Date;
  available: boolean;
  note?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  facilities?: string[];
}

export interface MatchScore {
  homeTeam: number;
  awayTeam: number;
  halfTimeHome?: number;
  halfTimeAway?: number;
  extraTimeHome?: number;
  extraTimeAway?: number;
  penaltiesHome?: number;
  penaltiesAway?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'other';
  minute: number;
  playerId?: string;
  teamId: string;
  description?: string;
  timestamp: Date;
}

export interface Official {
  id: string;
  name: string;
  role: 'referee' | 'assistant_referee' | 'fourth_official';
  certification?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  notifyMatchSchedule: boolean;
  notifyMatchResults: boolean;
  notifyStandingsUpdate: boolean;
  reminderHours: number;
}

export interface LeagueCreateInput {
  name: string;
  description?: string;
  season: string;
  startDate: Date;
  endDate: Date;
  settings?: Partial<LeagueSettings>;
}

export interface TeamCreateInput {
  name: string;
  leagueId: string;
  captainId?: string;
  contactInfo?: ContactInfo;
}

export interface MatchCreateInput {
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledDate: Date;
  venueId?: string;
}

export interface LeagueServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class LeagueService {
  private prisma = getPrisma();

  /**
   * Create a new league
   */
  async createLeague(input: LeagueCreateInput): Promise<LeagueServiceResult<League>> {
    try {
      const defaultSettings: LeagueSettings = {
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
        maxTeams: 12,
        minPlayersPerTeam: 5,
        maxPlayersPerTeam: 15,
        matchDuration: 90,
        allowSelfScheduling: false,
        requireOfficials: true,
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          notifyMatchSchedule: true,
          notifyMatchResults: true,
          notifyStandingsUpdate: true,
          reminderHours: 24
        }
      };

      const settings = { ...defaultSettings, ...input.settings };

      // For now, we'll store league data in memory since we don't have a database schema
      // In a real implementation, this would be stored in the database
      const league: League = {
        id: `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        description: input.description,
        season: input.season,
        startDate: input.startDate,
        endDate: input.endDate,
        teams: [],
        matches: [],
        standings: [],
        settings,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in memory for now (in production, this would be in database)
      this.storeLeague(league);

      return {
        success: true,
        data: league
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create league'
      };
    }
  }

  /**
   * Add a team to a league
   */
  async addTeamToLeague(input: TeamCreateInput): Promise<LeagueServiceResult<Team>> {
    try {
      const league = this.getLeague(input.leagueId);
      if (!league) {
        return {
          success: false,
          error: 'League not found'
        };
      }

      if (league.teams.length >= league.settings.maxTeams) {
        return {
          success: false,
          error: `League is full (${league.settings.maxTeams} teams maximum)`
        };
      }

      const team: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        leagueId: input.leagueId,
        players: [],
        captainId: input.captainId,
        contactInfo: input.contactInfo,
        stats: {
          matchesPlayed: 0,
          matchesWon: 0,
          matchesDrawn: 0,
          matchesLost: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      league.teams.push(team);
      this.updateLeague(league);

      return {
        success: true,
        data: team
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add team to league'
      };
    }
  }

  /**
   * Schedule a match between two teams
   */
  async scheduleMatch(input: MatchCreateInput): Promise<LeagueServiceResult<Match>> {
    try {
      const league = this.getLeague(input.leagueId);
      if (!league) {
        return {
          success: false,
          error: 'League not found'
        };
      }

      const homeTeam = league.teams.find(t => t.id === input.homeTeamId);
      const awayTeam = league.teams.find(t => t.id === input.awayTeamId);

      if (!homeTeam || !awayTeam) {
        return {
          success: false,
          error: 'One or both teams not found in league'
        };
      }

      // Check if teams are different
      if (homeTeam.id === awayTeam.id) {
        return {
          success: false,
          error: 'A team cannot play against itself'
        };
      }

      const match: Match = {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        leagueId: input.leagueId,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        scheduledDate: input.scheduledDate,
        status: 'scheduled',
        events: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      league.matches.push(match);
      this.updateLeague(league);

      return {
        success: true,
        data: match
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule match'
      };
    }
  }

  /**
   * Calculate and update league standings
   */
  async updateStandings(leagueId: string): Promise<LeagueServiceResult<Standing[]>> {
    try {
      const league = this.getLeague(leagueId);
      if (!league) {
        return {
          success: false,
          error: 'League not found'
        };
      }

      const standings: Standing[] = league.teams.map(team => {
        const teamMatches = league.matches.filter(
          match => (match.homeTeamId === team.id || match.awayTeamId === team.id) &&
                   match.status === 'completed' &&
                   match.score
        );

        let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

        teamMatches.forEach(match => {
          if (!match.score) return;

          const isHomeTeam = match.homeTeamId === team.id;
          const ourScore = isHomeTeam ? match.score.homeTeam : match.score.awayTeam;
          const theirScore = isHomeTeam ? match.score.awayTeam : match.score.homeTeam;

          goalsFor += ourScore;
          goalsAgainst += theirScore;

          if (ourScore > theirScore) won++;
          else if (ourScore === theirScore) drawn++;
          else lost++;
        });

        const played = teamMatches.length;
        const points = (won * league.settings.pointsForWin) +
                      (drawn * league.settings.pointsForDraw) +
                      (lost * league.settings.pointsForLoss);
        const goalDifference = goalsFor - goalsAgainst;

        return {
          teamId: team.id,
          leagueId: league.id,
          position: 0, // Will be calculated after sorting
          played,
          won,
          drawn,
          lost,
          points,
          goalDifference,
          goalsFor,
          goalsAgainst
        };
      });

      // Sort by points, then goal difference, then goals for
      standings.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Assign positions
      standings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      league.standings = standings;
      this.updateLeague(league);

      return {
        success: true,
        data: standings
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update standings'
      };
    }
  }

  /**
   * Get league standings
   */
  async getStandings(leagueId: string): Promise<LeagueServiceResult<Standing[]>> {
    try {
      const league = this.getLeague(leagueId);
      if (!league) {
        return {
          success: false,
          error: 'League not found'
        };
      }

      return {
        success: true,
        data: league.standings
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get standings'
      };
    }
  }

  /**
   * Generate match schedule for a league
   */
  async generateSchedule(leagueId: string): Promise<LeagueServiceResult<Match[]>> {
    try {
      const league = this.getLeague(leagueId);
      if (!league) {
        return {
          success: false,
          error: 'League not found'
        };
      }

      if (league.teams.length < 2) {
        return {
          success: false,
          error: 'Need at least 2 teams to generate a schedule'
        };
      }

      const matches: Match[] = [];
      const teams = [...league.teams];
      const startDate = league.startDate;

      // Simple round-robin scheduling
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const homeTeam = teams[i];
          const awayTeam = teams[j];

          // Schedule home and away matches
          const homeMatchDate = new Date(startDate);
          homeMatchDate.setDate(startDate.getDate() + (i * 7)); // One week apart

          const awayMatchDate = new Date(homeMatchDate);
          awayMatchDate.setDate(homeMatchDate.getDate() + (teams.length * 7)); // After all home matches

          const homeMatch: Match = {
            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            leagueId: league.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            scheduledDate: homeMatchDate,
            status: 'scheduled',
            events: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const awayMatch: Match = {
            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            leagueId: league.id,
            homeTeamId: awayTeam.id,
            awayTeamId: homeTeam.id,
            scheduledDate: awayMatchDate,
            status: 'scheduled',
            events: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          matches.push(homeMatch, awayMatch);
        }
      }

      league.matches = matches;
      this.updateLeague(league);

      return {
        success: true,
        data: matches
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate schedule'
      };
    }
  }

  // In-memory storage (replace with database in production)
  private leagues: Map<string, League> = new Map();

  private storeLeague(league: League): void {
    this.leagues.set(league.id, league);
  }

  private getLeague(id: string): League | undefined {
    return this.leagues.get(id);
  }

  private updateLeague(league: League): void {
    league.updatedAt = new Date();
    this.leagues.set(league.id, league);
  }
}

// Export singleton instance
export const leagueService = new LeagueService();