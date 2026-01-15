/**
 * Supabase Database Types
 * Auto-generated types should replace this file after running:
 * npx supabase gen types typescript --local > types/database.ts
 *
 * For now, this provides manual type definitions.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      travellers: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      receivers: {
        Row: {
          id: string;
          telegram_chat_id: number | null;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_chat_id?: number | null;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_chat_id?: number | null;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      traveller_receiver_links: {
        Row: {
          id: string;
          traveller_id: string;
          receiver_id: string;
          opt_in_token: string;
          opt_in_status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel: 'TELEGRAM' | 'WHATSAPP';
          opted_in_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          traveller_id: string;
          receiver_id: string;
          opt_in_token: string;
          opt_in_status?: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel?: 'TELEGRAM' | 'WHATSAPP';
          opted_in_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          traveller_id?: string;
          receiver_id?: string;
          opt_in_token?: string;
          opt_in_status?: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel?: 'TELEGRAM' | 'WHATSAPP';
          opted_in_at?: string | null;
          created_at?: string;
        };
      };
      flights: {
        Row: {
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
          status: 'SCHEDULED' | 'DEPARTED' | 'EN_ROUTE' | 'ARRIVED' | 'DELAYED' | 'CANCELED';
          status_version: number;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          adb_flight_id?: string | null;
          flight_number: string;
          airline_iata?: string | null;
          airline_name?: string | null;
          departure_airport: string;
          departure_airport_name?: string | null;
          departure_airport_tz?: string | null;
          arrival_airport: string;
          arrival_airport_name?: string | null;
          arrival_airport_tz?: string | null;
          scheduled_departure?: string | null;
          scheduled_arrival?: string | null;
          actual_departure?: string | null;
          actual_arrival?: string | null;
          estimated_arrival?: string | null;
          status?: 'SCHEDULED' | 'DEPARTED' | 'EN_ROUTE' | 'ARRIVED' | 'DELAYED' | 'CANCELED';
          status_version?: number;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          adb_flight_id?: string | null;
          flight_number?: string;
          airline_iata?: string | null;
          airline_name?: string | null;
          departure_airport?: string;
          departure_airport_name?: string | null;
          departure_airport_tz?: string | null;
          arrival_airport?: string;
          arrival_airport_name?: string | null;
          arrival_airport_tz?: string | null;
          scheduled_departure?: string | null;
          scheduled_arrival?: string | null;
          actual_departure?: string | null;
          actual_arrival?: string | null;
          estimated_arrival?: string | null;
          status?: 'SCHEDULED' | 'DEPARTED' | 'EN_ROUTE' | 'ARRIVED' | 'DELAYED' | 'CANCELED';
          status_version?: number;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      flight_subscriptions: {
        Row: {
          id: string;
          traveller_id: string;
          flight_id: string;
          traveller_name: string;
          is_active: boolean;
          adb_webhook_id: string | null;
          polling_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          traveller_id: string;
          flight_id: string;
          traveller_name: string;
          is_active?: boolean;
          adb_webhook_id?: string | null;
          polling_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          traveller_id?: string;
          flight_id?: string;
          traveller_name?: string;
          is_active?: boolean;
          adb_webhook_id?: string | null;
          polling_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_receivers: {
        Row: {
          id: string;
          subscription_id: string;
          receiver_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          receiver_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          receiver_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          subscription_id: string;
          receiver_id: string;
          message_type: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
          status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
          scheduled_for: string | null;
          content: string | null;
          sent_at: string | null;
          attempt_count: number;
          max_attempts: number;
          skip_reason: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          receiver_id: string;
          message_type: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
          status?: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
          scheduled_for?: string | null;
          content?: string | null;
          sent_at?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          skip_reason?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          receiver_id?: string;
          message_type?: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
          status?: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
          scheduled_for?: string | null;
          content?: string | null;
          sent_at?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          skip_reason?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_events: {
        Row: {
          id: string;
          message_id: string;
          event_type: string;
          telegram_message_id: number | null;
          error_message: string | null;
          error_code: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          event_type: string;
          telegram_message_id?: number | null;
          error_message?: string | null;
          error_code?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          event_type?: string;
          telegram_message_id?: number | null;
          error_message?: string | null;
          error_code?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          source: string;
          event_type: string | null;
          raw_payload: Json;
          parsed_payload: Json | null;
          flight_id: string | null;
          processed: boolean;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source?: string;
          event_type?: string | null;
          raw_payload: Json;
          parsed_payload?: Json | null;
          flight_id?: string | null;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          event_type?: string | null;
          raw_payload?: Json;
          parsed_payload?: Json | null;
          flight_id?: string | null;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      scheduler_locks: {
        Row: {
          id: string;
          locked_at: string;
          locked_by: string | null;
          expires_at: string;
        };
        Insert: {
          id: string;
          locked_at?: string;
          locked_by?: string | null;
          expires_at: string;
        };
        Update: {
          id?: string;
          locked_at?: string;
          locked_by?: string | null;
          expires_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      channel_type: 'TELEGRAM' | 'WHATSAPP';
      flight_status: 'SCHEDULED' | 'DEPARTED' | 'EN_ROUTE' | 'ARRIVED' | 'DELAYED' | 'CANCELED';
      message_status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
      message_type: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
      opt_in_status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
    };
  };
};
