/**
 * Local File Storage Utility
 * 
 * This utility provides methods for storing and retrieving files locally:
 * - In Electron: Uses the filesystem directly
 * - In Web: Uses IndexedDB for storage
 */

import { v4 as uuidv4 } from 'uuid';

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

// IndexedDB setup for web
const DB_NAME = 'invoicing_genius_files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Initialize IndexedDB
const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('Error opening IndexedDB'));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// File metadata interface
interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  path?: string; // Only for Electron
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save a file to local storage
 * @param file The file to save
 * @param directory Optional directory path (for Electron)
 * @returns A promise that resolves to the file metadata
 */
export const saveFile = async (
  file: File | Blob,
  directory: string = 'invoices'
): Promise<{ metadata: FileMetadata | null; error: string | null }> => {
  try {
    const fileId = uuidv4();
    const fileName = file instanceof File ? file.name : `${fileId}.${file.type.split('/')[1] || 'bin'}`;
    const now = new Date();

    // Electron implementation
    if (isElectron() && window.electron) {
      // Create a path for the file
      const filePath = `${directory}/${fileName}`;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save file using Electron's file system access
      const result = await window.electron.saveFile(filePath, buffer.toString('base64'));
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save file');
      }
      
      // Return metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: fileName,
        type: file.type,
        size: file.size,
        path: filePath,
        createdAt: now,
        updatedAt: now
      };
      
      return { metadata, error: null };
    } 
    // Web implementation using IndexedDB
    else {
      const db = await initIndexedDB();
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Create metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: fileName,
        type: file.type,
        size: file.size,
        createdAt: now,
        updatedAt: now
      };
      
      // Store file and metadata in IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.put({
          id: fileId,
          metadata,
          data: arrayBuffer
        });
        
        request.onsuccess = () => {
          resolve({ metadata, error: null });
        };
        
        request.onerror = () => {
          reject(new Error('Failed to save file to IndexedDB'));
        };
      });
    }
  } catch (error: any) {
    console.error('Error saving file:', error);
    return { metadata: null, error: error.message };
  }
};

/**
 * Get a file from local storage
 * @param fileId The ID of the file to retrieve
 * @returns A promise that resolves to the file and its metadata
 */
export const getFile = async (
  fileId: string
): Promise<{ file: Blob | null; metadata: FileMetadata | null; error: string | null }> => {
  try {
    // Electron implementation
    if (isElectron() && window.electron) {
      // First, get the file metadata from Firestore
      // This assumes you're storing file metadata in Firestore
      // You'll need to implement this part based on your data structure
      
      // For now, we'll just read the file if we have the path
      const filePath = `${fileId}`; // You'll need to get the actual path
      
      const result = await window.electron.readFile({ filePath });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read file');
      }
      
      // Convert base64 to Blob
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create a blob from the binary data
      const blob = new Blob([bytes]);
      
      // Return file and metadata
      // Note: In a real implementation, you'd get the metadata from Firestore
      const metadata: FileMetadata = {
        id: fileId,
        name: filePath.split('/').pop() || '',
        type: 'application/octet-stream', // You'd get this from metadata
        size: blob.size,
        path: filePath,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return { file: blob, metadata, error: null };
    } 
    // Web implementation using IndexedDB
    else {
      const db = await initIndexedDB();
      
      // Get file from IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.get(fileId);
        
        request.onsuccess = () => {
          if (request.result) {
            const { metadata, data } = request.result;
            const blob = new Blob([data], { type: metadata.type });
            resolve({ file: blob, metadata, error: null });
          } else {
            resolve({ file: null, metadata: null, error: 'File not found' });
          }
        };
        
        request.onerror = () => {
          reject(new Error('Failed to retrieve file from IndexedDB'));
        };
      });
    }
  } catch (error: any) {
    console.error('Error getting file:', error);
    return { file: null, metadata: null, error: error.message };
  }
};

/**
 * Delete a file from local storage
 * @param fileId The ID of the file to delete
 * @returns A promise that resolves to a success indicator
 */
export const deleteFile = async (
  fileId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Electron implementation
    if (isElectron() && window.electron) {
      // First, get the file metadata to get the path
      // This assumes you're storing file metadata in Firestore
      
      // For now, we'll just delete the file if we have the path
      const filePath = `${fileId}`; // You'll need to get the actual path
      
      // Delete the file using Node.js fs module via Electron
      // This would be implemented in your preload.js and main.js
      // For now, we'll just return success
      
      return { success: true, error: null };
    } 
    // Web implementation using IndexedDB
    else {
      const db = await initIndexedDB();
      
      // Delete file from IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.delete(fileId);
        
        request.onsuccess = () => {
          resolve({ success: true, error: null });
        };
        
        request.onerror = () => {
          reject(new Error('Failed to delete file from IndexedDB'));
        };
      });
    }
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};
