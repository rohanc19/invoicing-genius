const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

log(`\n${colors.bright}${colors.cyan}Checking Invoicing Genius Desktop Development Environment${colors.reset}\n`);

// Check Node.js version
const nodeVersion = process.version;
log(`Node.js version: ${nodeVersion}`);
const nodeVersionNum = Number(nodeVersion.match(/^v(\d+)/)[1]);
if (nodeVersionNum < 14) {
  log(`${colors.red}Warning: Node.js version ${nodeVersion} may be too old. v14 or higher is recommended.${colors.reset}`);
} else {
  log(`${colors.green}✓ Node.js version is sufficient${colors.reset}`);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version').toString().trim();
  log(`npm version: ${npmVersion}`);
  const npmVersionNum = Number(npmVersion.split('.')[0]);
  if (npmVersionNum < 6) {
    log(`${colors.yellow}Warning: npm version ${npmVersion} may be too old. v6 or higher is recommended.${colors.reset}`);
  } else {
    log(`${colors.green}✓ npm version is sufficient${colors.reset}`);
  }
} catch (error) {
  log(`${colors.red}Error checking npm version: ${error.message}${colors.reset}`);
}

// Check if required files exist
const requiredFiles = [
  { path: 'main.js', name: 'Main Process File' },
  { path: 'preload.js', name: 'Preload Script' },
  { path: 'package.json', name: 'Package Configuration' },
  { path: 'icons/icon.svg', name: 'SVG Icon' }
];

log(`\nChecking required files:`);
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file.path);
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`${colors.green}✓ ${file.name} (${file.path})${colors.reset}`);
  } else {
    log(`${colors.red}✗ ${file.name} (${file.path}) - Missing${colors.reset}`);
    allFilesExist = false;
  }
}

// Check if icons directory exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  log(`${colors.red}✗ Icons directory is missing${colors.reset}`);
  allFilesExist = false;
}

// Check if React build exists (for production builds)
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  log(`\n${colors.yellow}Note: React build directory not found at ${buildDir}${colors.reset}`);
  log(`${colors.yellow}This is required for production builds but not for development.${colors.reset}`);
  log(`${colors.yellow}Run 'npm run build' from the project root to create it.${colors.reset}`);
} else {
  log(`\n${colors.green}✓ React build directory exists${colors.reset}`);
}

// Check for ImageMagick (for icon creation)
try {
  execSync('convert -version', { stdio: 'ignore' });
  log(`\n${colors.green}✓ ImageMagick is installed (for icon creation)${colors.reset}`);
} catch (error) {
  log(`\n${colors.yellow}Note: ImageMagick is not installed.${colors.reset}`);
  log(`${colors.yellow}This is required for icon creation but not for development.${colors.reset}`);
  log(`${colors.yellow}Install ImageMagick to use the 'npm run create-icons' script.${colors.reset}`);
}

// Summary
log(`\n${colors.bright}${colors.cyan}Environment Check Summary${colors.reset}`);
if (allFilesExist) {
  log(`${colors.green}✓ All required files are present${colors.reset}`);
  log(`${colors.green}✓ Development environment is ready${colors.reset}`);
  log(`\n${colors.bright}You can start the app with:${colors.reset}`);
  log(`${colors.cyan}  npm start${colors.reset}`);
} else {
  log(`${colors.red}✗ Some required files are missing${colors.reset}`);
  log(`${colors.yellow}Please fix the issues above before starting the app${colors.reset}`);
}

// Check if electron is installed
try {
  execSync('npx electron --version', { stdio: 'ignore' });
  log(`${colors.green}✓ Electron is installed${colors.reset}`);
} catch (error) {
  log(`${colors.red}✗ Electron is not installed or not in path${colors.reset}`);
  log(`${colors.yellow}Run 'npm install' to install dependencies${colors.reset}`);
}

log(`\n${colors.bright}${colors.cyan}Check Complete${colors.reset}\n`);
