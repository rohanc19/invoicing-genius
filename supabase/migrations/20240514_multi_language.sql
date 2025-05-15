-- Add default_language column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en';
