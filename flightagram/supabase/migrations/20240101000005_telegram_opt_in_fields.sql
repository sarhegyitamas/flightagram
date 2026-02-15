-- Add Telegram opt-in tracking fields to receivers table
-- Migration: 005_telegram_opt_in_fields

-- Quick boolean flag for checking if receiver has opted in via Telegram
ALTER TABLE receivers
ADD COLUMN IF NOT EXISTS telegram_opted_in BOOLEAN DEFAULT FALSE;

-- Store the Telegram username (e.g. @johndoe) captured during /start
ALTER TABLE receivers
ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Backfill: mark existing receivers with a chat_id as opted in
UPDATE receivers
SET telegram_opted_in = TRUE
WHERE telegram_chat_id IS NOT NULL;
