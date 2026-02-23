-- Allow one Telegram account to be a receiver on multiple subscriptions.
-- The non-unique index idx_receivers_telegram_chat_id remains for query performance.
ALTER TABLE receivers DROP CONSTRAINT receivers_telegram_chat_id_key;
