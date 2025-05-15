import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Check,
  CloudOff,
  Cloud,
  GitMerge,
  RefreshCw
} from 'lucide-react';
import {
  Conflict,
  ResolutionStrategy,
  resolveConflict,
  getUnresolvedConflicts
} from '@/utils/conflictResolution';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolving, setResolving] = useState<boolean>(false);
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>('merge');

  // Load conflicts when dialog opens
  useEffect(() => {
    if (open) {
      loadConflicts();
    }
  }, [open]);

  // Load unresolved conflicts
  const loadConflicts = async () => {
    setLoading(true);
    try {
      const unresolvedConflicts = await getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);

      // Set current conflict to the first one if available
      if (unresolvedConflicts.length > 0) {
        setCurrentConflict(unresolvedConflicts[0]);
      } else {
        setCurrentConflict(null);
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle conflict resolution
  const handleResolve = async () => {
    if (!currentConflict) return;

    setResolving(true);
    try {
      const success = await resolveConflict(currentConflict.id, selectedStrategy);

      if (success) {
        // Remove resolved conflict from the list
        setConflicts(prev => prev.filter(c => c.id !== currentConflict.id));

        // Set next conflict as current
        const nextConflict = conflicts.find(c => c.id !== currentConflict.id);
        setCurrentConflict(nextConflict || null);
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setResolving(false);
    }
  };

  // Format data for display
  const formatData = (data: any): string => {
    try {
      // Remove technical fields
      const { id, created_at, updated_at, user_id, ...displayData } = data;
      return JSON.stringify(displayData, null, 2);
    } catch (error) {
      return 'Error formatting data';
    }
  };

  // Get conflict type badge
  const getConflictBadge = (type: string) => {
    switch (type) {
      case 'local-newer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Local changes are newer</Badge>;
      case 'remote-newer':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Remote changes are newer</Badge>;
      case 'both-modified':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Both versions modified</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Resolve Data Conflicts
          </DialogTitle>
          <DialogDescription>
            These conflicts occurred when syncing data between your devices.
            Please review and resolve each conflict.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading conflicts...</span>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">No conflicts found</h3>
            <p className="text-muted-foreground mt-2">
              All your data is synchronized across your devices.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} to resolve
                </span>
                {currentConflict && (
                  <span className="text-sm text-muted-foreground">
                    ({conflicts.indexOf(currentConflict) + 1} of {conflicts.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadConflicts} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {currentConflict && (
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {currentConflict.type} Conflict
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {getConflictBadge(currentConflict.conflictType)}
                    <span className="text-xs text-muted-foreground ml-2">
                      ID: {currentConflict.localData.id}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="compare" className="w-full">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="compare">Compare</TabsTrigger>
                      <TabsTrigger value="local">Local Version</TabsTrigger>
                      <TabsTrigger value="remote">Remote Version</TabsTrigger>
                    </TabsList>

                    <TabsContent value="compare" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <CloudOff className="h-4 w-4 mr-2 text-blue-500" />
                            <h4 className="text-sm font-medium">Local Version</h4>
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(currentConflict.localUpdatedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <ScrollArea className="h-64 rounded-md border p-4">
                            <pre className="text-xs">{formatData(currentConflict.localData)}</pre>
                          </ScrollArea>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <Cloud className="h-4 w-4 mr-2 text-green-500" />
                            <h4 className="text-sm font-medium">Remote Version</h4>
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(currentConflict.remoteUpdatedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <ScrollArea className="h-64 rounded-md border p-4">
                            <pre className="text-xs">{formatData(currentConflict.remoteData)}</pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="local" className="mt-4">
                      <div className="flex items-center mb-2">
                        <CloudOff className="h-4 w-4 mr-2 text-blue-500" />
                        <h4 className="text-sm font-medium">Local Version</h4>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(currentConflict.localUpdatedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <ScrollArea className="h-64 rounded-md border p-4">
                        <pre className="text-xs">{formatData(currentConflict.localData)}</pre>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="remote" className="mt-4">
                      <div className="flex items-center mb-2">
                        <Cloud className="h-4 w-4 mr-2 text-green-500" />
                        <h4 className="text-sm font-medium">Remote Version</h4>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(currentConflict.remoteUpdatedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <ScrollArea className="h-64 rounded-md border p-4">
                        <pre className="text-xs">{formatData(currentConflict.remoteData)}</pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Resolution Strategy:</span>
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as ResolutionStrategy)}
                  disabled={!currentConflict || resolving}
                >
                  <option value="use-local">Use Local Version</option>
                  <option value="use-remote">Use Remote Version</option>
                  <option value="merge">Merge Both Versions</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={resolving}
          >
            Close
          </Button>

          {currentConflict && (
            <Button
              onClick={handleResolve}
              disabled={!currentConflict || resolving}
              className="gap-2"
            >
              {resolving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <GitMerge className="h-4 w-4" />
                  Resolve Conflict
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionDialog;
