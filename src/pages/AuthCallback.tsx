import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '@/integrations/supabase/real-client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const supabaseClient = getSupabaseClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the URL hash
      const hash = window.location.hash;
      
      // Process the hash if it exists
      if (hash) {
        try {
          // Exchange the auth code for a session
          const { data, error } = await supabaseClient.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            // Redirect to the dashboard
            navigate('/');
          } else {
            // Redirect to the login page
            navigate('/auth');
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
          navigate('/auth');
        }
      } else {
        // No hash, redirect to the login page
        navigate('/auth');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;
