import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  Archive, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Calendar, 
  Check, 
  Clock, 
  Download, 
  FileText, 
  HardDrive, 
  RefreshCw, 
  Save, 
  Trash, 
  Upload 
} from 'lucide-react';
import { createBackup, downloadBackup, restoreFromBackup } from '@/utils/backupUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface Backup {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: 'manual' | 'automatic';
  created_at: string;
  data: any;
}

const BackupRestoreManager: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('backup');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Backup options
  const [backupOptions, setBackupOptions] = useState({
    includeInvoices: true,
    includeEstimates: true,
    includeClients: true,
    includeRecurringInvoices: true,
    includeProfile: true,
    includeSettings: true,
    includeProducts: true,
    backupName: `Backup ${new Date().toLocaleDateString()}`,
    backupDescription: '',
  });
  
  // Restore options
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: false,
    importInvoices: true,
    importEstimates: true,
    importClients: true,
    importRecurringInvoices: true,
    importProfile: true,
    importSettings: true,
    importProducts: true,
  });

  // Load backups
  useEffect(() => {
    if (user) {
      loadBackups();
    }
  }, [user]);

  // Load backups from database
  const loadBackups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      
      toast({
        title: 'Error Loading Backups',
        description: 'There was an error loading your backups.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    if (!user) return;
    
    setIsCreatingBackup(true);
    
    try {
      const backup = await createBackup(user.id, {
        ...backupOptions,
        backupType: 'manual',
      });
      
      toast({
        title: 'Backup Created',
        description: 'Your data has been backed up successfully.',
      });
      
      // Reload backups
      await loadBackups();
      
      // Close dialog
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating backup:', error);
      
      toast({
        title: 'Error Creating Backup',
        description: 'There was an error creating your backup.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download backup
  const handleDownloadBackup = (backup: Backup) => {
    try {
      downloadBackup(
        backup.data,
        `invoicing-genius-backup-${format(new Date(backup.created_at), 'yyyy-MM-dd-HHmmss')}.json`
      );
    } catch (error) {
      console.error('Error downloading backup:', error);
      
      toast({
        title: 'Error Downloading Backup',
        description: 'There was an error downloading your backup.',
        variant: 'destructive',
      });
    }
  };

  // Delete backup
  const handleDeleteBackup = async () => {
    if (!user || !selectedBackup) return;
    
    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', selectedBackup.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Backup Deleted',
        description: 'Your backup has been deleted successfully.',
      });
      
      // Reload backups
      await loadBackups();
      
      // Close dialog
      setShowDeleteDialog(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Error deleting backup:', error);
      
      toast({
        title: 'Error Deleting Backup',
        description: 'There was an error deleting your backup.',
        variant: 'destructive',
      });
    }
  };

  // Restore from backup
  const handleRestoreFromBackup = async () => {
    if (!user || !selectedBackup) return;
    
    setIsRestoring(true);
    
    try {
      await restoreFromBackup(selectedBackup.data, user.id, restoreOptions);
      
      // Close dialog
      setShowRestoreDialog(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Error restoring from backup:', error);
      
      toast({
        title: 'Error Restoring Backup',
        description: 'There was an error restoring your backup.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        // Validate backup data
        if (!backupData.version || !backupData.user_id || !backupData.data) {
          throw new Error('Invalid backup file format');
        }
        
        // Create a temporary backup object
        const tempBackup: Backup = {
          id: 'temp',
          user_id: user?.id || '',
          name: 'Uploaded Backup',
          description: 'Uploaded from file',
          type: 'manual',
          created_at: new Date().toISOString(),
          data: backupData,
        };
        
        setSelectedBackup(tempBackup);
        setShowRestoreDialog(true);
      } catch (error) {
        console.error('Error parsing backup file:', error);
        
        toast({
          title: 'Invalid Backup File',
          description: 'The selected file is not a valid backup file.',
          variant: 'destructive',
        });
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Backup your data and restore it when needed
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="backup" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backup">
              <Save className="h-4 w-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="restore">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Restore
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Backups</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBackups}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No backups found</h3>
                <p className="text-muted-foreground mt-2">
                  Create a backup to protect your data
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create First Backup
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span>{backup.name}</span>
                          </div>
                          {backup.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {backup.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {backup.type === 'manual' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Manual
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <Calendar className="h-3 w-3 mr-1" />
                              Automatic
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(backup.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                              <span className="sr-only">Restore</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 pt-4">
            <div className="flex flex-col gap-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Restore from File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a backup file to restore your data
                </p>
                
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Restore from Cloud</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a backup from your cloud storage
                </p>
                
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('backup')}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  View Your Backups
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Select what data you want to include in your backup
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backupName">Backup Name</Label>
              <Input
                id="backupName"
                value={backupOptions.backupName}
                onChange={(e) => setBackupOptions({ ...backupOptions, backupName: e.target.value })}
                placeholder="Enter a name for your backup"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backupDescription">Description (Optional)</Label>
              <Textarea
                id="backupDescription"
                value={backupOptions.backupDescription}
                onChange={(e) => setBackupOptions({ ...backupOptions, backupDescription: e.target.value })}
                placeholder="Enter a description for your backup"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Include Data</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInvoices"
                    checked={backupOptions.includeInvoices}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeInvoices: !!checked })
                    }
                  />
                  <Label htmlFor="includeInvoices">Invoices</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeEstimates"
                    checked={backupOptions.includeEstimates}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeEstimates: !!checked })
                    }
                  />
                  <Label htmlFor="includeEstimates">Estimates</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeClients"
                    checked={backupOptions.includeClients}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeClients: !!checked })
                    }
                  />
                  <Label htmlFor="includeClients">Clients</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRecurringInvoices"
                    checked={backupOptions.includeRecurringInvoices}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeRecurringInvoices: !!checked })
                    }
                  />
                  <Label htmlFor="includeRecurringInvoices">Recurring Invoices</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProfile"
                    checked={backupOptions.includeProfile}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeProfile: !!checked })
                    }
                  />
                  <Label htmlFor="includeProfile">Profile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSettings"
                    checked={backupOptions.includeSettings}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeSettings: !!checked })
                    }
                  />
                  <Label htmlFor="includeSettings">Settings</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProducts"
                    checked={backupOptions.includeProducts}
                    onCheckedChange={(checked) => 
                      setBackupOptions({ ...backupOptions, includeProducts: !!checked })
                    }
                  />
                  <Label htmlFor="includeProducts">Products</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreatingBackup}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              {selectedBackup?.name || 'Uploaded Backup'} - {format(new Date(selectedBackup?.created_at || new Date()), 'MMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="border rounded-md p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-700">Warning</h4>
                  <p className="text-sm text-amber-600">
                    Restoring a backup will overwrite your current data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Restore Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwriteExisting"
                    checked={restoreOptions.overwriteExisting}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, overwriteExisting: !!checked })
                    }
                  />
                  <Label htmlFor="overwriteExisting">Overwrite existing data</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Include Data</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importInvoices"
                    checked={restoreOptions.importInvoices}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importInvoices: !!checked })
                    }
                  />
                  <Label htmlFor="importInvoices">Invoices</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importEstimates"
                    checked={restoreOptions.importEstimates}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importEstimates: !!checked })
                    }
                  />
                  <Label htmlFor="importEstimates">Estimates</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importClients"
                    checked={restoreOptions.importClients}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importClients: !!checked })
                    }
                  />
                  <Label htmlFor="importClients">Clients</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importRecurringInvoices"
                    checked={restoreOptions.importRecurringInvoices}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importRecurringInvoices: !!checked })
                    }
                  />
                  <Label htmlFor="importRecurringInvoices">Recurring Invoices</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importProfile"
                    checked={restoreOptions.importProfile}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importProfile: !!checked })
                    }
                  />
                  <Label htmlFor="importProfile">Profile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importSettings"
                    checked={restoreOptions.importSettings}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importSettings: !!checked })
                    }
                  />
                  <Label htmlFor="importSettings">Settings</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="importProducts"
                    checked={restoreOptions.importProducts}
                    onCheckedChange={(checked) => 
                      setRestoreOptions({ ...restoreOptions, importProducts: !!checked })
                    }
                  />
                  <Label htmlFor="importProducts">Products</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreDialog(false);
                setSelectedBackup(null);
              }}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreFromBackup}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Restore Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Backup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedBackup.name}</span>
              </div>
              
              {selectedBackup.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedBackup.description}
                </p>
              )}
              
              <p className="text-sm">
                Created on {format(new Date(selectedBackup.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedBackup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBackup}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BackupRestoreManager;
