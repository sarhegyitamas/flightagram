-- Flightagram Database Schema: Row Level Security Policies
-- Migration: 004_rls_policies

-- Enable RLS on all tables
ALTER TABLE travellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE traveller_receiver_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_locks ENABLE ROW LEVEL SECURITY;

-- Travellers: Users can only access their own traveller record
CREATE POLICY "Users can view own traveller record"
  ON travellers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traveller record"
  ON travellers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traveller record"
  ON travellers FOR UPDATE
  USING (auth.uid() = user_id);

-- Receivers: Travellers can view receivers linked to them
CREATE POLICY "Travellers can view linked receivers"
  ON receivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM traveller_receiver_links trl
      JOIN travellers t ON t.id = trl.traveller_id
      WHERE trl.receiver_id = receivers.id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Travellers can insert receivers"
  ON receivers FOR INSERT
  WITH CHECK (TRUE);

-- Traveller Receiver Links: Users can manage their own links
CREATE POLICY "Users can view own receiver links"
  ON traveller_receiver_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = traveller_receiver_links.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own receiver links"
  ON traveller_receiver_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = traveller_receiver_links.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own receiver links"
  ON traveller_receiver_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = traveller_receiver_links.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

-- Flights: Anyone authenticated can view flights
CREATE POLICY "Authenticated users can view flights"
  ON flights FOR SELECT
  USING (auth.role() = 'authenticated');

-- Flight Subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON flight_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = flight_subscriptions.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own subscriptions"
  ON flight_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = flight_subscriptions.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own subscriptions"
  ON flight_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = flight_subscriptions.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own subscriptions"
  ON flight_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM travellers
      WHERE travellers.id = flight_subscriptions.traveller_id
      AND travellers.user_id = auth.uid()
    )
  );

-- Subscription Receivers: Users can manage receivers for their subscriptions
CREATE POLICY "Users can view subscription receivers"
  ON subscription_receivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flight_subscriptions fs
      JOIN travellers t ON t.id = fs.traveller_id
      WHERE fs.id = subscription_receivers.subscription_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subscription receivers"
  ON subscription_receivers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flight_subscriptions fs
      JOIN travellers t ON t.id = fs.traveller_id
      WHERE fs.id = subscription_receivers.subscription_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subscription receivers"
  ON subscription_receivers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flight_subscriptions fs
      JOIN travellers t ON t.id = fs.traveller_id
      WHERE fs.id = subscription_receivers.subscription_id
      AND t.user_id = auth.uid()
    )
  );

-- Messages: Users can view messages for their subscriptions
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flight_subscriptions fs
      JOIN travellers t ON t.id = fs.traveller_id
      WHERE fs.id = messages.subscription_id
      AND t.user_id = auth.uid()
    )
  );

-- Message Events: Users can view events for their messages
CREATE POLICY "Users can view own message events"
  ON message_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN flight_subscriptions fs ON fs.id = m.subscription_id
      JOIN travellers t ON t.id = fs.traveller_id
      WHERE m.id = message_events.message_id
      AND t.user_id = auth.uid()
    )
  );

-- Service role policies for backend operations
-- These allow the service role to bypass RLS for scheduler, webhooks, etc.

-- Flights: Service role can insert/update
CREATE POLICY "Service role can manage flights"
  ON flights FOR ALL
  USING (auth.role() = 'service_role');

-- Messages: Service role can manage all messages
CREATE POLICY "Service role can manage messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role');

-- Message Events: Service role can insert events
CREATE POLICY "Service role can manage message events"
  ON message_events FOR ALL
  USING (auth.role() = 'service_role');

-- Webhook Events: Service role only
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Scheduler Locks: Service role only
CREATE POLICY "Service role can manage scheduler locks"
  ON scheduler_locks FOR ALL
  USING (auth.role() = 'service_role');

-- Receivers: Service role can update (for telegram opt-in)
CREATE POLICY "Service role can manage receivers"
  ON receivers FOR ALL
  USING (auth.role() = 'service_role');

-- Traveller Receiver Links: Service role can update (for opt-in status)
CREATE POLICY "Service role can manage receiver links"
  ON traveller_receiver_links FOR ALL
  USING (auth.role() = 'service_role');
