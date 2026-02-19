-- Add EMAIL channel support
-- Migration: 20240218000001_add_email_channel

-- Add EMAIL to the channel_type enum
ALTER TYPE channel_type ADD VALUE 'EMAIL';

-- Add email columns to receivers table
ALTER TABLE receivers
  ADD COLUMN IF NOT EXISTS email_address VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_opted_in BOOLEAN DEFAULT FALSE;

-- Add channel column to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel channel_type DEFAULT 'TELEGRAM';

-- Rename and retype telegram_message_id to provider_message_id in message_events
ALTER TABLE message_events
  RENAME COLUMN telegram_message_id TO provider_message_id;

ALTER TABLE message_events
  ALTER COLUMN provider_message_id TYPE TEXT USING provider_message_id::TEXT;
