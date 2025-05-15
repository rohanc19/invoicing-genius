import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Database name and version
const DB_NAME = 'invoicing-genius';
const DB_VERSION = 1;

// Object store names
const STORES = {
  INVOICES: 'invoices',
  ESTIMATES: 'estimates',
  CLIENTS: 'clients',
  PENDING_CHANGES: 'pendingChanges',
  SYNC_STATUS: 'syncStatus'
};

// Open IndexedDB
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.INVOICES)) {
        db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.ESTIMATES)) {
        db.createObjectStore(STORES.ESTIMATES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
        db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, { keyPath: 'id' });
        pendingStore.createIndex('type', 'type', { unique: false });
        pendingStore.createIndex('objectId', 'objectId', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.SYNC_STATUS)) {
        db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'id' });
      }
    };
  });
};

// Generic function to add an item to an object store
export const addToStore = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Ensure item has an ID
    if (!item.id) {
      item.id = uuidv4();
    }
    
    const request = store.put(item);
    
    request.onerror = () => {
      reject(new Error(`Failed to add item to ${storeName}`));
    };
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get an item from an object store
export const getFromStore = async <T>(
  storeName: string,
  id: string
): Promise<T | null> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onerror = () => {
      reject(new Error(`Failed to get item from ${storeName}`));
    };
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get all items from an object store
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName}`));
    };
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to delete an item from an object store
export const deleteFromStore = async (
  storeName: string,
  id: string
): Promise<void> => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => {
      reject(new Error(`Failed to delete item from ${storeName}`));
    };
    
    request.onsuccess = () => {
      resolve();
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Add a pending change to be synced later
export const addPendingChange = async (
  type: 'invoice' | 'estimate' | 'client',
  operation: 'create' | 'update' | 'delete',
  objectId: string,
  data?: any
): Promise<void> => {
  const pendingChange = {
    id: uuidv4(),
    type,
    operation,
    objectId,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0
  };
  
  await addToStore(STORES.PENDING_CHANGES, pendingChange);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncPendingChanges().catch(console.error);
  }
};

// Sync pending changes with the server
export const syncPendingChanges = async (): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }
  
  // Get all pending changes
  const pendingChanges = await getAllFromStore(STORES.PENDING_CHANGES);
  
  // Sort by timestamp (oldest first)
  pendingChanges.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  for (const change of pendingChanges) {
    try {
      let success = false;
      
      // Increment attempt counter
      change.attempts += 1;
      
      // Process based on type and operation
      if (change.type === 'invoice') {
        if (change.operation === 'create' || change.operation === 'update') {
          const { error } = await supabase
            .from('invoices')
            .upsert(change.data);
          
          success = !error;
        } else if (change.operation === 'delete') {
          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', change.objectId);
          
          success = !error;
        }
      } else if (change.type === 'estimate') {
        if (change.operation === 'create' || change.operation === 'update') {
          const { error } = await supabase
            .from('estimates')
            .upsert(change.data);
          
          success = !error;
        } else if (change.operation === 'delete') {
          const { error } = await supabase
            .from('estimates')
            .delete()
            .eq('id', change.objectId);
          
          success = !error;
        }
      } else if (change.type === 'client') {
        if (change.operation === 'create' || change.operation === 'update') {
          const { error } = await supabase
            .from('clients')
            .upsert(change.data);
          
          success = !error;
        } else if (change.operation === 'delete') {
          const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', change.objectId);
          
          success = !error;
        }
      }
      
      // If successful, remove from pending changes
      if (success) {
        await deleteFromStore(STORES.PENDING_CHANGES, change.id);
      } else if (change.attempts >= 5) {
        // If too many attempts, remove from pending changes
        await deleteFromStore(STORES.PENDING_CHANGES, change.id);
        
        // Notify user
        toast({
          title: 'Sync Failed',
          description: `Failed to sync ${change.type} after multiple attempts.`,
          variant: 'destructive',
        });
      } else {
        // Update attempts count
        await addToStore(STORES.PENDING_CHANGES, change);
      }
    } catch (error) {
      console.error('Error syncing change:', error);
    }
  }
  
  // Update last sync time
  await addToStore(STORES.SYNC_STATUS, {
    id: 'lastSync',
    timestamp: new Date().toISOString()
  });
};

// Initialize offline sync
export const initOfflineSync = (): void => {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    toast({
      title: 'You are online',
      description: 'Syncing your changes...',
    });
    
    syncPendingChanges().catch(console.error);
  });
  
  window.addEventListener('offline', () => {
    toast({
      title: 'You are offline',
      description: 'Changes will be saved locally and synced when you reconnect.',
    });
  });
  
  // Register sync event with service worker
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('sync-data');
    });
  }
  
  // Initial sync if online
  if (navigator.onLine) {
    syncPendingChanges().catch(console.error);
  }
};
