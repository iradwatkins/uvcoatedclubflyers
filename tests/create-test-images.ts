/**
 * Create test images for E2E testing
 * Generates 4x6 inch flyer images at 300 DPI (1200x1800 pixels)
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const DPI = 300;
const WIDTH_INCHES = 4;
const HEIGHT_INCHES = 6;
const WIDTH_PX = WIDTH_INCHES * DPI;  // 1200px
const HEIGHT_PX = HEIGHT_INCHES * DPI; // 1800px

function createFlyerImage(side: 'front' | 'back'): Buffer {
  const canvas = createCanvas(WIDTH_PX, HEIGHT_PX);
  const ctx = canvas.getContext('2d');

  // Background
  if (side === 'front') {
    // Front: Blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT_PX);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
  } else {
    // Back: Purple gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT_PX);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#a78bfa');
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, WIDTH_PX, HEIGHT_PX);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    side === 'front' ? 'UV COATED FLYER' : 'CONTACT INFO',
    WIDTH_PX / 2,
    200
  );

  // Subtitle
  ctx.font = '80px Arial';
  ctx.fillText(
    side === 'front' ? 'Premium Club Flyers' : 'www.uvcoated.com',
    WIDTH_PX / 2,
    350
  );

  // Content
  ctx.font = '60px Arial';
  if (side === 'front') {
    const lines = [
      'High Quality Printing',
      '9pt Card Stock',
      'UV Coated Both Sides',
      'Professional Finish',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, WIDTH_PX / 2, 600 + i * 120);
    });
  } else {
    const lines = [
      'Phone: (555) 123-4567',
      'Email: info@uvcoated.com',
      'Address: 123 Print St',
      'Atlanta, GA 30318',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, WIDTH_PX / 2, 600 + i * 120);
    });
  }

  // Test marker
  ctx.font = '40px Arial';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`TEST ${side.toUpperCase()} SIDE`, WIDTH_PX / 2, HEIGHT_PX - 100);

  return canvas.toBuffer('image/png');
}

// Create images
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

const frontImage = createFlyerImage('front');
const backImage = createFlyerImage('back');

fs.writeFileSync(path.join(fixturesDir, 'flyer-front.png'), frontImage);
fs.writeFileSync(path.join(fixturesDir, 'flyer-back.png'), backImage);

console.log('✓ Created test images:');
console.log('  - flyer-front.png (4x6 inches, 300 DPI)');
console.log('  - flyer-back.png (4x6 inches, 300 DPI)');
