-- Migration 001: Add missing columns to user_settings
-- Run this if your database was created before these columns were added.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS budget_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10) DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS large_transaction_threshold DECIMAL(15, 2) DEFAULT 5000;
