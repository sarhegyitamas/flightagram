/**
 * Flightagram Core Types
 * These types mirror the database schema and are used throughout the application.
 */

// =============================================================================
// Enums (match database enums)
// =============================================================================

export type ChannelType = 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';

export type FlightStatus =
  | 'SCHEDULED'
  | 'DEPARTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DELAYED'
  | 'CANCELED';

export type MessageStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED';

export type MessageType =
  | 'DEPARTURE'
  | 'EN_ROUTE'
  | 'ARRIVAL'
  | 'DELAY'
  | 'CANCELLATION';

export type OptInStatus = 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';

// =============================================================================
// Database Entity Types
// =============================================================================

export interface Traveller {
  id: string;
  user_id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Receiver {
  id: string;
  telegram_chat_id: number | null;
  telegram_opted_in: boolean;
  telegram_username: string | null;
  email_address: string | null;
  email_opted_in: boolean;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface TravellerReceiverLink {
  id: string;
  traveller_id: string;
  receiver_id: string;
  opt_in_token: string;
  opt_in_status: OptInStatus;
  channel: ChannelType;
  opted_in_at: string | null;
  created_at: string;
}

export interface Flight {
  id: string;
  adb_flight_id: string | null;
  flight_number: string;
  airline_iata: string | null;
  airline_name: string | null;
  departure_airport: string;
  departure_airport_name: string | null;
  departure_airport_tz: string | null;
  arrival_airport: string;
  arrival_airport_name: string | null;
  arrival_airport_tz: string | null;
  scheduled_departure: string | null;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  estimated_arrival: string | null;
  status: FlightStatus;
  status_version: number;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface FlightSubscription {
  id: string;
  traveller_id: string;
  flight_id: string;
  traveller_name: string;
  is_active: boolean;
  adb_webhook_id: string | null;
  polling_enabled: boolean;
  custom_messages: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionReceiver {
  id: string;
  subscription_id: string;
  receiver_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  subscription_id: string;
  receiver_id: string;
  message_type: MessageType;
  status: MessageStatus;
  channel: ChannelType;
  scheduled_for: string | null;
  content: string | null;
  sent_at: string | null;
  attempt_count: number;
  max_attempts: number;
  skip_reason: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageEvent {
  id: string;
  message_id: string;
  event_type: string;
  provider_message_id: string | null;
  error_message: string | null;
  error_code: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_type: string | null;
  raw_payload: Record<string, unknown>;
  parsed_payload: Record<string, unknown> | null;
  flight_id: string | null;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface SchedulerLock {
  id: string;
  locked_at: string;
  locked_by: string | null;
  expires_at: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateSubscriptionRequest {
  flight_number: string;
  flight_date: string; // ISO date string
  receivers: Array<{
    display_name: string;
  }>;
}

export interface CreateSubscriptionResponse {
  subscription: FlightSubscription;
  flight: Flight;
  receivers: Array<{
    receiver: Receiver;
    link: TravellerReceiverLink;
    opt_in_url: string;
  }>;
}

export interface FlightSearchRequest {
  flight_number: string;
  date: string; // ISO date string
}

export interface FlightSearchResponse {
  flights: Flight[];
}

// =============================================================================
// AeroDataBox Types
// =============================================================================

export interface ADBFlightStatus {
  departure: {
    airport: {
      iata: string;
      name?: string;
      timeZone?: string;
    };
    scheduledTime?: {
      utc?: string;
      local?: string;
    };
    actualTime?: {
      utc?: string;
      local?: string;
    };
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: {
      iata: string;
      name?: string;
      timeZone?: string;
    };
    scheduledTime?: {
      utc?: string;
      local?: string;
    };
    actualTime?: {
      utc?: string;
      local?: string;
    };
    estimatedTime?: {
      utc?: string;
      local?: string;
    };
    terminal?: string;
    gate?: string;
  };
  status?: string;
  airline?: {
    iata?: string;
    name?: string;
  };
  number?: string;
}

export interface ADBWebhookPayload {
  event: string;
  flight: ADBFlightStatus;
  timestamp: string;
}

// =============================================================================
// Telegram Types
// =============================================================================

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

export interface TelegramSendMessageRequest {
  chat_id: number | string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: {
      id: number;
    };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}

// =============================================================================
// Channel Adapter Types
// =============================================================================

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export interface ParsedWebhookCommand {
  type: 'START' | 'STOP' | 'STATUS' | 'HELP' | 'UNKNOWN';
  chatId: number;
  userId: number;
  username?: string;
  token?: string; // For START command with deep link
}

// =============================================================================
// Scheduler Types
// =============================================================================

export interface SchedulerTickResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface DueMessage extends Message {
  subscription: FlightSubscription;
  receiver: Receiver;
  flight: Flight;
}

// =============================================================================
// Message Template Types
// =============================================================================

export interface MessageTemplateContext {
  traveller_name: string;
  flight_number: string;
  origin_airport: string;
  origin_airport_name?: string;
  destination_airport: string;
  destination_airport_name?: string;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  estimated_arrival?: string;
  delay_minutes?: number;
}

// =============================================================================
// Utility Types
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
