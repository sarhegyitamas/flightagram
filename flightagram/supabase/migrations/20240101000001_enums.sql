-- Flightagram Database Schema: Enums
-- Migration: 001_enums

-- Channel types for messaging (Telegram now, WhatsApp future)
CREATE TYPE channel_type AS ENUM ('TELEGRAM', 'WHATSAPP');

-- Internal flight status (simplified from AeroDataBox)
CREATE TYPE flight_status AS ENUM (
  'SCHEDULED',
  'DEPARTED',
  'EN_ROUTE',
  'ARRIVED',
  'DELAYED',
  'CANCELED'
);

-- Message delivery status
CREATE TYPE message_status AS ENUM (
  'PENDING',
  'SCHEDULED',
  'SENT',
  'FAILED',
  'SKIPPED'
);

-- Message types based on flight lifecycle
CREATE TYPE message_type AS ENUM (
  'DEPARTURE',
  'EN_ROUTE',
  'ARRIVAL',
  'DELAY',
  'CANCELLATION'
);

-- Receiver opt-in status
CREATE TYPE opt_in_status AS ENUM (
  'PENDING',
  'ACTIVE',
  'UNSUBSCRIBED'
);
