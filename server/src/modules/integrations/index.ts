import { webhookService } from '../webhooks';
import { getState } from '../state';

export interface SocialMediaPost {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'discord';
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledTime?: Date;
}

export interface VideoRecordingConfig {
  enabled: boolean;
  provider: 'youtube' | 'twitch' | 'custom';
  streamUrl?: string;
  streamKey?: string;
  title?: string;
  description?: string;
  privacy?: 'public' | 'private' | 'unlisted';
}

export interface ExternalTimerConfig {
  enabled: boolean;
  provider: 'external' | 'iot' | 'custom';
  deviceId?: string;
  syncInterval: number; // milliseconds
  offset?: number; // time offset in milliseconds
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'timer' | 'light' | 'sound' | 'vibration' | 'custom';
  protocol: 'mqtt' | 'websocket' | 'http' | 'bluetooth';
  endpoint: string;
  config: Record<string, any>;
  isActive: boolean;
  lastSeen?: Date;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'social' | 'video' | 'timer' | 'iot' | 'custom';
  isEnabled: boolean;
  config: Record<string, any>;
  credentials?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialMediaResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface VideoStreamResult {
  success: boolean;
  streamId?: string;
  url?: string;
  error?: string;
}

export interface IoTCommandResult {
  success: boolean;
  response?: any;
  error?: string;
}

export class SocialMediaService {
  private configs: Map<string, IntegrationConfig> = new Map();

