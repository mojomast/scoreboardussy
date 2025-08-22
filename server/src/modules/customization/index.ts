import { webhookService } from '../webhooks';

export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: TypographySettings;
  spacing: SpacingSettings;
  animations: AnimationSettings;
  isPublic: boolean;
  authorId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: number;
    regular: number;
    medium: number;
    bold: number;
    extraBold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface SpacingSettings {
  unit: string;
  scale: number[];
}

export interface AnimationSettings {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
}

export interface BrandingConfig {
  id: string;
  name: string;
  logo?: string;
  favicon?: string;
  customCSS?: string;
  customJS?: string;
  metaTags?: MetaTag[];
  socialLinks?: SocialLink[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetaTag {
  name: string;
  content: string;
  property?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  event: string;
  file: string;
  volume: number;
  isEnabled: boolean;
  createdAt: Date;
}

export interface AudioConfig {
  id: string;
  name: string;
  soundEffects: SoundEffect[];
  backgroundMusic?: string;
  backgroundVolume: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationConfig {
  id: string;
  name: string;
  type: 'entrance' | 'exit' | 'hover' | 'click' | 'transition';
  element: string;
  animation: string;
  duration: string;
  delay?: string;
  easing: string;
  isEnabled: boolean;
  createdAt: Date;
}

export interface VisualEffectsConfig {
  id: string;
  name: string;
  animations: AnimationConfig[];
  particleEffects?: ParticleEffect[];
  backgroundEffects?: BackgroundEffect[];
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticleEffect {
  type: 'confetti' | 'fireworks' | 'snow' | 'stars';
  trigger: 'score' | 'match_end' | 'round_start' | 'custom';
  intensity: number;
  duration: number;
  colors: string[];
}

export interface BackgroundEffect {
  type: 'gradient' | 'particles' | 'waves' | 'geometric';
  colors: string[];
  speed: number;
  intensity: number;
}

export interface CustomizationProfile {
  id: string;
  name: string;
  description?: string;
  theme: CustomTheme;
  branding?: BrandingConfig;
  audio?: AudioConfig;
  visualEffects?: VisualEffectsConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomizationServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ThemeService {
  private themes: Map<string, CustomTheme> = new Map();

  async createTheme(themeData: Omit<CustomTheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomizationServiceResult<CustomTheme>> {
    try {
      const theme: CustomTheme = {
        id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...themeData
      };

      this.themes.set(theme.id, theme);

      await webhookService.triggerEvent('theme.created', {
        themeId: theme.id,
        name: theme.name,
        isPublic: theme.isPublic
      });

      return { success: true, data: theme };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create theme'
      };
    }
  }

  async generateDefaultThemes(): Promise<CustomTheme[]> {
    const defaultThemes: Omit<CustomTheme, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Classic Dark',
        description: 'Traditional dark theme with high contrast',
        colors: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#8b5cf6',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f8fafc',
          textSecondary: '#cbd5e1',
          textInverse: '#0f172a',
          border: '#334155',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            xxl: '1.5rem'
          },
          fontWeight: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 700,
            extraBold: 900
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          unit: 'rem',
          scale: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24]
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }
        },
        isPublic: true,
        tags: ['dark', 'classic', 'professional']
      },
      {
        name: 'Ocean Blue',
        description: 'Calming blue theme inspired by ocean waves',
        colors: {
          primary: '#0ea5e9',
          secondary: '#06b6d4',
          accent: '#3b82f6',
          background: '#f0f9ff',
          surface: '#ffffff',
          text: '#0f172a',
          textSecondary: '#475569',
          textInverse: '#ffffff',
          border: '#cbd5e1',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#8b5cf6'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            xxl: '1.5rem'
          },
          fontWeight: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 700,
            extraBold: 900
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          unit: 'rem',
          scale: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24]
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }
        },
        isPublic: true,
        tags: ['light', 'blue', 'calming']
      }
    ];

    const createdThemes: CustomTheme[] = [];

    for (const themeData of defaultThemes) {
      const result = await this.createTheme(themeData);
      if (result.success && result.data) {
        createdThemes.push(result.data);
      }
    }

    return createdThemes;
  }

  getAllThemes(): CustomTheme[] {
    return Array.from(this.themes.values());
  }
}

