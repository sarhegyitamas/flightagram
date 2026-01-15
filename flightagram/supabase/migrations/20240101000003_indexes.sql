-- Flightagram Database Schema: Indexes
-- Migration: 003_indexes

-- Messages: Scheduler needs to find due messages quickly
CREATE INDEX idx_messages_status_scheduled
  ON messages(status, scheduled_for)
  WHERE status IN ('PENDING', 'SCHEDULED');

CREATE INDEX idx_messages_subscription
  ON messages(subscription_id);

CREATE INDEX idx_messages_receiver
  ON messages(receiver_id);

CREATE INDEX idx_messages_idempotency
  ON messages(idempotency_key);

-- Flights: Active flight lookups
CREATE INDEX idx_flights_status
  ON flights(status)
  WHERE status NOT IN ('ARRIVED', 'CANCELED');

CREATE INDEX idx_flights_adb_id
  ON flights(adb_flight_id);

CREATE INDEX idx_flights_number_date
  ON flights(flight_number, scheduled_departure);

-- Webhook Events: Processing queue
CREATE INDEX idx_webhook_events_unprocessed
  ON webhook_events(processed, created_at)
  WHERE processed = FALSE;

CREATE INDEX idx_webhook_events_flight
  ON webhook_events(flight_id);

-- Flight Subscriptions: Active subscriptions
CREATE INDEX idx_flight_subscriptions_traveller
  ON flight_subscriptions(traveller_id)
  WHERE is_active = TRUE;

CREATE INDEX idx_flight_subscriptions_flight
  ON flight_subscriptions(flight_id)
  WHERE is_active = TRUE;

-- Traveller Receiver Links: Opt-in lookups
CREATE INDEX idx_traveller_receiver_links_token
  ON traveller_receiver_links(opt_in_token);

CREATE INDEX idx_traveller_receiver_links_status
  ON traveller_receiver_links(opt_in_status);

-- Subscription Receivers: Join optimization
CREATE INDEX idx_subscription_receivers_subscription
  ON subscription_receivers(subscription_id);

CREATE INDEX idx_subscription_receivers_receiver
  ON subscription_receivers(receiver_id);

-- Message Events: Audit trail
CREATE INDEX idx_message_events_message
  ON message_events(message_id);

CREATE INDEX idx_message_events_created
  ON message_events(created_at);

-- Scheduler Locks: Cleanup expired locks
CREATE INDEX idx_scheduler_locks_expires
  ON scheduler_locks(expires_at);

-- Receivers: Telegram lookup
CREATE INDEX idx_receivers_telegram_chat_id
  ON receivers(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
