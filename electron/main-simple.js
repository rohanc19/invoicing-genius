const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// Function to load the actual app
function loadActualApp() {
  console.log('Attempting to load the actual app...');

  // Get the absolute path to the dist directory
  const distDir = path.resolve(__dirname, '../dist');
  const indexPath = path.join(distDir, 'index.html');
  console.log('App path:', indexPath);

  // Create a server to serve the files
  const serveStatic = require('serve-static');
  const finalhandler = require('finalhandler');
  const http = require('http');

  // Create a static file server
  const serve = serveStatic(distDir, {
    index: ['index.html'],
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:");
    }
  });

  // Create server
  const server = http.createServer((req, res) => {
    console.log('Request for:', req.url);
    serve(req, res, finalhandler(req, res));
  });

  // Listen on a random port
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const appUrl = `http://localhost:${port}/`;
    console.log(`Server running at ${appUrl}`);

    // Load the app from the local server
    mainWindow.loadURL(appUrl);

    // Store the server in a global variable so it doesn't get garbage collected
    global.staticServer = server;
  });
}

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
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Disable web security for testing
      allowRunningInsecureContent: true, // Allow loading mixed content
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

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Load the test HTML file first to verify Electron is working
  const testHtmlPath = path.join(__dirname, 'test.html');
  console.log('Loading test HTML file:', testHtmlPath);
  mainWindow.loadFile(testHtmlPath);

  // Listen for the custom event from the renderer
  ipcMain.on('load-app', () => {
    console.log('Received load-app event from renderer');
    loadActualApp();
  });

  // Create a simple menu with debug options
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Debug',
      submenu: [
        {
          label: 'Load App',
          click: () => loadActualApp()
        },
        { role: 'toggleDevTools' },
        {
          label: 'Reload',
          click: () => mainWindow.reload()
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Add debugging event listeners
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window is ready to show');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create a simple application menu
  createSimpleMenu();
}

// Create the application menu
function createSimpleMenu() {
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



// Initialize the app
app.whenReady().then(() => {
  console.log('App is ready');

  // Register the app protocol before creating the window
  const protocol = require('electron').protocol;
  if (!protocol.isProtocolRegistered('app')) {
    protocol.registerFileProtocol('app', (request, callback) => {
      const filePath = path.normalize(`${__dirname}/../dist/${request.url.substr(6)}`);
      console.log('Protocol request for:', request.url, '-> Path:', filePath);
      callback({ path: filePath });
    });
  }

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
