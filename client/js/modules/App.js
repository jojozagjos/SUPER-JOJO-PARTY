/**
 * Super JoJo Party - Main Application Module
 * Orchestrates all game systems and state management
 */

import { AuthManager } from './AuthManager.js';
import { SocketManager } from './SocketManager.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { GameEngine } from './GameEngine.js';
import { LobbyController } from './LobbyController.js';
import { MinigameController } from './MinigameController.js';

// Default settings constant
const DEFAULT_SETTINGS = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  voiceVolume: 80,
  quality: 'high',
  particles: true,
  screenShake: true,
  showTutorials: true
};

export class App {
  constructor() {
    // Managers
    this.auth = null;
    this.socket = null;
    this.ui = null;
    this.audio = null;
    this.game = null;
    this.lobby = null;
    this.minigame = null;

    // App state
    this.state = {
      user: null,
      currentScreen: 'splash',
      isLoading: true,
      settings: { ...DEFAULT_SETTINGS }
    };

    // Configuration
    this.config = {
      serverUrl: window.location.origin,
      reconnectAttempts: 5,
      reconnectDelay: 2000
    };
  }

  async init() {
    console.log('🎮 Super JoJo Party - Initializing...');

    // Check WebGL support first
    if (!this.checkWebGLSupport()) {
      this.showWebGLBlocker();
      return;
    }

    try {
      // Initialize managers in order
      this.ui = new UIManager(this);
      this.audio = new AudioManager(this);
      this.auth = new AuthManager(this);
      this.socket = new SocketManager(this);
      this.lobby = new LobbyController(this);
      this.game = new GameEngine(this);
      this.minigame = new MinigameController(this);

      // Load user settings
      this.loadSettings();

      // Start splash screen animation
      await this.runSplashSequence();

      // Check for existing session
      const hasSession = await this.auth.checkSession();
      
      if (hasSession) {
        this.ui.showScreen('main-menu');
      } else {
        this.ui.showScreen('login');
      }

      console.log('✅ Super JoJo Party - Ready!');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.ui.showToast('Failed to initialize game', 'error');
    }
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  showWebGLBlocker() {
    const blocker = document.getElementById('webgl-blocker');
    const app = document.getElementById('app');
    
    if (blocker) {
      blocker.style.display = 'flex';
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
  }

  async runSplashSequence() {
    const loadingText = document.getElementById('loading-text');
    const loadingProgress = document.querySelector('.loading-progress');
    
    const loadingSteps = [
      { text: 'Loading core systems...', progress: 10 },
      { text: 'Initializing audio engine...', progress: 25 },
      { text: 'Preparing game assets...', progress: 40 },
      { text: 'Loading character data...', progress: 55 },
      { text: 'Setting up board layouts...', progress: 70 },
      { text: 'Configuring minigames...', progress: 85 },
      { text: 'Ready to party!', progress: 100 }
    ];

    for (const step of loadingSteps) {
      loadingText.textContent = step.text;
      loadingProgress.style.width = `${step.progress}%`;
      await this.delay(400 + Math.random() * 200);
    }

    // Brief pause on 100%
    await this.delay(500);
    this.state.isLoading = false;
  }

  loadSettings() {
    const saved = localStorage.getItem('superJoJoParty_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...parsed };
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }
    this.applySettings();
  }

  saveSettings() {
    localStorage.setItem('superJoJoParty_settings', JSON.stringify(this.state.settings));
    this.applySettings();
  }

  resetSettings() {
    this.state.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    // Update UI controls to reflect defaults
    this.ui?.refreshSettingsUI?.();
    this.ui?.showToast?.('Settings reset to defaults', 'success');
  }

  applySettings() {
    // Apply audio settings
    if (this.audio) {
      this.audio.setMasterVolume(this.state.settings.masterVolume);
      this.audio.setMusicVolume(this.state.settings.musicVolume);
      this.audio.setSFXVolume(this.state.settings.sfxVolume);
      this.audio.setVoiceVolume(this.state.settings.voiceVolume);
    }

    // Apply visual settings
    if (this.game) {
      this.game.setQuality(this.state.settings.quality);
      this.game.setParticles(this.state.settings.particles);
    }
  }

  setUser(user) {
    this.state.user = user;
    this.ui.updateUserDisplay();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Navigation methods
  navigateTo(screen, data = {}) {
    this.state.currentScreen = screen;
    this.ui.showScreen(screen);
    
    // Define which screens should have menu music
    const menuScreens = ['main-menu', 'play-hub', 'shop', 'profile', 'settings', 'practice'];
    const isMenuScreen = menuScreens.includes(screen);
    
    // Handle music based on screen type
    if (isMenuScreen) {
      // Play menu music for menu screens
      if (this.audio.currentMusic !== 'menu') {
        this.audio.playMusic('menu');
      }
    } else {
      // Stop menu music for non-menu screens
      if (this.audio.currentMusic === 'menu' && !['lobby', 'character-select', 'voting'].includes(screen)) {
        this.audio.stopMusic();
      }
    }
    
    // Handle screen-specific initialization
    switch (screen) {
      case 'main-menu':
        // Music already handled above
        break;
      case 'lobby':
        this.lobby.initLobbyScreen(data);
        // Keep menu music in lobby
        if (this.audio.currentMusic !== 'menu') {
          this.audio.playMusic('menu');
        }
        break;
      case 'character-select':
        this.lobby.initCharacterSelectScreen(data);
        break;
      case 'voting':
        this.lobby.initVotingScreen(data);
        break;
      case 'game':
        this.game.initGame(data);
        this.audio.playMusic('board');
        break;
      case 'minigame':
        this.minigame.initMinigame(data);
        this.audio.playMusic('minigame');
        break;
      case 'results':
        this.ui.showResults(data);
        this.audio.playMusic('results');
        break;
      case 'shop':
        this.ui.loadShop();
        break;
      case 'profile':
        this.ui.loadProfile();
        break;
      case 'practice':
        this.ui.loadPractice();
        break;
    }
  }

  // Quick match - find or create lobby
  async quickMatch() {
    this.ui.showLoading('Finding match...');
    this.socket.connect();
    
    // Use callback pattern for socket.io quickMatch
    this.socket.socket.emit('lobby:quickMatch', (response) => {
      this.ui.hideLoading();
      if (response.success) {
        this.lobby.onLobbyJoined({ lobby: response.lobby, isHost: response.created });
        this.navigateTo('lobby', { lobby: response.lobby });
      } else {
        this.ui.showToast(response.error || 'Failed to find match', 'error');
      }
    });
  }
}
