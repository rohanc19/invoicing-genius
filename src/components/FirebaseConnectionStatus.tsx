import React, { useEffect, useState } from 'react';
import { db } from '@/integrations/firebase/config';
import { onSnapshot, doc } from 'firebase/firestore';
import { Badge } from './ui/badge';

const FirebaseConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Create a reference to the special Firestore collection for connection status
    const connectedRef = doc(db, '.info/connected');
    
    // Listen for changes to the connection status
    const unsubscribe = onSnapshot(connectedRef, (snap) => {
      setIsConnected(snap.exists() && snap.data()?.connected === true);
    }, (error) => {
      console.error('Error getting connection status:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected === null) {
    return (
      <Badge variant="outline" className="animate-pulse">
        Checking connection...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="success" className="bg-green-500 text-white">
        Connected to Firebase
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      Disconnected from Firebase
    </Badge>
  );
};

export default FirebaseConnectionStatus;
