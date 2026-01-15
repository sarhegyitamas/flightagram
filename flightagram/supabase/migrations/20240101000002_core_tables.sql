-- Flightagram Database Schema: Core Tables
-- Migration: 002_core_tables

-- Travellers: Authenticated users who set up notifications
-- Links to Supabase auth.users
CREATE TABLE travellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receivers: People who receive notifications (non-authenticated)
-- Identified by Telegram chat_id after opt-in
CREATE TABLE receivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traveller-Receiver Links: Many-to-many with opt-in tracking
CREATE TABLE traveller_receiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveller_id UUID NOT NULL REFERENCES travellers(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES receivers(id) ON DELETE CASCADE,
  opt_in_token VARCHAR(64) UNIQUE NOT NULL,
  opt_in_status opt_in_status DEFAULT 'PENDING',
  channel channel_type DEFAULT 'TELEGRAM',
  opted_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(traveller_id, receiver_id)
);

-- Flights: Flight records with AeroDataBox data
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adb_flight_id VARCHAR(100) UNIQUE,
  flight_number VARCHAR(20) NOT NULL,
  airline_iata VARCHAR(10),
  airline_name VARCHAR(255),
  departure_airport VARCHAR(10) NOT NULL,
  departure_airport_name VARCHAR(255),
  departure_airport_tz VARCHAR(100),
  arrival_airport VARCHAR(10) NOT NULL,
  arrival_airport_name VARCHAR(255),
  arrival_airport_tz VARCHAR(100),
  scheduled_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  status flight_status DEFAULT 'SCHEDULED',
  status_version INTEGER DEFAULT 1,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flight Subscriptions: Links traveller to flight
CREATE TABLE flight_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveller_id UUID NOT NULL REFERENCES travellers(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  traveller_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  adb_webhook_id VARCHAR(100),
  polling_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(traveller_id, flight_id)
);

-- Subscription Receivers: Which receivers get updates for which subscription
CREATE TABLE subscription_receivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES flight_subscriptions(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES receivers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, receiver_id)
);

-- Messages: Scheduled and sent messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES flight_subscriptions(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES receivers(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  status message_status DEFAULT 'PENDING',
  scheduled_for TIMESTAMPTZ,
  content TEXT,
  sent_at TIMESTAMPTZ,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  skip_reason TEXT,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Events: Delivery attempts and outcomes
CREATE TABLE message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  telegram_message_id BIGINT,
  error_message TEXT,
  error_code VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events: Raw and parsed AeroDataBox webhook payloads
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) DEFAULT 'aerodatabox',
  event_type VARCHAR(100),
  raw_payload JSONB NOT NULL,
  parsed_payload JSONB,
  flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduler Locks: Distributed locking for idempotency
CREATE TABLE scheduler_locks (
  id VARCHAR(100) PRIMARY KEY,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_by VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_travellers_updated_at
  BEFORE UPDATE ON travellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receivers_updated_at
  BEFORE UPDATE ON receivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flights_updated_at
  BEFORE UPDATE ON flights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_subscriptions_updated_at
  BEFORE UPDATE ON flight_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
