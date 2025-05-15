-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backup_logs table
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'restore', 'delete')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own backups
CREATE POLICY select_own_backups ON backups
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own backups
CREATE POLICY insert_own_backups ON backups
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own backups
CREATE POLICY update_own_backups ON backups
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own backups
CREATE POLICY delete_own_backups ON backups
  FOR DELETE
  USING (user_id = auth.uid());

-- Add RLS policies for backup_logs
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own backup logs
CREATE POLICY select_own_backup_logs ON backup_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own backup logs
CREATE POLICY insert_own_backup_logs ON backup_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX idx_backups_user_id ON backups(user_id);
CREATE INDEX idx_backups_created_at ON backups(created_at);
CREATE INDEX idx_backup_logs_user_id ON backup_logs(user_id);
CREATE INDEX idx_backup_logs_backup_id ON backup_logs(backup_id);
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at);
