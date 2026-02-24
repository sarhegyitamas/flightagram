-- Add custom_messages JSONB column to subscription_receivers
-- Stores per-receiver customized message templates.
-- Structure: { "tone": "caring", "messages": { "DEPARTURE": "...", "EN_ROUTE": "...", "ARRIVAL": "..." } }
-- When null, falls back to subscription-level custom_messages on flight_subscriptions.
ALTER TABLE subscription_receivers ADD COLUMN custom_messages JSONB DEFAULT NULL;
