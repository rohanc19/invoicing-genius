import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
  // Joined data
  email?: string;
  full_name?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  teamMembers: TeamMember[];
  invitations: TeamInvitation[];
  isLoading: boolean;
  userRole: 'owner' | 'admin' | 'member' | 'viewer' | null;
  setCurrentTeam: (team: Team | null) => void;
  createTeam: (name: string, description?: string) => Promise<Team | null>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  inviteMember: (teamId: string, email: string, role: 'admin' | 'member' | 'viewer') => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (teamId: string, userId: string, role: 'admin' | 'member' | 'viewer') => Promise<boolean>;
  acceptInvitation: (token: string) => Promise<boolean>;
  declineInvitation: (token: string) => Promise<boolean>;
  refreshTeams: () => Promise<void>;
  refreshTeamMembers: (teamId: string) => Promise<void>;
  refreshInvitations: (teamId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer' | null>(null);

  // Fetch user's teams
  const refreshTeams = async () => {
    if (!user) {
      setTeams([]);
      setCurrentTeam(null);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get teams the user owns
      const { data: ownedTeams, error: ownedError } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id);
        
      if (ownedError) throw ownedError;
      
      // Get teams the user is a member of
      const { data: memberTeams, error: memberError } = await supabase
        .from("team_members")
        .select(`
          team_id,
          role,
          teams:team_id(*)
        `)
        .eq("user_id", user.id);
        
      if (memberError) throw memberError;
      
      // Combine and deduplicate teams
      const memberTeamsData = memberTeams.map(item => item.teams) as Team[];
      const allTeams = [...ownedTeams, ...memberTeamsData];
      
      // Remove duplicates
      const uniqueTeams = allTeams.filter((team, index, self) =>
        index === self.findIndex(t => t.id === team.id)
      );
      
      setTeams(uniqueTeams);
      
      // Set current team from localStorage or use the first team
      const savedTeamId = localStorage.getItem('currentTeamId');
      if (savedTeamId) {
        const savedTeam = uniqueTeams.find(team => team.id === savedTeamId);
        if (savedTeam) {
          setCurrentTeam(savedTeam);
          await refreshTeamMembers(savedTeam.id);
          await refreshInvitations(savedTeam.id);
          
          // Set user role
          if (savedTeam.owner_id === user.id) {
            setUserRole('owner');
          } else {
            const memberInfo = memberTeams.find(m => m.team_id === savedTeam.id);
            setUserRole(memberInfo?.role as any || null);
          }
        } else if (uniqueTeams.length > 0) {
          setCurrentTeam(uniqueTeams[0]);
          localStorage.setItem('currentTeamId', uniqueTeams[0].id);
          await refreshTeamMembers(uniqueTeams[0].id);
          await refreshInvitations(uniqueTeams[0].id);
          
          // Set user role
          if (uniqueTeams[0].owner_id === user.id) {
            setUserRole('owner');
          } else {
            const memberInfo = memberTeams.find(m => m.team_id === uniqueTeams[0].id);
            setUserRole(memberInfo?.role as any || null);
          }
        }
      } else if (uniqueTeams.length > 0) {
        setCurrentTeam(uniqueTeams[0]);
        localStorage.setItem('currentTeamId', uniqueTeams[0].id);
        await refreshTeamMembers(uniqueTeams[0].id);
        await refreshInvitations(uniqueTeams[0].id);
        
        // Set user role
        if (uniqueTeams[0].owner_id === user.id) {
          setUserRole('owner');
        } else {
          const memberInfo = memberTeams.find(m => m.team_id === uniqueTeams[0].id);
          setUserRole(memberInfo?.role as any || null);
        }
      }
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error fetching teams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch team members
  const refreshTeamMembers = async (teamId: string) => {
    if (!user || !teamId) return;

    try {
      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          profiles:user_id(email:auth.users!user_id(email), full_name)
        `)
        .eq("team_id", teamId);
        
      if (error) throw error;
      
      // Transform data to include email and full_name
      const transformedData = data.map(member => ({
        ...member,
        email: member.profiles?.email || '',
        full_name: member.profiles?.full_name || '',
      }));
      
      setTeamMembers(transformedData);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
    }
  };

  // Fetch team invitations
  const refreshInvitations = async (teamId: string) => {
    if (!user || !teamId) return;

    try {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", teamId);
        
      if (error) throw error;
      
      setInvitations(data);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
    }
  };

  // Create a new team
  const createTeam = async (name: string, description?: string): Promise<Team | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the new team to the list
      setTeams(prev => [...prev, data]);
      
      // Set as current team
      setCurrentTeam(data);
      localStorage.setItem('currentTeamId', data.id);
      setUserRole('owner');
      
      toast({
        title: "Team created",
        description: `${name} has been created successfully.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update team details
  const updateTeam = async (id: string, data: Partial<Team>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
        
      if (error) throw error;
      
      // Update the team in the list
      setTeams(prev => prev.map(team => 
        team.id === id ? { ...team, ...data, updated_at: new Date().toISOString() } : team
      ));
      
      // Update current team if it's the one being updated
      if (currentTeam?.id === id) {
        setCurrentTeam(prev => prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null);
      }
      
      toast({
        title: "Team updated",
        description: "Team details have been updated successfully.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a team
  const deleteTeam = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Remove the team from the list
      setTeams(prev => prev.filter(team => team.id !== id));
      
      // If the current team is being deleted, set to null or another team
      if (currentTeam?.id === id) {
        const remainingTeams = teams.filter(team => team.id !== id);
        if (remainingTeams.length > 0) {
          setCurrentTeam(remainingTeams[0]);
          localStorage.setItem('currentTeamId', remainingTeams[0].id);
          await refreshTeamMembers(remainingTeams[0].id);
          await refreshInvitations(remainingTeams[0].id);
          
          // Set user role
          if (remainingTeams[0].owner_id === user.id) {
            setUserRole('owner');
          } else {
            const { data } = await supabase
              .from("team_members")
              .select("role")
              .eq("team_id", remainingTeams[0].id)
              .eq("user_id", user.id)
              .single();
              
            setUserRole((data?.role as any) || null);
          }
        } else {
          setCurrentTeam(null);
          localStorage.removeItem('currentTeamId');
          setUserRole(null);
        }
      }
      
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Invite a member to the team
  const inviteMember = async (teamId: string, email: string, role: 'admin' | 'member' | 'viewer'): Promise<boolean> => {
    if (!user) return false;

    try {
      // Generate a unique token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { data, error } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the new invitation to the list
      setInvitations(prev => [...prev, data]);
      
      // TODO: Send invitation email
      
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}.`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove a member from the team
  const removeMember = async (teamId: string, userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Remove the member from the list
      setTeamMembers(prev => prev.filter(member => member.user_id !== userId));
      
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Update a member's role
  const updateMemberRole = async (teamId: string, userId: string, role: 'admin' | 'member' | 'viewer'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("team_members")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("team_id", teamId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Update the member in the list
      setTeamMembers(prev => prev.map(member => 
        member.team_id === teamId && member.user_id === userId 
          ? { ...member, role, updated_at: new Date().toISOString() } 
          : member
      ));
      
      // If the current user's role is being updated, update userRole
      if (userId === user.id && currentTeam?.id === teamId) {
        setUserRole(role);
      }
      
      toast({
        title: "Role updated",
        description: "The team member's role has been updated successfully.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Accept an invitation
  const acceptInvitation = async (token: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("token", token)
        .single();
        
      if (invitationError) throw invitationError;
      
      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error("Invitation has expired");
      }
      
      // Add user to team
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: invitation.role,
        });
        
      if (memberError) throw memberError;
      
      // Delete the invitation
      await supabase
        .from("team_invitations")
        .delete()
        .eq("id", invitation.id);
        
      // Refresh teams
      await refreshTeams();
      
      toast({
        title: "Invitation accepted",
        description: "You have successfully joined the team.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error accepting invitation",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Decline an invitation
  const declineInvitation = async (token: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete the invitation
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("token", token);
        
      if (error) throw error;
      
      toast({
        title: "Invitation declined",
        description: "The invitation has been declined.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error declining invitation",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Set current team with side effects
  const handleSetCurrentTeam = async (team: Team | null) => {
    setCurrentTeam(team);
    
    if (team) {
      localStorage.setItem('currentTeamId', team.id);
      await refreshTeamMembers(team.id);
      await refreshInvitations(team.id);
      
      // Set user role
      if (team.owner_id === user?.id) {
        setUserRole('owner');
      } else {
        const { data } = await supabase
          .from("team_members")
          .select("role")
          .eq("team_id", team.id)
          .eq("user_id", user?.id)
          .single();
          
        setUserRole((data?.role as any) || null);
      }
    } else {
      localStorage.removeItem('currentTeamId');
      setUserRole(null);
    }
  };

  // Load teams when user changes
  useEffect(() => {
    refreshTeams();
  }, [user]);

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        teams,
        teamMembers,
        invitations,
        isLoading,
        userRole,
        setCurrentTeam: handleSetCurrentTeam,
        createTeam,
        updateTeam,
        deleteTeam,
        inviteMember,
        removeMember,
        updateMemberRole,
        acceptInvitation,
        declineInvitation,
        refreshTeams,
        refreshTeamMembers,
        refreshInvitations,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};
