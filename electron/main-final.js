const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const { firebaseAuth, firebaseFirestore } = require('./firebase-service');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
let staticServer;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons/icon.png'),
    show: false, // Don't show until ready-to-show
    backgroundColor: '#f8fafc' // Light background color
  });

  // Set content security policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:"]
      }
    });
  });

  // Start a local server to serve the Vite-built application
  startLocalServer();

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window is ready to show');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;

    // Close the static server when the window is closed
    if (staticServer) {
      staticServer.close();
      staticServer = null;
    }
  });

  // Create application menu
  createMenu();
}

// Start a local server to serve the Vite-built application
function startLocalServer() {
  // Get the absolute path to the dist directory
  const distDir = path.resolve(__dirname, '../dist');
  console.log('Serving from:', distDir);

  // Create a static file server
  const serve = serveStatic(distDir, {
    index: ['index.html'],
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:");
    }
  });

  // Create server
  staticServer = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });

  // Listen on a random port
  staticServer.listen(0, '127.0.0.1', () => {
    const port = staticServer.address().port;
    const appUrl = `http://localhost:${port}/`;
    console.log(`Server running at ${appUrl}`);

    // Load the app from the local server
    mainWindow.loadURL(appUrl);
  });
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
        { role: 'toggleDevTools' },
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
    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Check if data is base64 encoded
    if (typeof data === 'string' && data.includes(';base64,')) {
      // Extract base64 data
      const base64Data = data.split(';base64,').pop();
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    } else if (typeof data === 'string' && /^[A-Za-z0-9+/=]+$/.test(data)) {
      // Directly decode base64 string
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    } else {
      // Regular string data
      fs.writeFileSync(filePath, data);
    }

    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

// Handle file read
ipcMain.handle('read-file', async (event, { filePath }) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    // Read file as buffer
    const buffer = fs.readFileSync(filePath);

    // Convert to base64 for transfer
    const data = buffer.toString('base64');

    return {
      success: true,
      data,
      filePath,
      size: buffer.length,
      lastModified: fs.statSync(filePath).mtime.getTime()
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

// Handle file delete
ipcMain.handle('delete-file', async (event, { filePath }) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
});

// Get app path
ipcMain.handle('get-app-path', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    return { success: true, path: userDataPath };
  } catch (error) {
    console.error('Error getting app path:', error);
    return { success: false, error: error.message };
  }
});

// Initialize the app
app.whenReady().then(() => {
  console.log('App is ready');
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
