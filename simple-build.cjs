const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Log with color
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Execute a command and log output
const execute = (command, options = {}) => {
  log(`\n${colors.bright}${colors.cyan}Executing: ${command}${colors.reset}\n`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`\n${colors.red}Command failed: ${error.message}${colors.reset}\n`);
    return false;
  }
};

// Main build function
const buildElectron = async () => {
  log(`\n${colors.bright}${colors.green}=== Building Invoicing Genius Desktop App (Simple Version) ===${colors.reset}\n`);

  // Step 1: Build React app
  log(`\n${colors.yellow}Step 1: Building React app...${colors.reset}\n`);
  if (!execute('npm run build')) {
    log(`${colors.red}Failed to build React app. Aborting.${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Create app directory structure
  log(`\n${colors.yellow}Step 2: Creating app directory structure...${colors.reset}\n`);
  const appDir = path.join(__dirname, 'app-dist');

  // Clean up previous build
  if (fs.existsSync(appDir)) {
    log(`Removing previous build directory: ${appDir}`);
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  // Create directories
  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(path.join(appDir, 'resources'), { recursive: true });

  // Step 3: Copy Electron files
  log(`\n${colors.yellow}Step 3: Copying Electron files...${colors.reset}\n`);
  const electronFiles = ['main.js', 'preload.js', 'package.json'];
  electronFiles.forEach(file => {
    const sourcePath = path.join(__dirname, 'electron', file);
    const destPath = path.join(appDir, file);
    fs.copyFileSync(sourcePath, destPath);
    log(`Copied ${sourcePath} to ${destPath}`);
  });

  // Step 4: Copy icons
  log(`\n${colors.yellow}Step 4: Copying icons...${colors.reset}\n`);
  const iconsDir = path.join(appDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  const sourceIconsDir = path.join(__dirname, 'electron', 'icons');
  fs.readdirSync(sourceIconsDir).forEach(file => {
    const sourcePath = path.join(sourceIconsDir, file);
    const destPath = path.join(iconsDir, file);
    fs.copyFileSync(sourcePath, destPath);
    log(`Copied ${sourcePath} to ${destPath}`);
  });

  // Step 5: Copy React build
  log(`\n${colors.yellow}Step 5: Copying React build...${colors.reset}\n`);
  const buildDir = path.join(__dirname, 'dist');
  const appBuildDir = path.join(appDir, 'build');
  fs.mkdirSync(appBuildDir, { recursive: true });

  // Copy build directory recursively
  const copyDirRecursive = (src, dest) => {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy directory
        copyDirRecursive(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDirRecursive(buildDir, appBuildDir);
  log(`Copied React build from ${buildDir} to ${appBuildDir}`);

  // Step 6: Install dependencies
  log(`\n${colors.yellow}Step 6: Installing dependencies...${colors.reset}\n`);
  if (!execute('npm install --production', { cwd: appDir })) {
    log(`${colors.yellow}Warning: Failed to install dependencies. The app may not work correctly.${colors.reset}`);
  }

  // Step 7: Create a simple batch file to run the app
  log(`\n${colors.yellow}Step 7: Creating launcher...${colors.reset}\n`);
  const batchFilePath = path.join(appDir, 'Invoicing-Genius.bat');
  const batchFileContent = `@echo off
echo Starting Invoicing Genius...
cd /d "%~dp0"
npx electron .
`;
  fs.writeFileSync(batchFilePath, batchFileContent);
  log(`Created launcher at ${batchFilePath}`);

  // Create a shortcut on desktop
  log(`\n${colors.yellow}Step 8: Creating desktop shortcut...${colors.reset}\n`);
  const desktopDir = path.join(process.env.USERPROFILE, 'Desktop');
  const shortcutPath = path.join(desktopDir, 'Invoicing Genius.lnk');

  try {
    // Create a Windows shortcut using PowerShell
    const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
$Shortcut.TargetPath = "${batchFilePath.replace(/\\/g, '\\\\')}"
$Shortcut.IconLocation = "${path.join(iconsDir, 'icon.png').replace(/\\/g, '\\\\')}"
$Shortcut.Description = "Invoicing Genius Desktop Application"
$Shortcut.WorkingDirectory = "${appDir.replace(/\\/g, '\\\\')}"
$Shortcut.Save()
    `;

    const psScriptPath = path.join(__dirname, 'create-shortcut.ps1');
    fs.writeFileSync(psScriptPath, psScript);

    execute(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`);
    fs.unlinkSync(psScriptPath); // Clean up the script file

    log(`${colors.green}Created desktop shortcut at ${shortcutPath}${colors.reset}`);
  } catch (error) {
    log(`${colors.yellow}Warning: Failed to create desktop shortcut: ${error.message}${colors.reset}`);
    log(`${colors.yellow}You can manually create a shortcut to ${batchFilePath}${colors.reset}`);
  }

  log(`\n${colors.bright}${colors.green}=== Build Complete ===${colors.reset}\n`);
  log(`${colors.bright}${colors.green}Invoicing Genius Desktop App has been built successfully!${colors.reset}`);
  log(`${colors.bright}${colors.green}You can find the application in: ${appDir}${colors.reset}`);
  log(`${colors.bright}${colors.green}To run the app, double-click on Invoicing-Genius.bat${colors.reset}\n`);
};

// Run the build process
buildElectron().catch(error => {
  log(`\n${colors.red}Build failed: ${error.message}${colors.reset}\n`);
  process.exit(1);
});
