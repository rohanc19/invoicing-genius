-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table to link users with teams
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create team_invitations table to manage pending invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, email)
);

-- Add team_id column to existing tables
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_invoices_team_id ON invoices(team_id);
CREATE INDEX idx_estimates_team_id ON estimates(team_id);
CREATE INDEX idx_clients_team_id ON clients(team_id);
CREATE INDEX idx_recurring_invoices_team_id ON recurring_invoices(team_id);

-- Add RLS policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select teams they are members of
CREATE POLICY select_own_teams ON teams
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own teams
CREATE POLICY insert_own_teams ON teams
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Policy to allow team owners to update their teams
CREATE POLICY update_own_teams ON teams
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Policy to allow team owners to delete their teams
CREATE POLICY delete_own_teams ON teams
  FOR DELETE
  USING (owner_id = auth.uid());

-- Add RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select team members for their teams
CREATE POLICY select_team_members ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy to allow team owners and admins to insert team members
CREATE POLICY insert_team_members ON team_members
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy to allow team owners and admins to update team members
CREATE POLICY update_team_members ON team_members
  FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy to allow team owners and admins to delete team members
CREATE POLICY delete_team_members ON team_members
  FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Add RLS policies for team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select invitations for their teams
CREATE POLICY select_team_invitations ON team_invitations
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy to allow team owners and admins to insert invitations
CREATE POLICY insert_team_invitations ON team_invitations
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy to allow team owners and admins to delete invitations
CREATE POLICY delete_team_invitations ON team_invitations
  FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Update RLS policies for invoices to include team access
CREATE POLICY select_team_invoices ON invoices
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies for estimates to include team access
CREATE POLICY select_team_estimates ON estimates
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies for clients to include team access
CREATE POLICY select_team_clients ON clients
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies for recurring_invoices to include team access
CREATE POLICY select_team_recurring_invoices ON recurring_invoices
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
