/**
 * AeroDataBox API Client
 * Handles communication with AeroDataBox API via API.Market.
 * Designed to be swappable to RapidAPI if needed.
 */

import { aeroDataBoxLogger as logger } from '@/lib/logging';
import type {
  ADBFlight,
  ADBFlightSearchResponse,
  ADBWebhookSubscriptionRequest,
  ADBWebhookSubscriptionResponse,
  ADBErrorResponse,
} from './types';

// Configuration
const DEFAULT_BASE_URL = 'https://prod.api.market/api/v1/aedbx/aerodatabox';
const MOCK_MODE = !process.env.AERODATABOX_API_KEY;

interface ADBClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class AeroDataBoxClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ADBClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.AERODATABOX_BASE_URL || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey || process.env.AERODATABOX_API_KEY || '';
    this.timeout = config.timeout || 30000;
  }

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', body, headers = {} } = options;

    // If in mock mode, return mock data
    if (MOCK_MODE) {
      logger.warn('AeroDataBox client in mock mode - no API key configured');
      return this.getMockResponse<T>(endpoint, method);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      logger.debug('AeroDataBox API request', { url, method });

      const requestHeaders: Record<string, string> = {
        'accept': 'application/json',
        'X-MAGICAPI-Key': this.apiKey,
        ...headers,
      };
      if (body) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ADBErrorResponse;
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        logger.error('AeroDataBox API error', {
          url,
          status: response.status,
          error: errorMessage,
        });
        throw new AeroDataBoxError(errorMessage, response.status);
      }

      const data = await response.json();
      logger.debug('AeroDataBox API response', { url, status: response.status });
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AeroDataBoxError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('AeroDataBox API timeout', { url, timeout: this.timeout });
        throw new AeroDataBoxError('Request timeout', 408);
      }

      logger.error('AeroDataBox API request failed', { url }, error);
      throw new AeroDataBoxError('Request failed', 500);
    }
  }

  /**
   * Search for flights by flight number and date
   */
  async searchFlights(
    flightNumber: string,
    date: string // YYYY-MM-DD
  ): Promise<ADBFlight[]> {
    // AeroDataBox endpoint: /flights/number/{flightNumber}/{date}
    const endpoint = `/flights/number/${encodeURIComponent(flightNumber)}/${date}`;
    const response = await this.fetch<ADBFlightSearchResponse | ADBFlight[]>(endpoint);

    // Handle both array and object responses
    if (Array.isArray(response)) {
      return response;
    }
    return response.flights || [];
  }

  /**
   * Get flight status by flight number and date
   */
  async getFlightStatus(
    flightNumber: string,
    date: string // YYYY-MM-DD
  ): Promise<ADBFlight | null> {
    const flights = await this.searchFlights(flightNumber, date);
    return flights[0] || null;
  }

  /**
   * Register a webhook for flight updates
   */
  async registerWebhook(
    request: ADBWebhookSubscriptionRequest
  ): Promise<ADBWebhookSubscriptionResponse> {
    // Note: Actual webhook registration endpoint may vary by API provider
    const endpoint = '/webhooks/flight';
    return this.fetch<ADBWebhookSubscriptionResponse>(endpoint, {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const endpoint = `/webhooks/${webhookId}`;
    await this.fetch<void>(endpoint, { method: 'DELETE' });
  }

  /**
   * Mock responses for development without API key
   */
  private getMockResponse<T>(endpoint: string, method: string): T {
    logger.info('Returning mock response', { endpoint, method });

    // Mock flight search
    if (endpoint.includes('/flights/number/')) {
      const mockFlight: ADBFlight = {
        number: 'UA123',
        status: 'Scheduled',
        airline: {
          iata: 'UA',
          name: 'United Airlines',
        },
        departure: {
          airport: {
            iata: 'SFO',
            name: 'San Francisco International',
            timeZone: 'America/Los_Angeles',
          },
          scheduledTime: {
            utc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            local: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
        },
        arrival: {
          airport: {
            iata: 'JFK',
            name: 'John F. Kennedy International',
            timeZone: 'America/New_York',
          },
          scheduledTime: {
            utc: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
            local: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
          },
        },
      };
      return [mockFlight] as T;
    }

    // Mock webhook registration
    if (endpoint.includes('/webhooks') && method === 'POST') {
      return {
        id: `mock-webhook-${Date.now()}`,
        status: 'active',
        message: 'Mock webhook registered',
      } as T;
    }

    // Default empty response
    return {} as T;
  }
}

/**
 * Custom error class for AeroDataBox API errors
 */
export class AeroDataBoxError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AeroDataBoxError';
  }
}

// Export singleton instance
export const adbClient = new AeroDataBoxClient();

// Export class for testing/custom configuration
export { AeroDataBoxClient };
