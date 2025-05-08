// Import and re-export all entities
import { Team } from './models/team.entity';
import { Scoreboard } from './models/scoreboard.entity';
import { User } from './models/user.entity';

// Export all entities
export { Team, Scoreboard, User };

// Type definitions for convenience
export type TeamType = Team;
export type ScoreboardType = Scoreboard;
export type UserType = User;
