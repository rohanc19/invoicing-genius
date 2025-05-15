const { contextBridge, ipcRenderer } = require('electron');

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
    },

    // Utility functions
    isElectron: true,
    getAppVersion: () => require('electron').app.getVersion(),

    // Mock API for offline use
    mockApi: {
      get: async (endpoint) => {
        console.log('Mock API GET:', endpoint);
        return { success: true, data: { mockData: true, endpoint } };
      },
      post: async (endpoint, data) => {
        console.log('Mock API POST:', endpoint, data);
        return { success: true, data: { mockData: true, endpoint, received: data } };
      }
    }
  }
);
