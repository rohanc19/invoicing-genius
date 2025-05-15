import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { addToStore, getFromStore, deleteFromStore } from './offlineSync';

// Define conflict types
export type ConflictType = 'local-newer' | 'remote-newer' | 'both-modified';

// Define conflict resolution strategies
export type ResolutionStrategy = 'use-local' | 'use-remote' | 'merge' | 'manual';

// Interface for conflict data
export interface Conflict {
  id: string;
  type: 'invoice' | 'estimate' | 'client';
  localData: any;
  remoteData: any;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  conflictType: ConflictType;
  resolved: boolean;
  resolution?: ResolutionStrategy;
}

// Store name for conflicts
const CONFLICTS_STORE = 'conflicts';

/**
 * Detect conflicts between local and remote data
 * @param type Data type (invoice, estimate, client)
 * @param localData Local data object
 * @param remoteData Remote data object
 * @returns Conflict type or null if no conflict
 */
export const detectConflict = (
  type: 'invoice' | 'estimate' | 'client',
  localData: any,
  remoteData: any
): ConflictType | null => {
  // If either doesn't exist, no conflict
  if (!localData || !remoteData) {
    return null;
  }

  // Get timestamps
  const localUpdatedAt = new Date(localData.updated_at || localData.created_at);
  const remoteUpdatedAt = new Date(remoteData.updated_at || remoteData.created_at);

  // Compare timestamps
  if (localUpdatedAt > remoteUpdatedAt) {
    return 'local-newer';
  } else if (remoteUpdatedAt > localUpdatedAt) {
    return 'remote-newer';
  } else if (JSON.stringify(localData) !== JSON.stringify(remoteData)) {
    // Same timestamp but different data
    return 'both-modified';
  }

  // No conflict
  return null;
};

/**
 * Record a conflict for later resolution
 * @param type Data type
 * @param localData Local data
 * @param remoteData Remote data
 * @param conflictType Type of conflict
 * @returns Conflict ID
 */
export const recordConflict = async (
  type: 'invoice' | 'estimate' | 'client',
  localData: any,
  remoteData: any,
  conflictType: ConflictType
): Promise<string> => {
  const conflict: Conflict = {
    id: `${type}-${localData.id}-${Date.now()}`,
    type,
    localData,
    remoteData,
    localUpdatedAt: localData.updated_at || localData.created_at,
    remoteUpdatedAt: remoteData.updated_at || remoteData.created_at,
    conflictType,
    resolved: false
  };

  await addToStore(CONFLICTS_STORE, conflict);
  
  // Notify user
  toast({
    title: 'Data Conflict Detected',
    description: `A conflict was detected in a ${type}. Please resolve it in the settings.`,
    variant: 'destructive',
  });

  return conflict.id;
};

/**
 * Get all unresolved conflicts
 * @returns List of unresolved conflicts
 */
export const getUnresolvedConflicts = async (): Promise<Conflict[]> => {
  try {
    const allConflicts = await getFromStore<Conflict[]>(CONFLICTS_STORE, 'all') || [];
    return allConflicts.filter(conflict => !conflict.resolved);
  } catch (error) {
    console.error('Error getting unresolved conflicts:', error);
    return [];
  }
};

/**
 * Resolve a conflict using the specified strategy
 * @param conflictId Conflict ID
 * @param strategy Resolution strategy
 * @returns Success status
 */
export const resolveConflict = async (
  conflictId: string,
  strategy: ResolutionStrategy
): Promise<boolean> => {
  try {
    // Get the conflict
    const conflict = await getFromStore<Conflict>(CONFLICTS_STORE, conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Apply resolution strategy
    let resolvedData: any;
    
    switch (strategy) {
      case 'use-local':
        resolvedData = conflict.localData;
        break;
      
      case 'use-remote':
        resolvedData = conflict.remoteData;
        break;
      
      case 'merge':
        // Simple merge strategy - take remote but preserve local changes
        resolvedData = {
          ...conflict.remoteData,
          ...conflict.localData,
          updated_at: new Date().toISOString()
        };
        break;
      
      case 'manual':
        // This should be handled by the UI
        return false;
      
      default:
        throw new Error('Invalid resolution strategy');
    }

    // Update the data in Supabase
    let error;
    
    if (conflict.type === 'invoice') {
      ({ error } = await supabase
        .from('invoices')
        .upsert(resolvedData));
    } else if (conflict.type === 'estimate') {
      ({ error } = await supabase
        .from('estimates')
        .upsert(resolvedData));
    } else if (conflict.type === 'client') {
      ({ error } = await supabase
        .from('clients')
        .upsert(resolvedData));
    }

    if (error) {
      throw error;
    }

    // Update local data
    await addToStore(conflict.type + 's', resolvedData);

    // Mark conflict as resolved
    conflict.resolved = true;
    conflict.resolution = strategy;
    await addToStore(CONFLICTS_STORE, conflict);

    toast({
      title: 'Conflict Resolved',
      description: `The ${conflict.type} conflict has been resolved successfully.`,
    });

    return true;
  } catch (error) {
    console.error('Error resolving conflict:', error);
    
    toast({
      title: 'Error Resolving Conflict',
      description: error.message || 'An error occurred while resolving the conflict.',
      variant: 'destructive',
    });
    
    return false;
  }
};

/**
 * Auto-resolve conflicts based on predefined rules
 * @returns Number of auto-resolved conflicts
 */
export const autoResolveConflicts = async (): Promise<number> => {
  try {
    const conflicts = await getUnresolvedConflicts();
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      let strategy: ResolutionStrategy;

      // Apply auto-resolution rules
      if (conflict.conflictType === 'local-newer') {
        strategy = 'use-local';
      } else if (conflict.conflictType === 'remote-newer') {
        strategy = 'use-remote';
      } else {
        // For both-modified, we can't auto-resolve
        continue;
      }

      const success = await resolveConflict(conflict.id, strategy);
      if (success) {
        resolvedCount++;
      }
    }

    return resolvedCount;
  } catch (error) {
    console.error('Error auto-resolving conflicts:', error);
    return 0;
  }
};

/**
 * Delete a resolved conflict
 * @param conflictId Conflict ID
 * @returns Success status
 */
export const deleteConflict = async (conflictId: string): Promise<boolean> => {
  try {
    await deleteFromStore(CONFLICTS_STORE, conflictId);
    return true;
  } catch (error) {
    console.error('Error deleting conflict:', error);
    return false;
  }
};
