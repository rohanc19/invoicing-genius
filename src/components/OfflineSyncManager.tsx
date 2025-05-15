import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, GitMerge, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConflictResolutionDialog from './ConflictResolutionDialog';
import { db } from '@/integrations/firebase/config';
import { collection, getDocs, query, where, writeBatch, doc, enableIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore';

const OfflineSyncManager: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(0);
  const [conflictsCount, setConflictsCount] = useState<number>(0);
  const [showSyncDialog, setShowSyncDialog] = useState<boolean>(false);
  const [showConflictDialog, setShowConflictDialog] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize Firebase offline persistence
  useEffect(() => {
    if (user) {
      // Enable IndexedDB persistence for offline support
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore persistence has been enabled.');
        })
        .catch((error) => {
          if (error.code === 'failed-precondition') {
            console.warn(
              'Multiple tabs open, persistence can only be enabled in one tab at a time.'
            );
          } else if (error.code === 'unimplemented') {
            console.warn(
              'The current browser does not support all of the features required to enable persistence.'
            );
          } else {
            console.error('Error enabling persistence:', error);
          }
        });
    }
  }, [user]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Re-enable network access for Firestore
      enableNetwork(db).then(() => {
        console.log('Network connection re-enabled for Firestore');
        checkPendingChanges();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Disable network access to force use of cache
      disableNetwork(db).then(() => {
        console.log('Network connection disabled for Firestore');
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending changes on mount
    checkPendingChanges();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for pending changes and conflicts with Firebase
  const checkPendingChanges = async () => {
    if (!user) return;

    try {
      // With Firebase, we don't need to manually track pending changes
      // Firebase handles this automatically with its offline persistence
      // We're just simulating the UI for now

      // For a real implementation, you could check the _metadata field
      // of documents to see if they have pending writes

      // Simulate pending changes count (in a real app, you'd check Firebase's pending writes)
      const pendingChangesCount = localStorage.getItem('pendingChangesCount')
        ? parseInt(localStorage.getItem('pendingChangesCount') || '0')
        : 0;

      setPendingChangesCount(pendingChangesCount);

      // Simulate conflicts (in a real app, you'd implement conflict detection)
      const conflictsCount = 0;
      setConflictsCount(conflictsCount);

      // If there are pending changes and we're online, show sync dialog
      if (pendingChangesCount > 0 && navigator.onLine) {
        setShowSyncDialog(true);
      }

      // If there are conflicts, show notification
      if (conflictsCount > 0) {
        toast({
          title: 'Data Conflicts Detected',
          description: `You have ${conflictsCount} unresolved data conflicts.`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConflictDialog(true)}
              className="bg-white"
            >
              Resolve
            </Button>
          ),
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  };

  // Handle manual sync with Firebase
  const handleSync = async () => {
    if (!navigator.onLine) {
      toast({
        title: 'You are offline',
        description: 'Please connect to the internet to sync your changes.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      // With Firebase, we don't need to manually sync changes
      // Firebase handles this automatically when the device comes online
      // We're just simulating the UI for now

      // Re-enable network for Firestore to trigger sync
      await enableNetwork(db);

      // Simulate a delay for the sync process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear the pending changes count
      localStorage.setItem('pendingChangesCount', '0');

      // Check for remaining conflicts and pending changes
      await checkPendingChanges();

      // Show success message
      toast({
        title: 'Sync Complete',
        description: 'Your changes have been synchronized with the server.',
      });
    } catch (error) {
      console.error('Error syncing changes:', error);
      toast({
        title: 'Sync Failed',
        description: 'There was an error synchronizing your changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
      setShowSyncDialog(false);
    }
  };

  // Handle conflict resolution
  const handleResolveConflicts = () => {
    setShowConflictDialog(true);
  };

  // This component doesn't render anything visible by default
  // It just manages the offline sync process and shows dialogs when needed
  return (
    <>
      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Sync Changes
            </DialogTitle>
            <DialogDescription>
              You have {pendingChangesCount} {pendingChangesCount === 1 ? 'change' : 'changes'} that
              need to be synchronized with the server.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              These changes were made while you were offline or couldn't connect to the server.
              Would you like to sync them now?
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(false)}
              disabled={isSyncing}
            >
              Later
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
      />

      {/* Status Indicators */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You are offline</span>
          </div>
        )}

        {/* Conflicts Indicator */}
        {conflictsCount > 0 && (
          <div className="bg-amber-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            <span className="text-sm font-medium">
              {conflictsCount} unresolved {conflictsCount === 1 ? 'conflict' : 'conflicts'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResolveConflicts}
              className="ml-2 h-7 text-white hover:text-white hover:bg-amber-600"
            >
              Resolve
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default OfflineSyncManager;
