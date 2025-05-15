const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${message}`);
}

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  return new Promise((resolve) => {
    const firebase = spawn('firebase', ['--version']);
    
    firebase.stdout.on('data', (data) => {
      const version = data.toString().trim();
      log(`${colors.green}Firebase CLI version: ${version}${colors.reset}`);
      resolve(true);
    });
    
    firebase.stderr.on('data', () => {
      log(`${colors.red}Firebase CLI not found. Please install it with: npm install -g firebase-tools${colors.reset}`);
      resolve(false);
    });
    
    firebase.on('error', () => {
      log(`${colors.red}Firebase CLI not found. Please install it with: npm install -g firebase-tools${colors.reset}`);
      resolve(false);
    });
  });
}

// Check if Firebase project exists
function checkFirebaseProject() {
  return new Promise((resolve) => {
    try {
      const firebaserc = path.join(__dirname, '..', '.firebaserc');
      if (fs.existsSync(firebaserc)) {
        const content = fs.readFileSync(firebaserc, 'utf8');
        const projectId = content.match(/"default":\s*"([^"]+)"/);
        if (projectId && projectId[1]) {
          log(`${colors.green}Firebase project ID: ${projectId[1]}${colors.reset}`);
          resolve(true);
        } else {
          log(`${colors.yellow}Firebase project not configured properly in .firebaserc${colors.reset}`);
          resolve(false);
        }
      } else {
        log(`${colors.yellow}Firebase project not configured. .firebaserc file not found.${colors.reset}`);
        resolve(false);
      }
    } catch (error) {
      log(`${colors.red}Error checking Firebase project: ${error.message}${colors.reset}`);
      resolve(false);
    }
  });
}

// Start Firebase emulators
function startFirebaseEmulators() {
  return new Promise((resolve) => {
    log(`${colors.cyan}Starting Firebase emulators...${colors.reset}`);
    
    const emulators = spawn('firebase', ['emulators:start', '--only', 'auth,firestore,storage'], {
      cwd: path.join(__dirname, '..')
    });
    
    emulators.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Check if emulators are running
      if (output.includes('All emulators ready')) {
        log(`${colors.green}Firebase emulators are running${colors.reset}`);
        resolve(true);
      }
    });
    
    emulators.stderr.on('data', (data) => {
      console.error(`${colors.red}${data.toString()}${colors.reset}`);
    });
    
    emulators.on('error', (error) => {
      log(`${colors.red}Error starting Firebase emulators: ${error.message}${colors.reset}`);
      resolve(false);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      log(`${colors.yellow}Timeout waiting for Firebase emulators to start${colors.reset}`);
      resolve(false);
    }, 30000);
  });
}

// Main function
async function main() {
  log(`${colors.blue}Initializing Firebase...${colors.reset}`);
  
  // Check Firebase CLI
  const hasCLI = await checkFirebaseCLI();
  if (!hasCLI) {
    log(`${colors.yellow}Please install Firebase CLI and try again${colors.reset}`);
    return;
  }
  
  // Check Firebase project
  const hasProject = await checkFirebaseProject();
  if (!hasProject) {
    log(`${colors.yellow}Please configure your Firebase project and try again${colors.reset}`);
    return;
  }
  
  // Start Firebase emulators
  const emulatorsStarted = await startFirebaseEmulators();
  if (emulatorsStarted) {
    log(`${colors.green}Firebase initialization complete${colors.reset}`);
  } else {
    log(`${colors.red}Failed to start Firebase emulators${colors.reset}`);
  }
}

// Run the main function
main().catch((error) => {
  log(`${colors.red}Error: ${error.message}${colors.reset}`);
});