  /**
   * Post content to social media
   */
  async postToSocialMedia(post: SocialMediaPost): Promise<SocialMediaResult> {
    try {
      // In a real implementation, this would integrate with actual social media APIs
      console.log(`Posting to ${post.platform}:`, post.content);

      // Simulate API call
      const result: SocialMediaResult = {
        success: true,
        postId: `post_${Date.now()}`,
        url: `https://${post.platform}.com/post/${Date.now()}`
      };

      // Trigger webhook event
      await webhookService.triggerEvent('social.post.created', {
        platform: post.platform,
        content: post.content,
        mediaCount: post.mediaUrls?.length || 0,
        hashtags: post.hashtags
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Social media posting failed'
      };
    }
  }

  /**
   * Schedule social media post
   */
  async scheduleSocialPost(post: SocialMediaPost): Promise<SocialMediaResult> {
    try {
      if (!post.scheduledTime) {
        return this.postToSocialMedia(post);
      }

      const delay = post.scheduledTime.getTime() - Date.now();

      if (delay <= 0) {
        return this.postToSocialMedia(post);
      }

      setTimeout(() => {
        this.postToSocialMedia(post);
      }, delay);

      return {
        success: true,
        postId: `scheduled_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule post'
      };
    }
  }

  /**
   * Generate match summary for social media
   */
  generateMatchSummary(roomCode: string): SocialMediaPost {
    const state = getState();

    const summary = `🏆 Match Complete!\n\n` +
      `Team 1: ${state.team1?.score || 0}\n` +
      `Team 2: ${state.team2?.score || 0}\n\n` +
      `Room: ${roomCode}\n` +
      `#Improv #Scoreboard`;

    return {
      platform: 'twitter',
      content: summary,
      hashtags: ['Improv', 'Scoreboard', 'MatchResults']
    };
  }
}

export class VideoRecordingService {
  private configs: Map<string, VideoRecordingConfig> = new Map();

  /**
   * Start video recording/streaming
   */
  async startRecording(roomCode: string, config: VideoRecordingConfig): Promise<VideoStreamResult> {
    try {
      console.log(`Starting ${config.provider} recording for room ${roomCode}`);

      // In a real implementation, this would start actual video recording/streaming
      const streamResult: VideoStreamResult = {
        success: true,
        streamId: `stream_${Date.now()}`,
        url: config.provider === 'youtube' ? `https://youtube.com/watch?v=${Date.now()}` :
             config.provider === 'twitch' ? `https://twitch.tv/improv_room_${roomCode}` :
             config.streamUrl
      };

      // Store config for this room
      this.configs.set(roomCode, config);

      // Trigger webhook event
      await webhookService.triggerEvent('video.recording.started', {
        roomCode,
        provider: config.provider,
        streamId: streamResult.streamId,
        url: streamResult.url
      });

      return streamResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      };
    }
  }

  /**
   * Stop video recording/streaming
   */
  async stopRecording(roomCode: string): Promise<VideoStreamResult> {
    try {
      const config = this.configs.get(roomCode);
      if (!config) {
        return {
          success: false,
          error: 'No active recording found for this room'
        };
      }

      console.log(`Stopping ${config.provider} recording for room ${roomCode}`);

      // In a real implementation, this would stop the actual recording/streaming
      this.configs.delete(roomCode);

      // Trigger webhook event
      await webhookService.triggerEvent('video.recording.stopped', {
        roomCode,
        provider: config.provider
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording'
      };
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(roomCode: string): { isRecording: boolean; config?: VideoRecordingConfig } {
    const config = this.configs.get(roomCode);
    return {
      isRecording: !!config,
      config
    };
  }
}

export class ExternalTimerService {
  private configs: Map<string, ExternalTimerConfig> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Connect external timer device
   */
  async connectExternalTimer(roomCode: string, config: ExternalTimerConfig): Promise<boolean> {
    try {
      console.log(`Connecting external timer for room ${roomCode}:`, config.provider);

      // In a real implementation, this would establish connection to external timer
      this.configs.set(roomCode, config);

      // Start sync interval if configured
      if (config.syncInterval > 0) {
        const interval = setInterval(() => {
          this.syncTimer(roomCode);
        }, config.syncInterval);

        this.syncIntervals.set(roomCode, interval);
      }

      // Trigger webhook event
      await webhookService.triggerEvent('timer.external.connected', {
        roomCode,
        provider: config.provider,
        deviceId: config.deviceId
      });

      return true;
    } catch (error) {
      console.error('Failed to connect external timer:', error);
      return false;
    }
  }

  /**
   * Disconnect external timer
   */
  async disconnectExternalTimer(roomCode: string): Promise<boolean> {
    try {
      const config = this.configs.get(roomCode);
      if (!config) return true;

      // Clear sync interval
      const interval = this.syncIntervals.get(roomCode);
      if (interval) {
        clearInterval(interval);
        this.syncIntervals.delete(roomCode);
      }

      console.log(`Disconnecting external timer for room ${roomCode}`);
      this.configs.delete(roomCode);

      // Trigger webhook event
      await webhookService.triggerEvent('timer.external.disconnected', {
        roomCode,
        provider: config.provider
      });

      return true;
    } catch (error) {
      console.error('Failed to disconnect external timer:', error);
      return false;
    }
  }

  /**
   * Sync timer with external device
   */
  private async syncTimer(roomCode: string): Promise<void> {
    try {
      const config = this.configs.get(roomCode);
      if (!config) return;

      // In a real implementation, this would sync with the external timer
      console.log(`Syncing timer for room ${roomCode} with ${config.provider}`);

      // Trigger webhook event
      await webhookService.triggerEvent('timer.external.synced', {
        roomCode,
        provider: config.provider,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Timer sync failed:', error);
    }
  }

  /**
   * Get external timer status
   */
  getTimerStatus(roomCode: string): { isConnected: boolean; config?: ExternalTimerConfig } {
    const config = this.configs.get(roomCode);
    return {
      isConnected: !!config,
      config
    };
  }
}

export class IoTService {
  private devices: Map<string, IoTDevice> = new Map();
  private connectionIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register IoT device
   */
  async registerDevice(device: IoTDevice): Promise<boolean> {
    try {
      console.log(`Registering IoT device: ${device.name} (${device.type})`);

      this.devices.set(device.id, device);

      // Start connection monitoring
      const interval = setInterval(() => {
        this.checkDeviceConnection(device.id);
      }, 30000); // Check every 30 seconds

      this.connectionIntervals.set(device.id, interval);

      // Trigger webhook event
      await webhookService.triggerEvent('iot.device.registered', {
        deviceId: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol
      });

      return true;
    } catch (error) {
      console.error('Failed to register IoT device:', error);
      return false;
    }
  }

  /**
   * Unregister IoT device
   */
  async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return true;

      // Clear connection monitoring
      const interval = this.connectionIntervals.get(deviceId);
      if (interval) {
        clearInterval(interval);
        this.connectionIntervals.delete(deviceId);
      }

      console.log(`Unregistering IoT device: ${device.name}`);
      this.devices.delete(deviceId);

      // Trigger webhook event
      await webhookService.triggerEvent('iot.device.unregistered', {
        deviceId,
        name: device.name
      });

      return true;
    } catch (error) {
      console.error('Failed to unregister IoT device:', error);
      return false;
    }
  }

  /**
   * Send command to IoT device
   */
  async sendDeviceCommand(deviceId: string, command: string, params?: any): Promise<IoTCommandResult> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'Device not found'
        };
      }

      if (!device.isActive) {
        return {
          success: false,
          error: 'Device is not active'
        };
      }

      console.log(`Sending command to ${device.name}: ${command}`, params);

      // In a real implementation, this would send the actual command via the device's protocol
      const result: IoTCommandResult = {
        success: true,
        response: { status: 'command_executed', timestamp: new Date() }
      };

      // Update last seen
      device.lastSeen = new Date();
      this.devices.set(deviceId, device);

      // Trigger webhook event
      await webhookService.triggerEvent('iot.device.command', {
        deviceId,
        deviceName: device.name,
        command,
        params,
        success: result.success
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command failed'
      };
    }
  }

  /**
   * Get all registered devices
   */
  getDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Check device connection status
   */
  private async checkDeviceConnection(deviceId: string): Promise<void> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return;

      // In a real implementation, this would ping the device
      const wasActive = device.isActive;
      device.lastSeen = new Date();

      // Simulate connection check
      device.isActive = Math.random() > 0.1; // 90% chance of being active

      if (wasActive !== device.isActive) {
        // Trigger webhook event for status change
        await webhookService.triggerEvent('iot.device.status_changed', {
          deviceId,
          deviceName: device.name,
          isActive: device.isActive,
          lastSeen: device.lastSeen
        });
      }

      this.devices.set(deviceId, device);
    } catch (error) {
      console.error('Device connection check failed:', error);
    }
  }
}

export class IntegrationManager {
  private integrations: Map<string, IntegrationConfig> = new Map();

