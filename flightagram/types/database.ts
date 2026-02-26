export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      EmailLog: {
        Row: {
          createdAt: string
          id: string
          response: Json | null
          status: string
          subscriberId: number
          templateId: string
        }
        Insert: {
          createdAt?: string
          id: string
          response?: Json | null
          status: string
          subscriberId: number
          templateId: string
        }
        Update: {
          createdAt?: string
          id?: string
          response?: Json | null
          status?: string
          subscriberId?: number
          templateId?: string
        }
        Relationships: [
          {
            foreignKeyName: "EmailLog_subscriberId_fkey"
            columns: ["subscriberId"]
            isOneToOne: false
            referencedRelation: "WaitlistSubscriber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EmailLog_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "EmailTemplate"
            referencedColumns: ["id"]
          },
        ]
      }
      EmailTemplate: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          name: string
          zeptomailTemplateId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id: string
          name: string
          zeptomailTemplateId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          zeptomailTemplateId?: string
        }
        Relationships: []
      }
      flight_subscriptions: {
        Row: {
          adb_webhook_id: string | null
          created_at: string | null
          custom_messages: Json | null
          flight_id: string
          id: string
          is_active: boolean | null
          polling_enabled: boolean | null
          traveller_id: string
          traveller_name: string
          updated_at: string | null
        }
        Insert: {
          adb_webhook_id?: string | null
          created_at?: string | null
          custom_messages?: Json | null
          flight_id: string
          id?: string
          is_active?: boolean | null
          polling_enabled?: boolean | null
          traveller_id: string
          traveller_name: string
          updated_at?: string | null
        }
        Update: {
          adb_webhook_id?: string | null
          created_at?: string | null
          custom_messages?: Json | null
          flight_id?: string
          id?: string
          is_active?: boolean | null
          polling_enabled?: boolean | null
          traveller_id?: string
          traveller_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_subscriptions_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_subscriptions_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          adb_flight_id: string | null
          airline_iata: string | null
          airline_name: string | null
          arrival_airport: string
          arrival_airport_name: string | null
          arrival_airport_tz: string | null
          created_at: string | null
          departure_airport: string
          departure_airport_name: string | null
          departure_airport_tz: string | null
          estimated_arrival: string | null
          flight_number: string
          id: string
          raw_data: Json | null
          scheduled_arrival: string | null
          scheduled_departure: string | null
          status: Database["public"]["Enums"]["flight_status"] | null
          status_version: number | null
          updated_at: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          adb_flight_id?: string | null
          airline_iata?: string | null
          airline_name?: string | null
          arrival_airport: string
          arrival_airport_name?: string | null
          arrival_airport_tz?: string | null
          created_at?: string | null
          departure_airport: string
          departure_airport_name?: string | null
          departure_airport_tz?: string | null
          estimated_arrival?: string | null
          flight_number: string
          id?: string
          raw_data?: Json | null
          scheduled_arrival?: string | null
          scheduled_departure?: string | null
          status?: Database["public"]["Enums"]["flight_status"] | null
          status_version?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          adb_flight_id?: string | null
          airline_iata?: string | null
          airline_name?: string | null
          arrival_airport?: string
          arrival_airport_name?: string | null
          arrival_airport_tz?: string | null
          created_at?: string | null
          departure_airport?: string
          departure_airport_name?: string | null
          departure_airport_tz?: string | null
          estimated_arrival?: string | null
          flight_number?: string
          id?: string
          raw_data?: Json | null
          scheduled_arrival?: string | null
          scheduled_departure?: string | null
          status?: Database["public"]["Enums"]["flight_status"] | null
          status_version?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_events: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          message_id: string
          metadata: Json | null
          provider_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          message_id: string
          metadata?: Json | null
          provider_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          message_id?: string
          metadata?: Json | null
          provider_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attempt_count: number | null
          channel: Database["public"]["Enums"]["channel_type"] | null
          content: string | null
          created_at: string | null
          id: string
          idempotency_key: string | null
          max_attempts: number | null
          message_type: Database["public"]["Enums"]["message_type"]
          receiver_id: string
          scheduled_for: string | null
          sent_at: string | null
          skip_reason: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          channel?: Database["public"]["Enums"]["channel_type"] | null
          content?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          max_attempts?: number | null
          message_type: Database["public"]["Enums"]["message_type"]
          receiver_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          channel?: Database["public"]["Enums"]["channel_type"] | null
          content?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          max_attempts?: number | null
          message_type?: Database["public"]["Enums"]["message_type"]
          receiver_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "receivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "flight_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      receivers: {
        Row: {
          created_at: string | null
          display_name: string
          email_address: string | null
          email_opted_in: boolean | null
          id: string
          telegram_chat_id: number | null
          telegram_opted_in: boolean | null
          telegram_username: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email_address?: string | null
          email_opted_in?: boolean | null
          id?: string
          telegram_chat_id?: number | null
          telegram_opted_in?: boolean | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email_address?: string | null
          email_opted_in?: boolean | null
          id?: string
          telegram_chat_id?: number | null
          telegram_opted_in?: boolean | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduler_locks: {
        Row: {
          expires_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
        }
        Insert: {
          expires_at: string
          id: string
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          expires_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
        }
        Relationships: []
      }
      subscription_receivers: {
        Row: {
          created_at: string | null
          custom_messages: Json | null
          id: string
          receiver_id: string
          subscription_id: string
        }
        Insert: {
          created_at?: string | null
          custom_messages?: Json | null
          id?: string
          receiver_id: string
          subscription_id: string
        }
        Update: {
          created_at?: string | null
          custom_messages?: Json | null
          id?: string
          receiver_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_receivers_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "receivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_receivers_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "flight_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      traveller_receiver_links: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"] | null
          created_at: string | null
          id: string
          opt_in_status: Database["public"]["Enums"]["opt_in_status"] | null
          opt_in_token: string
          opted_in_at: string | null
          receiver_id: string
          traveller_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string | null
          id?: string
          opt_in_status?: Database["public"]["Enums"]["opt_in_status"] | null
          opt_in_token: string
          opted_in_at?: string | null
          receiver_id: string
          traveller_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string | null
          id?: string
          opt_in_status?: Database["public"]["Enums"]["opt_in_status"] | null
          opt_in_token?: string
          opted_in_at?: string | null
          receiver_id?: string
          traveller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveller_receiver_links_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "receivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveller_receiver_links_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      travellers: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      WaitlistAnswer: {
        Row: {
          createdAt: string
          destination: string | null
          id: number
          nextFlightTime: string | null
          preferredChannels: string[] | null
          subscriberId: number
        }
        Insert: {
          createdAt?: string
          destination?: string | null
          id?: number
          nextFlightTime?: string | null
          preferredChannels?: string[] | null
          subscriberId: number
        }
        Update: {
          createdAt?: string
          destination?: string | null
          id?: number
          nextFlightTime?: string | null
          preferredChannels?: string[] | null
          subscriberId?: number
        }
        Relationships: [
          {
            foreignKeyName: "WaitlistAnswer_subscriberId_fkey"
            columns: ["subscriberId"]
            isOneToOne: false
            referencedRelation: "WaitlistSubscriber"
            referencedColumns: ["id"]
          },
        ]
      }
      WaitlistSubscriber: {
        Row: {
          email: string
          firstname: string | null
          id: number
          isUnsubscribed: boolean
          lastname: string | null
          subscribedAt: string
          unsubscribeToken: string
        }
        Insert: {
          email: string
          firstname?: string | null
          id?: number
          isUnsubscribed?: boolean
          lastname?: string | null
          subscribedAt?: string
          unsubscribeToken: string
        }
        Update: {
          email?: string
          firstname?: string | null
          id?: number
          isUnsubscribed?: boolean
          lastname?: string | null
          subscribedAt?: string
          unsubscribeToken?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          flight_id: string | null
          id: string
          parsed_payload: Json | null
          processed: boolean | null
          processed_at: string | null
          raw_payload: Json
          source: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          flight_id?: string | null
          id?: string
          parsed_payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload: Json
          source?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          flight_id?: string | null
          id?: string
          parsed_payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload?: Json
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_type: "TELEGRAM" | "WHATSAPP" | "EMAIL"
      flight_status:
        | "SCHEDULED"
        | "DEPARTED"
        | "EN_ROUTE"
        | "ARRIVED"
        | "DELAYED"
        | "CANCELED"
      message_status: "PENDING" | "SCHEDULED" | "SENT" | "FAILED" | "SKIPPED"
      message_type:
        | "DEPARTURE"
        | "EN_ROUTE"
        | "ARRIVAL"
        | "DELAY"
        | "CANCELLATION"
      opt_in_status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      channel_type: ["TELEGRAM", "WHATSAPP", "EMAIL"],
      flight_status: [
        "SCHEDULED",
        "DEPARTED",
        "EN_ROUTE",
        "ARRIVED",
        "DELAYED",
        "CANCELED",
      ],
      message_status: ["PENDING", "SCHEDULED", "SENT", "FAILED", "SKIPPED"],
      message_type: [
        "DEPARTURE",
        "EN_ROUTE",
        "ARRIVAL",
        "DELAY",
        "CANCELLATION",
      ],
      opt_in_status: ["PENDING", "ACTIVE", "UNSUBSCRIBED"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.74.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
