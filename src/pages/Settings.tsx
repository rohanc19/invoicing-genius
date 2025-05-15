import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  HardDrive,
  Laptop,
  LayoutDashboard,
  RefreshCw,
  Settings as SettingsIcon,
  Smartphone,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProfileSettings from '@/components/ProfileSettings';
import NotificationSettings from '@/components/NotificationSettings';
import BackupRestoreManager from '@/components/BackupRestoreManager';
import ConflictResolutionDialog from '@/components/ConflictResolutionDialog';
import FileStorageDemo from '@/components/FileStorageDemo';
import { getUnresolvedConflicts } from '@/utils/conflictResolution';
import { syncPendingChanges } from '@/utils/offlineSync';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showConflictDialog, setShowConflictDialog] = useState<boolean>(false);
  const [conflictsCount, setConflictsCount] = useState<number>(0);

  // Check for conflicts
  const checkConflicts = async () => {
    try {
      const conflicts = await getUnresolvedConflicts();
      setConflictsCount(conflicts.length);

      if (conflicts.length > 0) {
        toast({
          title: 'Data Conflicts Detected',
          description: `You have ${conflicts.length} unresolved data conflicts.`,
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
      console.error('Error checking conflicts:', error);
    }
  };

  // Sync data
  const handleSync = async () => {
    if (!navigator.onLine) {
      toast({
        title: 'You are offline',
        description: 'Please connect to the internet to sync your data.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      await syncPendingChanges();
      await checkConflicts();

      toast({
        title: 'Sync Complete',
        description: 'Your data has been synchronized successfully.',
      });
    } catch (error) {
      console.error('Error syncing data:', error);

      toast({
        title: 'Sync Failed',
        description: 'There was an error synchronizing your data.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Check for conflicts when switching to sync tab
    if (value === 'sync') {
      checkConflicts();
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Data
            {conflictsCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {conflictsCount}
              </span>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Backup & Restore
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync & Devices
              {conflictsCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conflictsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <BackupRestoreManager />
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <FileStorageDemo />
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Laptop className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Desktop App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Invoicing Genius on your computer
                    </p>
                  </div>
                </div>

                <p className="text-sm mb-4">
                  Download the desktop application for a native experience on your computer.
                  All your data will sync automatically between devices.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Windows
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    macOS
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Linux
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Mobile App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Invoicing Genius on your phone or tablet
                    </p>
                  </div>
                </div>

                <p className="text-sm mb-4">
                  Download the mobile application to create and manage invoices on the go.
                  All your data will sync automatically between devices.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Android
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    iOS
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Sync Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage data synchronization between devices
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Sync Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {navigator.onLine ? 'Online - Ready to sync' : 'Offline - Changes will sync when you reconnect'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSync}
                      disabled={isSyncing || !navigator.onLine}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>

                  {conflictsCount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <div>
                        <h4 className="font-medium text-amber-800">Data Conflicts Detected</h4>
                        <p className="text-sm text-amber-700">
                          You have {conflictsCount} unresolved data {conflictsCount === 1 ? 'conflict' : 'conflicts'} that need your attention.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowConflictDialog(true)}
                        className="bg-white"
                      >
                        Resolve Conflicts
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
      />
    </DashboardLayout>
  );
};

export default Settings;
