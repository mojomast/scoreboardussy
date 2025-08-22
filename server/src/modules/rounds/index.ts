import { getPrisma } from '../db';
import { getState, updateState } from '../state';

export interface RoundConfig {
  id: string;
  name: string;
  description?: string;
  category: RoundCategory;
  type: RoundType;
  duration: number; // seconds
  minPlayers: number;
  maxPlayers: number;
  rules: RoundRules;
  scoring: ScoringConfig;
  timeBasedChallenges?: TimeBasedChallenge[];
  audienceParticipation?: AudienceParticipationConfig;
  interactiveElements?: InteractiveElement[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RoundCategory =
  | 'warmup'
  | 'main'
  | 'special'
  | 'audience'
  | 'technical'
  | 'narrative';

export type RoundType =
  | 'scene'
  | 'character'
  | 'emotion'
  | 'genre'
  | 'prop'
  | 'location'
  | 'relationship'
  | 'time_period'
  | 'musical'
  | 'physical'
  | 'silent'
  | 'speed'
  | 'long_form'
  | 'custom';

export interface RoundRules {
  allowSuggestions: boolean;
  allowAudienceSuggestions: boolean;
  requireAllPlayers: boolean;
  allowSkipping: boolean;
  allowPausing: boolean;
  customRules: string[];
  restrictions: string[];
}

export interface ScoringConfig {
  method: 'manual' | 'automatic' | 'hybrid';
  criteria: ScoringCriteria[];
  maxScore: number;
  bonusPoints: BonusPoint[];
  penalties: Penalty[];
}

export interface ScoringCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  automated: boolean;
}

export interface BonusPoint {
  condition: string;
  points: number;
  description: string;
}

export interface Penalty {
  condition: string;
  points: number;
  description: string;
}

export interface TimeBasedChallenge {
  triggerTime: number; // seconds into round
  type: 'suggestion' | 'constraint' | 'twist' | 'bonus';
  content: string;
  duration?: number;
  points?: number;
}

export interface AudienceParticipationConfig {
  enabled: boolean;
  suggestionLimit: number;
  votingEnabled: boolean;
  realTimeSuggestions: boolean;
  categories: string[];
}

export interface InteractiveElement {
  type: 'timer' | 'sound' | 'light' | 'vibration' | 'text_prompt';
  trigger: 'time' | 'event' | 'manual';
  triggerTime?: number;
  triggerEvent?: string;
  content: string;
  duration?: number;
  intensity?: number;
}

export interface RoundTemplate {
  id: string;
  name: string;
  description: string;
  category: RoundCategory;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  baseConfig: Partial<RoundConfig>;
  variations: RoundVariation[];
  tags: string[];
  isPublic: boolean;
  authorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoundVariation {
  name: string;
  description: string;
  modifications: Record<string, any>;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface RoundSession {
  id: string;
  roundConfigId: string;
  roomCode: string;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  currentTime: number; // seconds elapsed
  players: RoundPlayer[];
  audienceSuggestions: AudienceSuggestion[];
  timeBasedChallenges: ActiveChallenge[];
  interactiveElements: ActiveElement[];
  scores: RoundScore[];
  events: RoundEvent[];
}

export interface RoundPlayer {
  id: string;
  userId?: string;
  name: string;
  role: 'player' | 'captain' | 'audience';
  status: 'active' | 'eliminated' | 'waiting';
  joinedAt: Date;
}

export interface AudienceSuggestion {
  id: string;
  content: string;
  category: string;
  submittedBy: string;
  timestamp: Date;
  votes: number;
  used: boolean;
}

export interface ActiveChallenge {
  challenge: TimeBasedChallenge;
  triggeredAt: number;
  completed: boolean;
  result?: any;
}

export interface ActiveElement {
  element: InteractiveElement;
  triggeredAt: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface RoundScore {
  id: string;
  playerId: string;
  criteria: string;
  score: number;
  awardedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface RoundEvent {
  id: string;
  type: 'start' | 'pause' | 'resume' | 'end' | 'challenge' | 'interaction' | 'score' | 'player_join' | 'player_leave';
  timestamp: Date;
  data: any;
}

export interface RoundCreateInput {
  name: string;
  description?: string;
  category: RoundCategory;
  type: RoundType;
  duration: number;
  minPlayers: number;
  maxPlayers: number;
  rules?: Partial<RoundRules>;
  scoring?: Partial<ScoringConfig>;
  timeBasedChallenges?: TimeBasedChallenge[];
  audienceParticipation?: Partial<AudienceParticipationConfig>;
  interactiveElements?: InteractiveElement[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  tags?: string[];
}

export interface RoundTemplateCreateInput {
  name: string;
  description: string;
  category: RoundCategory;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  baseConfig: Partial<RoundConfig>;
  variations?: RoundVariation[];
  tags?: string[];
  isPublic?: boolean;
}

export class RoundConfigService {
  private prisma = getPrisma();

  /**
   * Create a new round configuration
   */
  async createRoundConfig(input: RoundCreateInput): Promise<RoundConfig> {
    const defaultRules: RoundRules = {
      allowSuggestions: true,
      allowAudienceSuggestions: false,
      requireAllPlayers: true,
      allowSkipping: false,
      allowPausing: true,
      customRules: [],
      restrictions: []
    };

    const defaultScoring: ScoringConfig = {
      method: 'manual',
      criteria: [
        { name: 'creativity', description: 'Originality and imagination', weight: 0.3, automated: false },
        { name: 'humor', description: 'Comedy and entertainment value', weight: 0.3, automated: false },
        { name: 'performance', description: 'Acting and delivery', weight: 0.4, automated: false }
      ],
      maxScore: 10,
      bonusPoints: [],
      penalties: []
    };

    const config: RoundConfig = {
      id: `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: input.name,
      description: input.description,
      category: input.category,
      type: input.type,
      duration: input.duration,
      minPlayers: input.minPlayers,
      maxPlayers: input.maxPlayers,
      rules: { ...defaultRules, ...input.rules },
      scoring: { ...defaultScoring, ...input.scoring },
      timeBasedChallenges: input.timeBasedChallenges || [],
      audienceParticipation: input.audienceParticipation ? {
        enabled: false,
        suggestionLimit: 5,
        votingEnabled: false,
        realTimeSuggestions: false,
        categories: ['character', 'location', 'prop', 'emotion'],
        ...input.audienceParticipation
      } : undefined,
      interactiveElements: input.interactiveElements || [],
      difficulty: input.difficulty || 'medium',
      tags: input.tags || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In production, this would be saved to database
    this.storeRoundConfig(config);

    return config;
  }

  /**
   * Create a round template
   */
  async createRoundTemplate(input: RoundTemplateCreateInput): Promise<RoundTemplate> {
    const template: RoundTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: input.name,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      baseConfig: input.baseConfig,
      variations: input.variations || [],
      tags: input.tags || [],
      isPublic: input.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In production, this would be saved to database
    this.storeRoundTemplate(template);

    return template;
  }

  /**
   * Get all available round configurations
   */
  async getRoundConfigs(category?: RoundCategory, difficulty?: string): Promise<RoundConfig[]> {
    // In production, this would query the database
    const allConfigs = Array.from(this.roundConfigs.values());

    return allConfigs.filter(config => {
      if (category && config.category !== category) return false;
      if (difficulty && config.difficulty !== difficulty) return false;
      return true;
    });
  }

  /**
   * Get all round templates
   */
  async getRoundTemplates(category?: RoundCategory, tags?: string[]): Promise<RoundTemplate[]> {
    // In production, this would query the database
    const allTemplates = Array.from(this.roundTemplates.values());

    return allTemplates.filter(template => {
      if (category && template.category !== category) return false;
      if (tags && !tags.some(tag => template.tags.includes(tag))) return false;
      return true;
    });
  }

  /**
   * Start a round session
   */
  async startRoundSession(roomCode: string, roundConfigId: string): Promise<RoundSession> {
    const config = this.getRoundConfig(roundConfigId);
    if (!config) {
      throw new Error('Round configuration not found');
    }

    const session: RoundSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roundConfigId,
      roomCode,
      status: 'preparing',
      currentTime: 0,
      players: [],
      audienceSuggestions: [],
      timeBasedChallenges: [],
      interactiveElements: [],
      scores: [],
      events: [{
        id: `event_${Date.now()}`,
        type: 'start',
        timestamp: new Date(),
        data: { configId: roundConfigId }
      }]
    };

    // Store session
    this.storeRoundSession(session);

    return session;
  }

  /**
   * Update round session (time, events, etc.)
   */
  async updateRoundSession(sessionId: string, updates: Partial<RoundSession>): Promise<RoundSession> {
    const session = this.getRoundSession(sessionId);
    if (!session) {
      throw new Error('Round session not found');
    }

    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.storeRoundSession(updatedSession);

    return updatedSession;
  }

  /**
   * Add audience suggestion
   */
  async addAudienceSuggestion(sessionId: string, suggestion: Omit<AudienceSuggestion, 'id' | 'timestamp' | 'votes' | 'used'>): Promise<AudienceSuggestion> {
    const session = this.getRoundSession(sessionId);
    if (!session) {
      throw new Error('Round session not found');
    }

    const newSuggestion: AudienceSuggestion = {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      votes: 0,
      used: false,
      ...suggestion
    };

    session.audienceSuggestions.push(newSuggestion);
    this.updateRoundSession(sessionId, session);

    return newSuggestion;
  }

  /**
   * Submit score for a player
   */
  async submitScore(sessionId: string, score: Omit<RoundScore, 'id' | 'timestamp'>): Promise<RoundScore> {
    const session = this.getRoundSession(sessionId);
    if (!session) {
      throw new Error('Round session not found');
    }

    const newScore: RoundScore = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...score
    };

    session.scores.push(newScore);
    this.updateRoundSession(sessionId, session);

    return newScore;
  }

  /**
   * Generate popular round templates
   */
  async generateDefaultTemplates(): Promise<RoundTemplate[]> {
    const templates: RoundTemplateCreateInput[] = [
      {
        name: 'Classic Scene',
        description: 'Traditional improv scene with two players',
        category: 'main',
        difficulty: 'easy',
        baseConfig: {
          name: 'Classic Scene',
          category: 'main',
          type: 'scene',
          duration: 180,
          minPlayers: 2,
          maxPlayers: 2,
          rules: {
            allowSuggestions: true,
            allowAudienceSuggestions: false,
            requireAllPlayers: true,
            allowSkipping: false,
            allowPausing: true,
            customRules: ['Start with a relationship', 'Build to a clear ending'],
            restrictions: []
          },
          scoring: {
            method: 'manual',
            criteria: [
              { name: 'relationship', description: 'Clear character relationship', weight: 0.4, automated: false },
              { name: 'story', description: 'Complete story arc', weight: 0.3, automated: false },
              { name: 'humor', description: 'Comedy and entertainment', weight: 0.3, automated: false }
            ],
            maxScore: 10,
            bonusPoints: [],
            penalties: []
          }
        },
        tags: ['classic', 'scene', 'duo']
      },
      {
        name: 'Genre Switch',
        description: 'Scene that switches genres at timed intervals',
        category: 'special',
        difficulty: 'medium',
        baseConfig: {
          name: 'Genre Switch',
          category: 'special',
          type: 'genre',
          duration: 240,
          minPlayers: 2,
          maxPlayers: 4,
          timeBasedChallenges: [
            { triggerTime: 60, type: 'twist', content: 'Switch to romantic comedy', duration: 10 },
            { triggerTime: 120, type: 'twist', content: 'Switch to action film', duration: 10 },
            { triggerTime: 180, type: 'twist', content: 'Switch to horror movie', duration: 10 }
          ]
        },
        tags: ['genre', 'switch', 'timed', 'challenge']
      },
      {
        name: 'Audience Suggestion Round',
        description: 'Round driven by live audience suggestions',
        category: 'audience',
        difficulty: 'hard',
        baseConfig: {
          name: 'Audience Suggestion Round',
          category: 'audience',
          type: 'custom',
          duration: 300,
          minPlayers: 3,
          maxPlayers: 6,
          audienceParticipation: {
            enabled: true,
            suggestionLimit: 10,
            votingEnabled: true,
            realTimeSuggestions: true,
            categories: ['character', 'location', 'situation', 'emotion', 'object']
          }
        },
        tags: ['audience', 'suggestions', 'interactive', 'voting']
      }
    ];

    const createdTemplates: RoundTemplate[] = [];

    for (const templateInput of templates) {
      const template = await this.createRoundTemplate(templateInput);
      createdTemplates.push(template);
    }

    return createdTemplates;
  }

  // In-memory storage (replace with database in production)
  private roundConfigs: Map<string, RoundConfig> = new Map();
  private roundTemplates: Map<string, RoundTemplate> = new Map();
  private roundSessions: Map<string, RoundSession> = new Map();

  private storeRoundConfig(config: RoundConfig): void {
    this.roundConfigs.set(config.id, config);
  }

  private getRoundConfig(id: string): RoundConfig | undefined {
    return this.roundConfigs.get(id);
  }

  private storeRoundTemplate(template: RoundTemplate): void {
    this.roundTemplates.set(template.id, template);
  }

  private getRoundTemplate(id: string): RoundTemplate | undefined {
    return this.roundTemplates.get(id);
  }

  private storeRoundSession(session: RoundSession): void {
    this.roundSessions.set(session.id, session);
  }

  private getRoundSession(id: string): RoundSession | undefined {
    return this.roundSessions.get(id);
  }
}

// Export singleton instance
export const roundConfigService = new RoundConfigService();