const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const { autoUpdater } = require('electron-updater');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window with simplified options
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true, // Enable node integration for testing
      contextIsolation: false, // Disable context isolation for testing
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons/icon.png'),
    show: true, // Show immediately
    backgroundColor: '#f8fafc' // Light background color
  });

  // Set Content Security Policy - very permissive for troubleshooting
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: gap: https: file:;",
          "img-src * 'self' data: blob: file:;",
          "script-src * 'self' 'unsafe-inline' 'unsafe-eval';",
          "style-src * 'self' 'unsafe-inline';"
        ]
      }
    });
  });

  // Load the app
  if (isDev) {
    // In development, load from local dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // Load the super minimal HTML file
    const htmlPath = path.join(__dirname, 'super-minimal.html');
    console.log('Loading HTML file from path:', htmlPath);
    mainWindow.loadFile(htmlPath);

    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools();

    // Set up protocol for loading local files
    mainWindow.webContents.session.webRequest.onBeforeRequest({ urls: ['file://*/*'] },
      (details, callback) => {
        callback({});
      }
    );
  }

  // Handle window ready-to-show event
  mainWindow.once('ready-to-show', () => {
    console.log('Window is ready to show');

    // Only check for updates in production
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    } else {
      console.log('Skipping update check in development mode');
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

// Create the application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          click: () => {
            mainWindow.webContents.send('menu-export-data');
          }
        },
        {
          label: 'Import Data',
          click: () => {
            mainWindow.webContents.send('menu-import-data');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Invoices',
      submenu: [
        {
          label: 'New Invoice',
          click: () => {
            mainWindow.webContents.send('menu-new-invoice');
          }
        },
        {
          label: 'View All Invoices',
          click: () => {
            mainWindow.webContents.send('menu-view-invoices');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Invoicing Genius',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Invoicing Genius',
              message: 'Invoicing Genius',
              detail: 'Version: ' + app.getVersion() + '\nA simple invoicing application for small businesses.',
              buttons: ['OK'],
              icon: path.join(__dirname, 'icons/icon.png')
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            if (app.isPackaged) {
              autoUpdater.checkForUpdatesAndNotify();
            } else {
              dialog.showMessageBox(mainWindow, {
                title: 'Updates',
                message: 'Update Check',
                detail: 'Updates are only available in the packaged application.',
                buttons: ['OK']
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Support',
          click: async () => {
            await shell.openExternal('https://example.com/support');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle file save dialog
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Handle file open dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Handle file save
ipcMain.handle('save-file', async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle file read
ipcMain.handle('read-file', async (event, { filePath }) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded');
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Initialize the app
app.whenReady().then(() => {
  createWindow();

  // On macOS, recreate window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
