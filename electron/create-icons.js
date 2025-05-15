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

// Check if ImageMagick is installed
try {
  execSync('convert -version', { stdio: 'ignore' });
} catch (error) {
  log(`${colors.red}Error: ImageMagick is not installed. Please install it to create icons.${colors.reset}`, colors.red);
  log(`${colors.yellow}On Windows: Install from https://imagemagick.org/script/download.php${colors.reset}`, colors.yellow);
  log(`${colors.yellow}On Mac: Run 'brew install imagemagick'${colors.reset}`, colors.yellow);
  log(`${colors.yellow}On Linux: Run 'sudo apt-get install imagemagick'${colors.reset}`, colors.yellow);
  process.exit(1);
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  log(`Created icons directory: ${iconsDir}`);
}

// Source SVG file
const svgFile = path.join(iconsDir, 'icon.svg');
if (!fs.existsSync(svgFile)) {
  log(`${colors.red}Error: SVG icon file not found at ${svgFile}${colors.reset}`, colors.red);
  process.exit(1);
}

// Create PNG icons of different sizes
const sizes = [16, 32, 48, 64, 128, 256, 512];
log(`${colors.cyan}Creating PNG icons...${colors.reset}`, colors.cyan);

sizes.forEach(size => {
  const outputFile = path.join(iconsDir, `icon-${size}x${size}.png`);
  try {
    execSync(`convert -background none -resize ${size}x${size} "${svgFile}" "${outputFile}"`);
    log(`Created ${outputFile}`);
  } catch (error) {
    log(`${colors.red}Error creating ${size}x${size} PNG: ${error.message}${colors.reset}`, colors.red);
  }
});

// Create ICO file for Windows
log(`${colors.cyan}Creating ICO file for Windows...${colors.reset}`, colors.cyan);
try {
  const icoFile = path.join(iconsDir, 'icon.ico');
  execSync(`convert "${path.join(iconsDir, 'icon-16x16.png')}" "${path.join(iconsDir, 'icon-32x32.png')}" "${path.join(iconsDir, 'icon-48x48.png')}" "${path.join(iconsDir, 'icon-64x64.png')}" "${path.join(iconsDir, 'icon-128x128.png')}" "${path.join(iconsDir, 'icon-256x256.png')}" "${icoFile}"`);
  log(`Created ${icoFile}`);
} catch (error) {
  log(`${colors.red}Error creating ICO file: ${error.message}${colors.reset}`, colors.red);
}

// Create ICNS file for macOS (requires additional tools on macOS)
log(`${colors.cyan}Creating ICNS file for macOS...${colors.reset}`, colors.cyan);
try {
  const icnsFile = path.join(iconsDir, 'icon.icns');
  if (process.platform === 'darwin') {
    // On macOS, use iconutil
    const iconsetDir = path.join(iconsDir, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir, { recursive: true });
    }
    
    // Create iconset
    sizes.forEach(size => {
      const scale1x = path.join(iconsetDir, `icon_${size}x${size}.png`);
      const scale2x = path.join(iconsetDir, `icon_${size/2}x${size/2}@2x.png`);
      
      fs.copyFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), scale1x);
      if (size >= 32) {
        fs.copyFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), scale2x);
      }
    });
    
    // Convert iconset to icns
    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsFile}"`);
    log(`Created ${icnsFile}`);
  } else {
    // On other platforms, use ImageMagick (less ideal but works)
    execSync(`convert "${path.join(iconsDir, 'icon-16x16.png')}" "${path.join(iconsDir, 'icon-32x32.png')}" "${path.join(iconsDir, 'icon-48x48.png')}" "${path.join(iconsDir, 'icon-128x128.png')}" "${path.join(iconsDir, 'icon-256x256.png')}" "${path.join(iconsDir, 'icon-512x512.png')}" "${icnsFile}"`);
    log(`Created ${icnsFile} (using ImageMagick)`);
  }
} catch (error) {
  log(`${colors.red}Error creating ICNS file: ${error.message}${colors.reset}`, colors.red);
  log(`${colors.yellow}Note: For proper ICNS creation on non-macOS platforms, you may need to manually create this file on a Mac.${colors.reset}`, colors.yellow);
}

log(`${colors.green}Icon creation complete!${colors.reset}`, colors.green);
