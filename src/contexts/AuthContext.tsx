
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { firebaseAuthService } from "@/integrations/supabase/real-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string, company_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener
    const unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);

      if (user) {
        toast({
          title: "Signed in successfully",
          description: "Welcome to Invoicing Genius",
        });
      }
    });

    // Clean up subscription
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user, error } = await firebaseAuthService.signIn(email, password);

      if (error) {
        throw new Error(error);
      }

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string, company_name?: string }) => {
    try {
      setIsLoading(true);
      const { user, error } = await firebaseAuthService.signUp(email, password);

      if (error) {
        throw new Error(error);
      }

      // Store user metadata in Firestore if needed
      // This would be implemented in a separate function using firestoreService

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account",
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await firebaseAuthService.signOut();

      if (error) {
        throw new Error(error);
      }

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
