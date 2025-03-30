
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Make sure the icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Sizes for the icons as specified in the manifest
const sizes = [
  // Small sizes use the simpler icon
  { size: 16, source: 'icon-small.svg' },
  { size: 32, source: 'icon-small.svg' },
  // Larger sizes use the detailed icon
  { size: 72, source: 'icon.svg' },
  { size: 96, source: 'icon.svg' },
  { size: 128, source: 'icon.svg' },
  { size: 144, source: 'icon.svg' },
  { size: 152, source: 'icon.svg' },
  { size: 192, source: 'icon.svg' },
  { size: 384, source: 'icon.svg' },
  { size: 512, source: 'icon.svg' }
];

// Check if ImageMagick is installed
try {
  execSync('convert -version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: ImageMagick is required to run this script.');
  console.error('Please install ImageMagick (https://imagemagick.org) and try again.');
  process.exit(1);
}

// Generate PNG files for each size
sizes.forEach(({ size, source }) => {
  const svgFile = path.join(iconsDir, source);
  const outputFile = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    console.log(`Generating ${size}x${size} icon from ${source}...`);
    execSync(`convert -background none -size ${size}x${size} ${svgFile} ${outputFile}`);
    console.log(`Created ${outputFile}`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error.message);
  }
});

console.log('Icon generation complete!');
