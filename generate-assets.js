const fs = require('fs');
const path = require('path');

// Minimal 1x1 green pixel PNG (base64 encoded)
// This is a valid PNG file that renders as a single pixel
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

// Create directories if needed
fs.mkdirSync(path.join(__dirname, 'assets', 'icons'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'assets', 'images'), { recursive: true });

// Write placeholder files
fs.writeFileSync(path.join(__dirname, 'assets', 'icons', 'icon-192x192.png'), pngBuffer);
fs.writeFileSync(path.join(__dirname, 'assets', 'icons', 'icon-512x512.png'), pngBuffer);
fs.writeFileSync(path.join(__dirname, 'assets', 'images', 'logo-abofe.png'), pngBuffer);
fs.writeFileSync(path.join(__dirname, 'assets', 'images', 'selo-2026.png'), pngBuffer);

console.log('Placeholder assets created successfully:');
console.log('  - assets/icons/icon-192x192.png');
console.log('  - assets/icons/icon-512x512.png');
console.log('  - assets/images/logo-abofe.png');
console.log('  - assets/images/selo-2026.png');
