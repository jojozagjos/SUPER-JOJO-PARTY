/**
 * Super JoJo Party - Build Script
 * This script prepares the client files for production deployment.
 * 
 * For this project, client files are served directly without bundling,
 * so this script mainly validates files and generates any needed assets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

console.log('🔨 Building Super JoJo Party...\n');

// Check required directories exist
const requiredDirs = [
  'client',
  'client/js',
  'client/js/modules',
  'client/css',
  'server',
  'assets'
];

let hasErrors = false;

console.log('📁 Checking directory structure...');
for (const dir of requiredDirs) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ Missing directory: ${dir}`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${dir}`);
  }
}

// Check required client files exist
const requiredFiles = [
  'client/index.html',
  'client/css/main.css',
  'client/js/main.js',
  'client/js/modules/App.js',
  'client/js/modules/AudioManager.js',
  'client/js/modules/AuthManager.js',
  'client/js/modules/GameEngine.js',
  'client/js/modules/LobbyController.js',
  'client/js/modules/MinigameController.js',
  'client/js/modules/SocketManager.js',
  'client/js/modules/UIManager.js',
  'server/index.js'
];

console.log('\n📄 Checking required files...');
for (const file of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ Missing file: ${file}`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${file}`);
  }
}

// Generate placeholder assets if they don't exist
console.log('\n🎨 Checking assets...');
const characterDirs = ['jojo', 'mimi'];
for (const char of characterDirs) {
  const charDir = path.join(ASSETS_DIR, 'characters', char);
  if (!fs.existsSync(charDir)) {
    fs.mkdirSync(charDir, { recursive: true });
    console.log(`  ✓ Created directory: assets/characters/${char}`);
  }
}

// Create a simple manifest file for cache busting
const manifest = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  files: requiredFiles.filter(f => fs.existsSync(path.join(ROOT_DIR, f)))
};

const manifestPath = path.join(CLIENT_DIR, 'build-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('\n📋 Generated build manifest');

// Summary
console.log('\n' + '═'.repeat(50));
if (hasErrors) {
  console.error('❌ Build completed with errors. Please fix missing files.');
  process.exit(1);
} else {
  console.log('✅ Build completed successfully!');
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Build time: ${manifest.buildTime}`);
  console.log('\n   Run "npm start" to start the server.');
}
