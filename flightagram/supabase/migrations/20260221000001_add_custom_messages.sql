-- Add custom_messages JSONB column to flight_subscriptions
-- Stores user-customized message templates per subscription.
-- Structure: { "tone": "caring", "messages": { "DEPARTURE": "...", "EN_ROUTE": "...", "ARRIVAL": "..." } }
-- When null, the system default templates are used.
ALTER TABLE flight_subscriptions ADD COLUMN custom_messages JSONB DEFAULT NULL;
