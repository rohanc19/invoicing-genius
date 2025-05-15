const { contextBridge, ipcRenderer } = require('electron');
const { firebaseAuth, firebaseFirestore, firebaseStorage } = require('./firebase-service');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // File operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    saveFile: (filePath, data) => ipcRenderer.invoke('save-file', { filePath, data }),
    readFile: (filePath) => ipcRenderer.invoke('read-file', { filePath }),

    // App menu events
    onMenuExportData: (callback) => ipcRenderer.on('menu-export-data', callback),
    onMenuImportData: (callback) => ipcRenderer.on('menu-import-data', callback),
    onMenuNewInvoice: (callback) => ipcRenderer.on('menu-new-invoice', callback),
    onMenuViewInvoices: (callback) => ipcRenderer.on('menu-view-invoices', callback),

    // Auto-updater events
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    installUpdate: () => ipcRenderer.send('install-update'),

    // Remove event listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);

// Expose Firebase auth methods to the renderer process
contextBridge.exposeInMainWorld(
  'firebaseAuth',
  {
    signUp: (email, password) => firebaseAuth.signUp(email, password),
    signIn: (email, password) => firebaseAuth.signIn(email, password),
    signOut: () => firebaseAuth.signOut(),
    getCurrentUser: () => firebaseAuth.getCurrentUser(),
    onAuthStateChanged: (callback) => firebaseAuth.onAuthStateChanged(callback)
  }
);

// Expose Firebase Firestore methods to the renderer process
contextBridge.exposeInMainWorld(
  'firebaseFirestore',
  {
    addDocument: (collection, data) => firebaseFirestore.addDocument(collection, data),
    setDocument: (collection, id, data) => firebaseFirestore.setDocument(collection, id, data),
    getDocument: (collection, id) => firebaseFirestore.getDocument(collection, id),
    getDocuments: (collection, constraints) => firebaseFirestore.getDocuments(collection, constraints),
    updateDocument: (collection, id, data) => firebaseFirestore.updateDocument(collection, id, data),
    deleteDocument: (collection, id) => firebaseFirestore.deleteDocument(collection, id)
  }
);

// Expose Firebase Storage methods to the renderer process
contextBridge.exposeInMainWorld(
  'firebaseStorage',
  {
    uploadFile: (path, file) => firebaseStorage.uploadFile(path, file),
    getFileURL: (path) => firebaseStorage.getFileURL(path),
    deleteFile: (path) => firebaseStorage.deleteFile(path)
  }
);
