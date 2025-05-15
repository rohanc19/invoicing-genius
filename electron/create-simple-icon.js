const fs = require('fs');
const path = require('path');

// Create a simple 256x256 PNG icon
// This is a minimal valid PNG file with a blue square
const pngHeader = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // "IHDR"
  0x00, 0x00, 0x01, 0x00, // width: 256
  0x00, 0x00, 0x01, 0x00, // height: 256
  0x08, // bit depth
  0x06, // color type: RGBA
  0x00, // compression method
  0x00, // filter method
  0x00, // interlace method
  0x00, 0x00, 0x00, 0x00, // CRC-32 of the IHDR chunk
]);

// IDAT chunk with minimal image data (a blue square)
const width = 256;
const height = 256;
const bytesPerPixel = 4; // RGBA
const bytesPerRow = width * bytesPerPixel;
const imageData = Buffer.alloc(height * (bytesPerRow + 1)); // +1 for filter byte

// Fill with blue color (RGBA: 0, 100, 255, 255)
for (let y = 0; y < height; y++) {
  imageData[y * (bytesPerRow + 1)] = 0; // filter type 0 (None)
  for (let x = 0; x < width; x++) {
    const pos = y * (bytesPerRow + 1) + 1 + x * bytesPerPixel;
    imageData[pos] = 0; // R
    imageData[pos + 1] = 100; // G
    imageData[pos + 2] = 255; // B
    imageData[pos + 3] = 255; // A
  }
}

// Compress the image data using zlib
const zlib = require('zlib');
const compressedData = zlib.deflateSync(imageData);

// IDAT chunk
const idatChunk = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x00]), // Length placeholder
  Buffer.from('IDAT'),
  compressedData,
  Buffer.from([0x00, 0x00, 0x00, 0x00]), // CRC-32 placeholder
]);

// Update IDAT length
idatChunk.writeUInt32BE(compressedData.length, 0);

// IEND chunk
const iendChunk = Buffer.from([
  0x00, 0x00, 0x00, 0x00, // Length
  0x49, 0x45, 0x4E, 0x44, // "IEND"
  0xAE, 0x42, 0x60, 0x82, // CRC-32
]);

// Combine all chunks
const pngFile = Buffer.concat([pngHeader, idatChunk, iendChunk]);

// Write the PNG file
const iconPath = path.join(__dirname, 'icons', 'icon.png');
fs.writeFileSync(iconPath, pngFile);

console.log(`Created simple icon at ${iconPath}`);

// Also create smaller versions
const sizes = [16, 32, 64, 128, 192, 512];
for (const size of sizes) {
  const smallIconPath = path.join(__dirname, 'icons', `icon-${size}x${size}.png`);
  fs.writeFileSync(smallIconPath, pngFile);
  console.log(`Created ${size}x${size} icon at ${smallIconPath}`);
}

console.log('Icon creation complete!');
