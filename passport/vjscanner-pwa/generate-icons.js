const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw QR code scanner icon
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  
  const margin = size * 0.2;
  const innerSize = size - (margin * 2);
  
  // Corner brackets (QR scanner style)
  const cornerSize = innerSize * 0.3;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(size - margin - cornerSize, margin);
  ctx.lineTo(size - margin, margin);
  ctx.lineTo(size - margin, margin + cornerSize);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(margin, size - margin - cornerSize);
  ctx.lineTo(margin, size - margin);
  ctx.lineTo(margin + cornerSize, size - margin);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(size - margin - cornerSize, size - margin);
  ctx.lineTo(size - margin, size - margin);
  ctx.lineTo(size - margin, size - margin - cornerSize);
  ctx.stroke();
  
  // Center scan line
  ctx.fillRect(margin + size * 0.05, size / 2 - size * 0.02, innerSize - size * 0.1, size * 0.04);
  
  return canvas;
}

// Generate all icon sizes
console.log('Generating PWA icons...\n');

sizes.forEach(size => {
  const canvas = generateIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}.png`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
});

console.log('\n✨ All icons generated successfully!');
console.log(`📁 Icons saved to: ${outputDir}`);
