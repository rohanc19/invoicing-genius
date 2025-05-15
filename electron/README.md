# Invoicing Genius Desktop Application

This is the desktop application for Invoicing Genius, built with Electron to provide a native desktop experience for the Invoicing Genius web application.

## Features

- Native desktop application for Windows, macOS, and Linux
- Offline capability with data synchronization
- Native system integrations (file system access, notifications)
- Auto-updates for seamless version upgrades
- Export and import functionality

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- For icon creation: ImageMagick (`convert` command must be available)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create application icons (requires ImageMagick):

```bash
npm run create-icons
```

3. Start the development server:

```bash
# From the root directory of the project
npm run electron:dev
```

This will start both the React development server and the Electron application.

## Building the Application

To build the desktop application for distribution:

```bash
# From the root directory of the project
npm run electron:build
```

This will:
1. Build the React application
2. Package it with Electron
3. Create installers for your current platform

### Platform-Specific Builds

To build for a specific platform:

```bash
# From the electron directory
npm run build:win    # For Windows
npm run build:mac    # For macOS
npm run build:linux  # For Linux
```

The built installers will be available in the `dist` directory.

## Application Structure

- `main.js`: The main Electron process file
- `preload.js`: Preload script for secure communication between Electron and the web app
- `icons/`: Application icons for different platforms
- `package.json`: Electron application configuration

## Troubleshooting

### Common Issues

1. **"App throws error: Cannot find module..."**
   - Make sure all dependencies are installed with `npm install`

2. **"Icons not showing up correctly"**
   - Run `npm run create-icons` to regenerate icons
   - Ensure ImageMagick is installed on your system

3. **"White screen when launching the app"**
   - Check the console for errors (View > Toggle Developer Tools)
   - Ensure the React app is built correctly

## License

MIT