  constructor(
    public socialMedia: SocialMediaService,
    public videoRecording: VideoRecordingService,
    public externalTimer: ExternalTimerService,
    public iot: IoTService
  ) {}

  /**
   * Register integration
   */
  async registerIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      id: `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  /**
   * Enable/disable integration
   */
  async toggleIntegration(id: string, enabled: boolean): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    integration.isEnabled = enabled;
    integration.updatedAt = new Date();
    this.integrations.set(id, integration);

    return true;
  }

  /**
   * Get all integrations
   */
  getIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integrations by type
   */
  getIntegrationsByType(type: string): IntegrationConfig[] {
    return this.getIntegrations().filter(integration => integration.type === type);
  }

  /**
   * Execute integration action
   */
  async executeIntegrationAction(integrationId: string, action: string, params?: any): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.isEnabled) {
      throw new Error('Integration not found or not enabled');
    }

    // Route to appropriate service based on integration type
    switch (integration.type) {
      case 'social':
        return this.socialMedia.postToSocialMedia(params as SocialMediaPost);
      case 'video':
        if (action === 'start') {
          return this.videoRecording.startRecording(params.roomCode, params.config);
        } else if (action === 'stop') {
          return this.videoRecording.stopRecording(params.roomCode);
        }
        break;
      case 'timer':
        if (action === 'connect') {
          return this.externalTimer.connectExternalTimer(params.roomCode, params.config);
        } else if (action === 'disconnect') {
          return this.externalTimer.disconnectExternalTimer(params.roomCode);
        }
        break;
      case 'iot':
        return this.iot.sendDeviceCommand(params.deviceId, action, params);
    }

    throw new Error(`Unsupported integration action: ${action} for type: ${integration.type}`);
  }
}

// Export singleton instances
export const socialMediaService = new SocialMediaService();
export const videoRecordingService = new VideoRecordingService();
export const externalTimerService = new ExternalTimerService();
export const iotService = new IoTService();

export const integrationManager = new IntegrationManager(
  socialMediaService,
  videoRecordingService,
  externalTimerService,
  iotService
);