import { getPrisma } from '../db';
import crypto from 'crypto';
import { getState, updateState } from '../state';

export interface WebhookConfig {
  id: string;
  url: string;
  name: string;
  description?: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryCount: number;
  timeout: number; // milliseconds
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  deliveredAt?: Date;
  nextRetry?: Date;
  error?: string;
  responseStatus?: number;
  responseBody?: string;
  createdAt: Date;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  retryAfter?: number;
}

export interface WebhookSubscription {
  id: string;
  webhookId: string;
  eventPattern: string; // e.g., "match.*", "round.start", "*"
  isActive: boolean;
  filters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEventPayload {
  id: string;
  event: string;
  timestamp: Date;
  source: 'server' | 'client';
  roomCode?: string;
  data: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    version?: string;
  };
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  authentication: boolean;
  rateLimit?: number;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookService {
  private prisma = getPrisma();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  constructor() {
    this.startEventProcessor();
  }

  /**
   * Create a new webhook configuration
   */
  async createWebhook(config: Omit<WebhookConfig, 'id' | 'secret' | 'createdAt' | 'updatedAt' | 'failureCount'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      secret: crypto.randomBytes(32).toString('hex'),
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | null> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date()
    };

    this.webhooks.set(id, updatedWebhook);
    return updatedWebhook;
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(id: string): Promise<boolean> {
    return this.webhooks.delete(id);
  }

  /**
   * Get all webhook configurations
   */
  async getWebhooks(): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values());
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(event: string, data: any, roomCode?: string, source: 'server' | 'client' = 'server'): Promise<void> {
    const payload: WebhookEventPayload = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      timestamp: new Date(),
      source,
      roomCode,
      data,
      metadata: {
        version: '1.0.0'
      }
    };

