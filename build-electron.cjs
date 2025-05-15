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
  log(`\n${colors.bright}${colors.green}=== Building Invoicing Genius Desktop App ===${colors.reset}\n`);
  
  // Step 1: Build React app
  log(`\n${colors.yellow}Step 1: Building React app...${colors.reset}\n`);
  if (!execute('npm run build')) {
    log(`${colors.red}Failed to build React app. Aborting.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Ensure electron directory exists
  log(`\n${colors.yellow}Step 2: Setting up Electron build environment...${colors.reset}\n`);
  const electronDir = path.join(__dirname, 'electron');
  if (!fs.existsSync(electronDir)) {
    log(`${colors.red}Electron directory not found. Aborting.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Create icons directory if it doesn't exist
  const iconsDir = path.join(electronDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    log(`Created icons directory: ${iconsDir}`);
  }
  
  // Step 4: Copy icons from public to electron/icons
  log(`\n${colors.yellow}Step 3: Copying icons...${colors.reset}\n`);
  const publicIconsDir = path.join(__dirname, 'public', 'icons');
  if (fs.existsSync(publicIconsDir)) {
    fs.readdirSync(publicIconsDir).forEach(file => {
      const sourcePath = path.join(publicIconsDir, file);
      const destPath = path.join(iconsDir, file);
      fs.copyFileSync(sourcePath, destPath);
      log(`Copied ${sourcePath} to ${destPath}`);
    });
  } else {
    log(`${colors.yellow}Warning: Public icons directory not found. Skipping icon copy.${colors.reset}`);
  }
  
  // Step 5: Install Electron dependencies
  log(`\n${colors.yellow}Step 4: Installing Electron dependencies...${colors.reset}\n`);
  if (!execute('npm install', { cwd: electronDir })) {
    log(`${colors.red}Failed to install Electron dependencies. Aborting.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 6: Build Electron app
  log(`\n${colors.yellow}Step 5: Building Electron app...${colors.reset}\n`);
  const platform = process.platform;
  let buildCommand = 'npm run build';
  
  if (platform === 'win32') {
    buildCommand = 'npm run build:win';
  } else if (platform === 'darwin') {
    buildCommand = 'npm run build:mac';
  } else if (platform === 'linux') {
    buildCommand = 'npm run build:linux';
  }
  
  if (!execute(buildCommand, { cwd: electronDir })) {
    log(`${colors.red}Failed to build Electron app. Aborting.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 7: Copy built files to dist directory
  log(`\n${colors.yellow}Step 6: Copying built files...${colors.reset}\n`);
  const distDir = path.join(__dirname, 'dist');
  const electronDistDir = path.join(electronDir, 'dist');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (fs.existsSync(electronDistDir)) {
    fs.readdirSync(electronDistDir).forEach(file => {
      const sourcePath = path.join(electronDistDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        // Copy directory recursively
        execute(`cp -r "${sourcePath}" "${distDir}"`);
      } else {
        // Copy file
        fs.copyFileSync(sourcePath, destPath);
      }
      
      log(`Copied ${sourcePath} to ${destPath}`);
    });
  } else {
    log(`${colors.yellow}Warning: Electron dist directory not found. No files to copy.${colors.reset}`);
  }
  
  log(`\n${colors.bright}${colors.green}=== Build Complete ===${colors.reset}\n`);
  log(`${colors.bright}${colors.green}Electron app has been built successfully!${colors.reset}`);
  log(`${colors.bright}${colors.green}You can find the installer in the dist directory.${colors.reset}\n`);
};

// Run the build process
buildElectron().catch(error => {
  log(`\n${colors.red}Build failed: ${error.message}${colors.reset}\n`);
  process.exit(1);
});
