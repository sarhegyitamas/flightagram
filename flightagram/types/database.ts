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
        Relationships: [];
      };
      receivers: {
        Row: {
          id: string;
          telegram_chat_id: number | null;
          telegram_opted_in: boolean;
          telegram_username: string | null;
          email_address: string | null;
          email_opted_in: boolean;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_chat_id?: number | null;
          telegram_opted_in?: boolean;
          telegram_username?: string | null;
          email_address?: string | null;
          email_opted_in?: boolean;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_chat_id?: number | null;
          telegram_opted_in?: boolean;
          telegram_username?: string | null;
          email_address?: string | null;
          email_opted_in?: boolean;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      traveller_receiver_links: {
        Row: {
          id: string;
          traveller_id: string;
          receiver_id: string;
          opt_in_token: string;
          opt_in_status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
          opted_in_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          traveller_id: string;
          receiver_id: string;
          opt_in_token: string;
          opt_in_status?: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel?: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
          opted_in_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          traveller_id?: string;
          receiver_id?: string;
          opt_in_token?: string;
          opt_in_status?: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
          channel?: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
          opted_in_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'traveller_receiver_links_traveller_id_fkey';
            columns: ['traveller_id'];
            isOneToOne: false;
            referencedRelation: 'travellers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'traveller_receiver_links_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'receivers';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
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
          custom_messages: Json | null;
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
          custom_messages?: Json | null;
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
          custom_messages?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'flight_subscriptions_traveller_id_fkey';
            columns: ['traveller_id'];
            isOneToOne: false;
            referencedRelation: 'travellers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'flight_subscriptions_flight_id_fkey';
            columns: ['flight_id'];
            isOneToOne: false;
            referencedRelation: 'flights';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'subscription_receivers_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'flight_subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_receivers_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'receivers';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          subscription_id: string;
          receiver_id: string;
          message_type: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
          status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
          channel: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
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
          channel?: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
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
          channel?: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
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
        Relationships: [
          {
            foreignKeyName: 'messages_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'flight_subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'receivers';
            referencedColumns: ['id'];
          },
        ];
      };
      message_events: {
        Row: {
          id: string;
          message_id: string;
          event_type: string;
          provider_message_id: string | null;
          error_message: string | null;
          error_code: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          event_type: string;
          provider_message_id?: string | null;
          error_message?: string | null;
          error_code?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          event_type?: string;
          provider_message_id?: string | null;
          error_message?: string | null;
          error_code?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_events_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'webhook_events_flight_id_fkey';
            columns: ['flight_id'];
            isOneToOne: false;
            referencedRelation: 'flights';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      channel_type: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
      flight_status: 'SCHEDULED' | 'DEPARTED' | 'EN_ROUTE' | 'ARRIVED' | 'DELAYED' | 'CANCELED';
      message_status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';
      message_type: 'DEPARTURE' | 'EN_ROUTE' | 'ARRIVAL' | 'DELAY' | 'CANCELLATION';
      opt_in_status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
    };
  };
};
