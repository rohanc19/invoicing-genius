const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
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
      const firebaserc = path.join(__dirname, '.firebaserc');
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

// Initialize Firebase project
function initializeFirebaseProject() {
  return new Promise((resolve) => {
    log(`${colors.cyan}Initializing Firebase project...${colors.reset}`);
    
    const firebase = spawn('firebase', ['init'], { stdio: 'inherit' });
    
    firebase.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}Firebase project initialized successfully${colors.reset}`);
        resolve(true);
      } else {
        log(`${colors.red}Failed to initialize Firebase project${colors.reset}`);
        resolve(false);
      }
    });
    
    firebase.on('error', (error) => {
      log(`${colors.red}Error initializing Firebase project: ${error.message}${colors.reset}`);
      resolve(false);
    });
  });
}

// Deploy Firebase project
function deployFirebaseProject() {
  return new Promise((resolve) => {
    log(`${colors.cyan}Deploying Firebase project...${colors.reset}`);
    
    const firebase = spawn('firebase', ['deploy'], { stdio: 'inherit' });
    
    firebase.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}Firebase project deployed successfully${colors.reset}`);
        resolve(true);
      } else {
        log(`${colors.red}Failed to deploy Firebase project${colors.reset}`);
        resolve(false);
      }
    });
    
    firebase.on('error', (error) => {
      log(`${colors.red}Error deploying Firebase project: ${error.message}${colors.reset}`);
      resolve(false);
    });
  });
}

// Start Firebase emulators
function startFirebaseEmulators() {
  return new Promise((resolve) => {
    log(`${colors.cyan}Starting Firebase emulators...${colors.reset}`);
    
    const firebase = spawn('firebase', ['emulators:start'], { stdio: 'inherit' });
    
    firebase.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}Firebase emulators stopped${colors.reset}`);
      } else {
        log(`${colors.red}Firebase emulators exited with code ${code}${colors.reset}`);
      }
      resolve(false);
    });
    
    firebase.on('error', (error) => {
      log(`${colors.red}Error starting Firebase emulators: ${error.message}${colors.reset}`);
      resolve(false);
    });
    
    // This will keep the emulators running until the process is terminated
    resolve(true);
  });
}

// Main function
async function main() {
  log(`${colors.blue}Initializing Firebase for Invoicing Genius...${colors.reset}`);
  
  // Check Firebase CLI
  const hasCLI = await checkFirebaseCLI();
  if (!hasCLI) {
    log(`${colors.yellow}Please install Firebase CLI and try again${colors.reset}`);
    return;
  }
  
  // Check Firebase project
  const hasProject = await checkFirebaseProject();
  if (!hasProject) {
    log(`${colors.yellow}Firebase project not configured. Initializing...${colors.reset}`);
    const initialized = await initializeFirebaseProject();
    if (!initialized) {
      log(`${colors.red}Failed to initialize Firebase project. Please try again manually.${colors.reset}`);
      return;
    }
  }
  
  // Ask user what they want to do
  console.log('\n');
  console.log(`${colors.cyan}What would you like to do?${colors.reset}`);
  console.log(`${colors.cyan}1. Start Firebase emulators${colors.reset}`);
  console.log(`${colors.cyan}2. Deploy Firebase project${colors.reset}`);
  console.log(`${colors.cyan}3. Exit${colors.reset}`);
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question(`${colors.cyan}Enter your choice (1-3): ${colors.reset}`, async (choice) => {
    readline.close();
    
    switch (choice) {
      case '1':
        await startFirebaseEmulators();
        break;
      case '2':
        await deployFirebaseProject();
        break;
      case '3':
        log(`${colors.blue}Exiting...${colors.reset}`);
        break;
      default:
        log(`${colors.red}Invalid choice. Exiting...${colors.reset}`);
    }
  });
}

// Run the main function
main().catch((error) => {
  log(`${colors.red}Error: ${error.message}${colors.reset}`);
});
