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
  
  // Check WebGL but do not block the whole app — modules perform graceful fallbacks
  console.log('🔍 Checking WebGL support (non-blocking)...');
  const webglOk = checkWebGL();
  // expose result for other modules to check before starting games
  window.hasWebGL = !!webglOk;
  if (!webglOk) {
    console.warn('⚠️ WebGL not fully available — continuing startup with 2D fallbacks where possible.');
    // Show a non-blocking notice to the user (keep app usable)
    const blocker = document.getElementById('webgl-blocker');
    if (blocker) {
      blocker.style.display = 'flex';
      blocker.querySelector('.webgl-blocker-content')?.classList.add('non-blocking');
    }
  }

  // Initialize the app regardless; individual modules will check `window.hasWebGL`
  window.app = new App();
  window.app.init();
});

// Handle unhandled errors - catch WebGL errors that happen later
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Check if it's a WebGL error
  const errorMsg = (event.error?.message || event.message || '').toLowerCase();
  // Only treat errors that explicitly reference WebGL/context failures as fatal to WebGL support.
  if (errorMsg.includes('webgl') || errorMsg.includes('context') || errorMsg.includes('failed to create')) {
    console.error('🚨 WebGL-related error detected!');
    showWebGLBlocker();
  } else {
    // Non-WebGL Three.js errors (missing classes, etc.) are coding/runtime issues,
    // do not assume the device lacks WebGL — log for debugging instead.
    console.warn('Non-WebGL error occurred (not blocking):', errorMsg || event.error || event.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});