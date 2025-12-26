/**
 * Super JoJo Party - Main Entry Point
 * Initializes and orchestrates all game modules
 */

import { App } from './modules/App.js';
// Use global THREE loaded via script tag in index.html

// Check WebGL support using Three.js - this matches what minigames actually need
function checkWebGL() {
  try {
    console.log('🔍 Testing WebGL with Three.js...');
    
    // Create a test canvas
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    
    // Try to create a Three.js WebGL renderer using the same options as minigames
    const testRenderer = new THREE.WebGLRenderer({
      canvas: testCanvas,
      antialias: true,
      alpha: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default'
    });
    
    if (!testRenderer) {
      console.error('❌ Three.js WebGLRenderer creation failed');
      return false;
    }
    
    // Check if context was actually created
    const gl = testRenderer.getContext();
    if (!gl) {
      console.error('❌ Could not get WebGL context from Three.js renderer');
      testRenderer.dispose();
      return false;
    }
    
    // Try to create a simple scene and render it
    const testScene = new THREE.Scene();
    const testCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
    testCamera.position.z = 5;
    
    // Add a simple mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    testScene.add(cube);
    
    // Enable shadow map like minigames do and try to render
    try {
      testRenderer.shadowMap.enabled = true;
      testRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (shadowErr) {
      console.warn('Shadow map setup failed during WebGL check:', shadowErr);
    }
    // Try to render
    testRenderer.render(testScene, testCamera);
    
    // Check for WebGL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR && error !== undefined) {
      console.error('❌ WebGL error after render:', error);
      testRenderer.dispose();
      geometry.dispose();
      material.dispose();
      return false;
    }
    
    // Clean up
    testRenderer.dispose();
    geometry.dispose();
    material.dispose();
    testScene.clear();
    
    console.log('✅ Three.js WebGL support verified - 3D graphics will work!');
    return true;
  } catch (e) {
    console.error('❌ WebGL/Three.js check failed:', e.message || e);
    return false;
  }
}

function showWebGLBlocker() {
  const blocker = document.getElementById('webgl-blocker');
  const app = document.getElementById('app');
  
  if (blocker) {
    blocker.style.display = 'flex';
    blocker.style.visibility = 'visible';
    blocker.style.opacity = '1';
  }
  if (app) {
    app.style.display = 'none';
  }

  // Add retry button handler
  const retryBtn = document.getElementById('retry-webgl');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  console.error('❌ WebGL not supported - Game cannot run');
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Super JoJo Party - Starting...');
  
  // Check WebGL FIRST before anything else
  console.log('🔍 Checking WebGL support...');
  const webglOk = checkWebGL();
  // expose result for other modules to check before starting games
  window.hasWebGL = !!webglOk;
  if (!webglOk) {
    showWebGLBlocker();
    return; // Stop here - don't initialize the app
  }
  
  window.app = new App();
  window.app.init();
});

// Handle unhandled errors - catch WebGL errors that happen later
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Check if it's a WebGL error
  const errorMsg = event.error?.message || event.message || '';
  if (errorMsg.toLowerCase().includes('webgl') || 
      errorMsg.toLowerCase().includes('context') ||
      errorMsg.toLowerCase().includes('three')) {
    console.error('🚨 WebGL-related error detected!');
    showWebGLBlocker();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
