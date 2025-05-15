import React, { useEffect, useState } from 'react';
import { auth } from '@/integrations/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { signOut } from '@/integrations/firebase/auth';

const FirebaseAuthStatus: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="animate-pulse">
          Checking auth status...
        </Badge>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="success" className="bg-green-500 text-white">
          Authenticated as {user.email}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="destructive">Not authenticated</Badge>
    </div>
  );
};

export default FirebaseAuthStatus;