    // Find all webhooks that should receive this event
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook => {
      if (!webhook.isActive) return false;
      return webhook.events.includes(event) || webhook.events.includes('*');
    });

    // Create webhook events for each matching webhook
    for (const webhook of matchingWebhooks) {
      const webhookEvent: WebhookEvent = {
        id: `we_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        createdAt: new Date()
      };

      this.eventQueue.push(webhookEvent);
    }
  }

  /**
   * Process webhook events queue
   */
  private startEventProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (this.isProcessing || this.eventQueue.length === 0) return;

      this.isProcessing = true;

      try {
        await this.processEventQueue();
      } catch (error) {
        console.error('Error processing webhook events:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Process every second
  }

  /**
   * Process pending webhook events
   */
  private async processEventQueue(): Promise<void> {
    const now = new Date();
    const eventsToProcess = this.eventQueue.filter(event =>
      event.status === 'pending' ||
      (event.status === 'retrying' && event.nextRetry && event.nextRetry <= now)
    );

    for (const event of eventsToProcess) {
      await this.deliverEvent(event);
    }
  }

  /**
   * Deliver webhook event to endpoint
   */
  private async deliverEvent(event: WebhookEvent): Promise<void> {
    const webhook = this.webhooks.get(event.webhookId);
    if (!webhook) {
      // Remove event if webhook no longer exists
      this.eventQueue = this.eventQueue.filter(e => e.id !== event.id);
      return;
    }

    event.attempts++;

    try {
      const result = await this.sendWebhookRequest(webhook, event);

      if (result.success) {
        event.status = 'delivered';
        event.deliveredAt = new Date();
        webhook.lastTriggered = new Date();
        webhook.failureCount = 0; // Reset failure count on success
      } else {
        await this.handleDeliveryFailure(webhook, event, result);
      }
    } catch (error) {
      await this.handleDeliveryFailure(webhook, event, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send HTTP request to webhook endpoint
   */
  private async sendWebhookRequest(webhook: WebhookConfig, event: WebhookEvent): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const payload = JSON.stringify(event.payload);
      const signature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.event,
        'X-Webhook-ID': event.id,
        'User-Agent': 'ImprovScoreboard/1.0.0',
        ...webhook.headers
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseTime
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          responseTime,
          error: `HTTP ${response.status}: ${responseBody}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Handle webhook delivery failure
   */
  private async handleDeliveryFailure(
    webhook: WebhookConfig,
    event: WebhookEvent,
    result: WebhookDeliveryResult
  ): Promise<void> {
    event.error = result.error;
    event.responseStatus = result.statusCode;
    event.responseBody = result.error;

    webhook.failureCount++;

    if (event.attempts < webhook.retryCount) {
      // Schedule retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, event.attempts - 1), 300000); // Max 5 minutes
      event.nextRetry = new Date(Date.now() + delay);
      event.status = 'retrying';
    } else {
      // Mark as failed after all retries exhausted
      event.status = 'failed';
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats(): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    deliveredEvents: number;
    failedEvents: number;
    averageResponseTime: number;
  }> {
    const allEvents = this.eventQueue;
    const totalWebhooks = this.webhooks.size;
    const activeWebhooks = Array.from(this.webhooks.values()).filter(w => w.isActive).length;

    const deliveredEvents = allEvents.filter(e => e.status === 'delivered').length;
    const failedEvents = allEvents.filter(e => e.status === 'failed').length;
    const totalEvents = allEvents.length;

    const responseTimes = allEvents
      .filter(e => e.deliveredAt)
      .map(e => e.deliveredAt!.getTime() - e.createdAt.getTime());

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      totalWebhooks,
      activeWebhooks,
      totalEvents,
      deliveredEvents,
      failedEvents,
      averageResponseTime
    };
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(id: string): Promise<WebhookDeliveryResult> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testPayload: WebhookEventPayload = {
      id: `test_${Date.now()}`,
      event: 'webhook.test',
      timestamp: new Date(),
      source: 'server',
      data: { message: 'This is a test webhook delivery' }
    };

    return this.sendWebhookRequest(webhook, {
      id: `test_event_${Date.now()}`,
      webhookId: id,
      event: 'webhook.test',
      payload: testPayload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    });
  }

  /**
   * Cleanup old events from queue
   */
  cleanupOldEvents(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days default
    const cutoffDate = new Date(Date.now() - maxAge);
    this.eventQueue = this.eventQueue.filter(event => event.createdAt > cutoffDate);
  }
}

export class APIService {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: Date }> = new Map();

  /**
   * Register API endpoint
   */
  registerEndpoint(endpoint: Omit<APIEndpoint, 'id' | 'createdAt' | 'updatedAt'>): APIEndpoint {
    const apiEndpoint: APIEndpoint = {
      id: `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...endpoint
    };

    this.endpoints.set(apiEndpoint.path, apiEndpoint);
    return apiEndpoint;
  }

  /**
   * Get all registered endpoints
   */
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Check rate limit for API key
   */
  checkRateLimit(apiKey: string, endpoint: APIEndpoint): boolean {
    const key = `${apiKey}:${endpoint.path}`;
    const now = new Date();
    const limit = this.rateLimits.get(key);

    if (!limit || limit.resetTime <= now) {
      // Reset or initialize rate limit
      this.rateLimits.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // 1 minute window
      });
      return true;
    }

    if (limit.count >= (endpoint.rateLimit || 100)) {
      return false; // Rate limit exceeded
    }

    limit.count++;
    return true;
  }

  /**
   * Generate API documentation
   */
  generateAPIDocs(): string {
    const endpoints = this.getEndpoints();
    let docs = '# API Documentation\n\n';
    docs += '## Available Endpoints\n\n';

    const groupedEndpoints = endpoints.reduce((groups, endpoint) => {
      const group = groups[endpoint.version] || [];
      group.push(endpoint);
      groups[endpoint.version] = group;
      return groups;
    }, {} as Record<string, APIEndpoint[]>);

    for (const [version, versionEndpoints] of Object.entries(groupedEndpoints)) {
      docs += `## Version ${version}\n\n`;

      for (const endpoint of versionEndpoints) {
        docs += `### ${endpoint.method} ${endpoint.path}\n`;
        docs += `${endpoint.description}\n\n`;
        docs += `**Authentication:** ${endpoint.authentication ? 'Required' : 'Not Required'}\n`;
        if (endpoint.rateLimit) {
          docs += `**Rate Limit:** ${endpoint.rateLimit} requests per minute\n`;
        }
        docs += '\n';
      }
    }

    return docs;
  }
}

// Export singleton instances
export const webhookService = new WebhookService();
export const apiService = new APIService();