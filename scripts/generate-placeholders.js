/**
 * Super JoJo Party - Placeholder Asset Generator
 * Run with: node scripts/generate-placeholders.js
 * 
 * This script generates placeholder SVG textures for development.
 * Replace with real assets for production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '../assets');

// Ensure directories exist
const dirs = [
  'textures/boards',
  'textures/ui',
  'textures/particles',
  'characters/jojo',
  'characters/mimi'
];

dirs.forEach(dir => {
  const fullPath = path.join(ASSETS_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// SVG Generator functions
function generateCharacterPortrait(name, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="${color}20"/>
  <circle cx="128" cy="100" r="60" fill="${color}"/>
  <circle cx="108" cy="90" r="10" fill="white"/>
  <circle cx="148" cy="90" r="10" fill="white"/>
  <circle cx="108" cy="90" r="5" fill="#333"/>
  <circle cx="148" cy="90" r="5" fill="#333"/>
  <path d="M 108 120 Q 128 140 148 120" stroke="#333" stroke-width="4" fill="none"/>
  <rect x="88" y="160" width="80" height="60" rx="10" fill="${color}"/>
  <text x="128" y="240" text-anchor="middle" font-family="Arial" font-size="16" fill="${color}">${name}</text>
</svg>`;
}

function generateBoardTile(type, color) {
  const patterns = {
    blue: `<rect width="64" height="64" fill="#3498db"/>
           <circle cx="32" cy="32" r="20" fill="#2980b9" opacity="0.5"/>`,
    red: `<rect width="64" height="64" fill="#e74c3c"/>
          <polygon points="32,12 52,52 12,52" fill="#c0392b" opacity="0.5"/>`,
    green: `<rect width="64" height="64" fill="#2ecc71"/>
            <rect x="12" y="12" width="40" height="40" fill="#27ae60" opacity="0.5"/>`,
    star: `<rect width="64" height="64" fill="#f1c40f"/>
           <polygon points="32,8 38,28 58,28 42,40 48,60 32,48 16,60 22,40 6,28 26,28" fill="#f39c12"/>`,
    shop: `<rect width="64" height="64" fill="#9b59b6"/>
           <rect x="16" y="24" width="32" height="32" fill="#8e44ad"/>
           <rect x="20" y="20" width="24" height="8" fill="#8e44ad"/>`,
    event: `<rect width="64" height="64" fill="#e67e22"/>
            <text x="32" y="40" text-anchor="middle" font-size="24" fill="white">?</text>`,
    bowser: `<rect width="64" height="64" fill="#2c3e50"/>
             <text x="32" y="40" text-anchor="middle" font-size="24" fill="#c0392b">☠</text>`
  };
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  ${patterns[type] || patterns.blue}
</svg>`;
}

function generateUIElement(type) {
  const elements = {
    button: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50">
      <rect width="200" height="50" rx="10" fill="#3498db"/>
      <rect x="2" y="2" width="196" height="46" rx="8" fill="#2980b9"/>
    </svg>`,
    panel: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" rx="15" fill="#2c3e50"/>
      <rect x="5" y="5" width="290" height="190" rx="12" fill="#34495e"/>
    </svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <polygon points="32,4 40,24 62,26 46,40 50,62 32,52 14,62 18,40 2,26 24,24" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
    </svg>`,
    coin: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="#f1c40f" stroke="#d4a00a" stroke-width="2"/>
      <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#d4a00a">$</text>
    </svg>`,
    dice: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect x="4" y="4" width="56" height="56" rx="8" fill="white" stroke="#333" stroke-width="2"/>
      <circle cx="16" cy="16" r="4" fill="#333"/>
      <circle cx="48" cy="16" r="4" fill="#333"/>
      <circle cx="32" cy="32" r="4" fill="#333"/>
      <circle cx="16" cy="48" r="4" fill="#333"/>
      <circle cx="48" cy="48" r="4" fill="#333"/>
    </svg>`
  };
  
  return elements[type] || elements.button;
}

function generateParticle(type) {
  const particles = {
    sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <polygon points="16,0 18,14 32,16 18,18 16,32 14,18 0,16 14,14" fill="white"/>
    </svg>`,
    circle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="8" fill="white"/>
    </svg>`,
    confetti: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16">
      <rect width="8" height="16" rx="2" fill="white"/>
    </svg>`
  };
  
  return particles[type] || particles.sparkle;
}

// Character data
const characters = [
  { id: 'jojo', name: 'JoJo', color: '#FF6B6B' },
  { id: 'mimi', name: 'Mimi', color: '#4ECDC4' }
];

console.log('🎨 Generating placeholder assets...\n');

// Generate character portraits
characters.forEach(char => {
  const svg = generateCharacterPortrait(char.name, char.color);
  const filePath = path.join(ASSETS_DIR, 'characters', char.id, 'portrait.svg');
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated portrait: ${char.id}`);
});

// Generate board tiles
const tileTypes = ['blue', 'red', 'green', 'star', 'shop', 'event', 'bowser'];
tileTypes.forEach(type => {
  const svg = generateBoardTile(type);
  const filePath = path.join(ASSETS_DIR, 'textures/boards', `tile_${type}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated tile: ${type}`);
});

// Generate UI elements
const uiTypes = ['button', 'panel', 'star', 'coin', 'dice'];
uiTypes.forEach(type => {
  const svg = generateUIElement(type);
  const filePath = path.join(ASSETS_DIR, 'textures/ui', `${type}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated UI: ${type}`);
});

// Generate particles
const particleTypes = ['sparkle', 'circle', 'confetti'];
particleTypes.forEach(type => {
  const svg = generateParticle(type);
  const filePath = path.join(ASSETS_DIR, 'textures/particles', `${type}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated particle: ${type}`);
});

console.log('\n✨ All placeholder assets generated!');
console.log('\nNote: These are SVG placeholders. For production, replace with:');
console.log('  - PNG textures for better performance');
console.log('  - GLB models for characters');
console.log('  - OGG audio files for sound effects and music');