export class AudioService {
  private configs: Map<string, AudioConfig> = new Map();

  async generateDefaultAudio(): Promise<AudioConfig> {
    const defaultSounds: SoundEffect[] = [
      {
        id: 'sound_score_increment',
        name: 'Score Increment',
        event: 'score.increment',
        file: 'score_increment.mp3',
        volume: 0.7,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: 'sound_round_start',
        name: 'Round Start',
        event: 'round.start',
        file: 'round_start.mp3',
        volume: 0.8,
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: 'sound_match_end',
        name: 'Match End',
        event: 'match.end',
        file: 'match_end.mp3',
        volume: 1.0,
        isEnabled: true,
        createdAt: new Date()
      }
    ];

    const audioConfig: AudioConfig = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Default Audio Pack',
      soundEffects: defaultSounds,
      backgroundVolume: 0.3,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.set(audioConfig.id, audioConfig);
    return audioConfig;
  }
}

export class VisualEffectsService {
  private configs: Map<string, VisualEffectsConfig> = new Map();

  async generateDefaultVisualEffects(): Promise<VisualEffectsConfig> {
    const defaultAnimations: AnimationConfig[] = [
      {
        id: 'anim_score_increment',
        name: 'Score Increment Animation',
        type: 'click',
        element: '.score-display',
        animation: 'bounce',
        duration: '0.3s',
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        isEnabled: true,
        createdAt: new Date()
      },
      {
        id: 'anim_match_end',
        name: 'Match End Celebration',
        type: 'entrance',
        element: '.match-result',
        animation: 'fadeInUp',
        duration: '0.8s',
        delay: '0.2s',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        isEnabled: true,
        createdAt: new Date()
      }
    ];

    const visualConfig: VisualEffectsConfig = {
      id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Default Visual Effects',
      animations: defaultAnimations,
      particleEffects: [
        {
          type: 'confetti',
          trigger: 'score',
          intensity: 0.5,
          duration: 2000,
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']
        }
      ],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.configs.set(visualConfig.id, visualConfig);
    return visualConfig;
  }
}

export class CustomizationService {
  private profiles: Map<string, CustomizationProfile> = new Map();

  constructor(
    public themes: ThemeService,
    public audio: AudioService,
    public visualEffects: VisualEffectsService
  ) {}

  async generateDefaultProfiles(): Promise<CustomizationProfile[]> {
    const defaultThemes = await this.themes.generateDefaultThemes();
    const defaultAudio = await this.audio.generateDefaultAudio();
    const defaultVisualEffects = await this.visualEffects.generateDefaultVisualEffects();

    const profiles: Omit<CustomizationProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Classic Professional',
        description: 'Clean, professional appearance with standard audio cues',
        theme: defaultThemes.find(t => t.name === 'Classic Dark')!,
        audio: defaultAudio,
        visualEffects: defaultVisualEffects,
        isActive: true
      },
      {
        name: 'Ocean Breeze',
        description: 'Calming blue theme with gentle animations',
        theme: defaultThemes.find(t => t.name === 'Ocean Blue')!,
        audio: defaultAudio,
        visualEffects: defaultVisualEffects,
        isActive: false
      }
    ];

    const createdProfiles: CustomizationProfile[] = [];

    for (const profileData of profiles) {
      const profile: CustomizationProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...profileData
      };

      this.profiles.set(profile.id, profile);
      createdProfiles.push(profile);
    }

    return createdProfiles;
  }

  getActiveProfile(): CustomizationProfile | undefined {
    return Array.from(this.profiles.values()).find(profile => profile.isActive);
  }

  async applyProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        return { success: false, error: 'Customization profile not found' };
      }

      // Deactivate all other profiles
      for (const [id, p] of this.profiles.entries()) {
        if (id !== profileId) {
          p.isActive = false;
        }
      }

      // Activate the selected profile
      profile.isActive = true;
      this.profiles.set(profileId, profile);

      // Trigger webhook event
      await webhookService.triggerEvent('customization.profile.applied', {
        profileId,
        name: profile.name
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply customization profile'
      };
    }
  }
}

// Export singleton instances
export const themeService = new ThemeService();
export const audioService = new AudioService();
export const visualEffectsService = new VisualEffectsService();

export const customizationService = new CustomizationService(
  themeService,
  audioService,
  visualEffectsService
);