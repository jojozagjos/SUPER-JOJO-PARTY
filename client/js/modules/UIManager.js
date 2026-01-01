/**
 * Super JoJo Party - UI Manager
 * Handles all UI interactions, screens, and visual feedback
 */

export class UIManager {
  constructor(app) {
    this.app = app;
    this.currentScreen = null;
    this.modals = new Set();
    this.ownedCharacters = ['jojo']; // Default
    
    this.setupEventListeners();
    this.setupAvatarSelection();
  }

  setupEventListeners() {
    // Main menu buttons
    document.getElementById('btn-play')?.addEventListener('click', () => {
      this.app.navigateTo('play-hub');
    });

    document.getElementById('btn-shop')?.addEventListener('click', () => {
      this.app.navigateTo('shop');
    });

    document.getElementById('btn-profile')?.addEventListener('click', () => {
      this.app.navigateTo('profile');
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.app.navigateTo('settings');
    });

    document.getElementById('btn-practice')?.addEventListener('click', () => {
      this.app.navigateTo('practice');
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.app.auth.logout();
    });

    // Play hub buttons
    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      this.app.quickMatch();
    });

    document.getElementById('btn-host-lobby')?.addEventListener('click', () => {
      this.showModal('host-lobby-modal');
    });

    document.getElementById('btn-join-lobby')?.addEventListener('click', () => {
      this.showModal('join-lobby-modal');
    });

    // Create account button (on guest profile banner)
    document.getElementById('create-account-btn')?.addEventListener('click', () => {
      this.app.auth.logout();  // This will redirect to login screen
      this.app.navigateTo('auth');
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleBack());
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    // Modal background click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideModal(modal.id);
      });
    });

    // Host modal form
    document.getElementById('host-lobby-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleHostLobby();
    });

    // Join modal tabs - use data-tab attribute selector
    document.querySelectorAll('.join-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchJoinTab(btn.dataset.tab);
      });
    });

    document.getElementById('join-by-code')?.addEventListener('click', () => {
      this.handleJoinByCode();
    });

    // Lobby actions
    document.getElementById('ready-btn')?.addEventListener('click', () => {
      this.app.lobby.toggleReady();
    });

    document.getElementById('leave-lobby')?.addEventListener('click', () => {
      this.app.lobby.leaveLobby();
    });

    document.getElementById('add-bot-btn')?.addEventListener('click', () => {
      this.app.lobby.addBot();
    });

    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.app.lobby.startGame();
    });

    // Copy lobby code
    document.getElementById('copy-code')?.addEventListener('click', () => {
      this.copyLobbyCode();
    });

    // Chat toggle
    document.getElementById('chat-toggle')?.addEventListener('click', () => {
      this.toggleChat();
    });

    // Chat
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('send-chat');

    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    chatSendBtn?.addEventListener('click', () => this.sendChatMessage());

    // Pause menu
    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.showOverlay('pause-menu');
    });

    document.getElementById('resume-btn')?.addEventListener('click', () => {
      this.hideOverlay('pause-menu');
    });

    // Pause menu tabs
    document.querySelectorAll('.pause-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchPauseTab(btn.dataset.tab));
    });

    // Controls info toggle
    document.getElementById('show-controls-btn')?.addEventListener('click', () => {
      const controlsInfo = document.getElementById('controls-info');
      const menuTab = document.getElementById('pause-menu-tab');
      if (controlsInfo && menuTab) {
        controlsInfo.style.display = 'block';
        menuTab.style.display = 'none';
        this.refreshKeybindUI();
      }
    });

    document.getElementById('close-controls-btn')?.addEventListener('click', () => {
      const controlsInfo = document.getElementById('controls-info');
      const menuTab = document.getElementById('pause-menu-tab');
      if (controlsInfo && menuTab) {
        controlsInfo.style.display = 'none';
        menuTab.style.display = 'block';
      }
    });

    document.getElementById('quit-game-btn')?.addEventListener('click', () => {
      this.app.socket.emit('game:leave');
      this.app.navigateTo('main-menu');
      this.hideOverlay('pause-menu');
    });

    // Escape key to toggle pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentScreen === 'game') {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu?.classList.contains('active')) {
          this.hideOverlay('pause-menu');
        } else {
          this.showOverlay('pause-menu');
        }
      }
    });

    // Setup pause settings controls
    this.setupPauseSettingsControls();

    // Setup keybind rebinding UI
    this.setupKeybindControls();

    // Settings controls
    this.setupSettingsControls();

    // Results screen
    document.getElementById('results-rematch-btn')?.addEventListener('click', () => {
      this.app.lobby.requestRematch();
    });

    document.getElementById('results-menu-btn')?.addEventListener('click', () => {
      this.app.navigateTo('main-menu');
    });

    // Shop categories
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchShopCategory(e.target.dataset.category);
      });
    });
  }

  switchPauseTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.pause-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.getElementById('pause-menu-tab')?.classList.toggle('active', tab === 'menu');
    document.getElementById('pause-settings-tab')?.classList.toggle('active', tab === 'settings');
    
    // Hide controls info when switching tabs
    const controlsInfo = document.getElementById('controls-info');
    if (controlsInfo) controlsInfo.style.display = 'none';
    
    // Ensure menu tab is visible
    const menuTab = document.getElementById('pause-menu-tab');
    if (menuTab && tab === 'menu') menuTab.style.display = 'block';
  }

  setupPauseSettingsControls() {
    // Pause menu volume sliders
    const pauseVolumeSliders = [
      { id: 'pause-master-volume', setting: 'masterVolume', valueId: 'pause-master-value' },
      { id: 'pause-music-volume', setting: 'musicVolume', valueId: 'pause-music-value' },
      { id: 'pause-sfx-volume', setting: 'sfxVolume', valueId: 'pause-sfx-value' }
    ];

    pauseVolumeSliders.forEach(({ id, setting, valueId }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);
      
      if (slider) {
        slider.value = this.app.state.settings?.[setting] ?? 100;
        if (valueDisplay) valueDisplay.textContent = `${slider.value}%`;
        
        slider.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          if (this.app.state.settings) {
            this.app.state.settings[setting] = value;
          }
          if (valueDisplay) valueDisplay.textContent = `${value}%`;
          
          // Apply immediately
          if (setting === 'masterVolume') this.app.audio?.setMasterVolume(value);
          else if (setting === 'musicVolume') this.app.audio?.setMusicVolume(value);
          else if (setting === 'sfxVolume') this.app.audio?.setSFXVolume(value);
          
          this.app.saveSettings?.();
        });
      }
    });

    // Pause quality select
    const pauseQuality = document.getElementById('pause-quality');
    if (pauseQuality) {
      pauseQuality.value = this.app.state.settings?.quality || 'high';
      pauseQuality.addEventListener('change', (e) => {
        if (this.app.state.settings) {
          this.app.state.settings.quality = e.target.value;
        }
        this.app.saveSettings?.();
        // Quality changes will apply on next scene render
      });
    }
  }

  setupSettingsControls() {
    // Volume sliders
    const volumeSliders = [
      { id: 'master-volume', setting: 'masterVolume' },
      { id: 'music-volume', setting: 'musicVolume' },
      { id: 'sfx-volume', setting: 'sfxVolume' },
      { id: 'voice-volume', setting: 'voiceVolume' }
    ];

    volumeSliders.forEach(({ id, setting }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(`${id}-value`);
      
      if (slider) {
        slider.value = this.app.state.settings[setting];
        if (valueDisplay) valueDisplay.textContent = `${slider.value}%`;
        
        slider.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          this.app.state.settings[setting] = value;
          if (valueDisplay) valueDisplay.textContent = `${value}%`;
          this.app.saveSettings();
        });
      }
    });

    // Quality select
    const qualitySelect = document.getElementById('quality-select');
    if (qualitySelect) {
      qualitySelect.value = this.app.state.settings.quality;
      qualitySelect.addEventListener('change', (e) => {
        this.app.state.settings.quality = e.target.value;
        this.app.saveSettings();
      });
    }

    // Particles toggle
    const particlesToggle = document.getElementById('particles-toggle');
    if (particlesToggle) {
      particlesToggle.checked = this.app.state.settings.particles;
      particlesToggle.addEventListener('change', (e) => {
        this.app.state.settings.particles = e.target.checked;
        this.app.saveSettings();
      });
    }

    // Screen shake toggle
    const shakeToggle = document.getElementById('screen-shake-toggle');
    if (shakeToggle) {
      shakeToggle.checked = this.app.state.settings.screenShake;
      shakeToggle.addEventListener('change', (e) => {
        this.app.state.settings.screenShake = e.target.checked;
        this.app.saveSettings();
      });
    }

    // Tutorials toggle
    const tutorialsToggle = document.getElementById('tutorials-toggle');
    if (tutorialsToggle) {
      tutorialsToggle.checked = this.app.state.settings.showTutorials;
      tutorialsToggle.addEventListener('change', (e) => {
        this.app.state.settings.showTutorials = e.target.checked;
        this.app.saveSettings();
      });
    }

    // Reset to default button
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.app.resetSettings();
      });
    }

    // Save settings button
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.app.saveSettings();
        this.showToast('Settings saved successfully!', 'success');
        this.app.audio?.playSFX('success');
      });
    }
  }

  setupKeybindControls() {
    const rows = document.querySelectorAll('.keybind-row');
    rows.forEach(row => {
      const action = row.dataset.keybindAction;
      const btn = row.querySelector('.keybind-btn');
      if (!btn) return;
      btn.addEventListener('click', () => this.beginKeybindRebind(action, btn));
    });
    this.refreshKeybindUI();
  }

  refreshKeybindUI() {
    const bindings = this.app.minigame?.keybinds || {};
    document.querySelectorAll('.keybind-row').forEach(row => {
      const action = row.dataset.keybindAction;
      const btn = row.querySelector('.keybind-btn');
      if (!btn) return;
      const code = bindings[action]?.[0];
      btn.textContent = code ? this.formatKeyLabel(code) : 'Unbound';
    });
  }

  formatKeyLabel(code) {
    if (!code) return 'Unbound';
    const map = {
      Space: 'Space',
      ShiftLeft: 'Left Shift',
      ShiftRight: 'Right Shift',
      ControlLeft: 'Left Ctrl',
      ControlRight: 'Right Ctrl',
      AltLeft: 'Left Alt',
      AltRight: 'Right Alt'
    };
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    return map[code] || code;
  }

  beginKeybindRebind(action, button) {
    if (!this.app.minigame) {
      this.showToast('Minigame not ready yet', 'warning');
      return;
    }

    if (this._keybindCapture) {
      document.removeEventListener('keydown', this._keybindCapture, true);
      this._keybindCapture = null;
    }

    const originalText = button.textContent;
    button.textContent = 'Press any key...';

    this._keybindCapture = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const code = ev.code;
      // Escape cancels rebinding
      if (code === 'Escape') {
        button.textContent = originalText;
      } else {
        this.app.minigame.rebindAction(action, [code]);
        button.textContent = this.formatKeyLabel(code);
        this.showToast(`Bound ${action} to ${this.formatKeyLabel(code)}`, 'success');
      }
      document.removeEventListener('keydown', this._keybindCapture, true);
      this._keybindCapture = null;
    };

    document.addEventListener('keydown', this._keybindCapture, true);
  }

  refreshSettingsUI() {
    // Update all settings controls to reflect current values
    const settings = this.app.state.settings;

    // Volume sliders
    const sliders = [
      { id: 'master-volume', setting: 'masterVolume' },
      { id: 'music-volume', setting: 'musicVolume' },
      { id: 'sfx-volume', setting: 'sfxVolume' },
      { id: 'voice-volume', setting: 'voiceVolume' }
    ];

    sliders.forEach(({ id, setting }) => {
      const slider = document.getElementById(id);
      const valueDisplay = slider?.nextElementSibling;
      if (slider) {
        slider.value = settings[setting];
        if (valueDisplay) valueDisplay.textContent = `${settings[setting]}%`;
      }
    });

    // Quality select
    const qualitySelect = document.getElementById('graphics-quality');
    if (qualitySelect) qualitySelect.value = settings.quality;

    // Checkboxes
    const reducedMotion = document.getElementById('reduced-motion');
    if (reducedMotion) reducedMotion.checked = !settings.particles;

    const showTutorial = document.getElementById('show-tutorial');
    if (showTutorial) showTutorial.checked = settings.showTutorials;

    // UI Scale
    const uiScale = document.getElementById('ui-scale');
    const uiScaleValue = uiScale?.nextElementSibling;
    if (uiScale) {
      uiScale.value = 100;
      if (uiScaleValue) uiScaleValue.textContent = '100%';
    }

    // Camera sensitivity
    const camSensitivity = document.getElementById('camera-sensitivity');
    const camSensValue = camSensitivity?.nextElementSibling;
    if (camSensitivity) {
      camSensitivity.value = 100;
      if (camSensValue) camSensValue.textContent = '100%';
    }
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenId;
      if (screenId === 'settings') {
        this.refreshKeybindUI();
      }
    }
  }

  handleBack() {
    const backNavigation = {
      'play-hub': 'main-menu',
      'lobby': 'play-hub',
      'shop': 'main-menu',
      'profile': 'main-menu',
      'settings': 'main-menu',
      'practice': 'main-menu'
    };

    const targetScreen = backNavigation[this.currentScreen];
    if (targetScreen) {
      this.app.navigateTo(targetScreen);
      this.app.audio.playSFX('back');
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.modals.add(modalId);
      this.app.audio.playSFX('modalOpen');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      this.modals.delete(modalId);
    }
  }

  hideAllModals() {
    this.modals.forEach(modalId => this.hideModal(modalId));
  }

  showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  showLoading(message = 'Loading...') {
    this.showToast(message, 'info');
  }

  hideLoading() {
    // Loading toast will auto-hide
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showAchievementNotification(achievements) {
    if (!achievements || achievements.length === 0) return;

    const rarityColors = {
      common: '#9E9E9E',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800'
    };

    // Create achievement notification container if it doesn't exist
    let container = document.getElementById('achievement-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    // Show each achievement with a delay
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 2px ${rarityColors[achievement.rarity] || '#6C5CE7'};
          animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 4.5s;
          min-width: 320px;
          max-width: 400px;
          pointer-events: auto;
        `;

        notification.innerHTML = `
          <div class="achievement-icon" style="font-size: 2.5rem; text-shadow: 0 0 20px ${rarityColors[achievement.rarity]};">
            ${achievement.icon}
          </div>
          <div class="achievement-info" style="flex: 1;">
            <div style="font-size: 0.75rem; color: ${rarityColors[achievement.rarity]}; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">
              🏆 Achievement Unlocked!
            </div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #fff; margin-bottom: 4px;">
              ${achievement.name}
            </div>
            <div style="font-size: 0.85rem; color: #b8b8d1;">
              ${achievement.description}
            </div>
            ${achievement.reward?.credits ? `
              <div style="font-size: 0.8rem; color: #FDCB6E; margin-top: 6px;">
                +${achievement.reward.credits} 💎 Credits
              </div>
            ` : ''}
          </div>
        `;

        container.appendChild(notification);

        // Play achievement sound
        this.app.audio?.playSFX('achievement');

        // Remove after animation
        setTimeout(() => {
          notification.remove();
        }, 5000);

      }, index * 1500); // Stagger notifications
    });
  }

  updateUserDisplay() {
    const user = this.app.state.user;
    if (!user) return;

    // Update username displays
    document.querySelectorAll('.player-name').forEach(el => {
      el.textContent = user.username;
    });

    // Update credits displays
    document.querySelectorAll('.player-credits, .credits-display').forEach(el => {
      el.textContent = `${user.credits || 0} 💎`;
    });

    // Profile screen
    const profileUsername = document.getElementById('profile-username');
    if (profileUsername) {
      profileUsername.textContent = user.username;
    }
  }

  handleHostLobby() {
    const lobbyName = document.getElementById('lobby-name')?.value.trim() || `${this.app.state.user.username}'s Party`;
    const isPublic = document.getElementById('lobby-public')?.checked ?? true;
    const maxPlayers = parseInt(document.getElementById('lobby-max-players')?.value) || 20;

    this.app.socket.connect();
    
    // Use callback pattern for socket.io
    this.app.socket.socket.emit('lobby:create', {
      settings: {
        name: lobbyName,
        isPublic,
        maxPlayers
      }
    }, (response) => {
      this.hideLoading();
      if (response.success) {
        this.app.lobby.onLobbyJoined({ lobby: response.lobby, isHost: true });
        this.app.navigateTo('lobby', { lobby: response.lobby });
      } else {
        this.showToast(response.error || 'Failed to create lobby', 'error');
      }
    });

    this.hideModal('host-lobby-modal');
    this.showLoading('Creating lobby...');
  }

  switchJoinTab(tab) {
    // Tab buttons
    const tabBtns = document.querySelectorAll('.join-tabs .tab-btn');
    // Content divs
    const browseContent = document.getElementById('browse-tab');
    const codeContent = document.getElementById('code-tab');

    // Reset all tabs
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));

    if (tab === 'browse') {
      browseContent?.classList.add('active');
      codeContent?.classList.remove('active');
      this.loadLobbyList();
    } else {
      browseContent?.classList.remove('active');
      codeContent?.classList.add('active');
    }
  }

  async loadLobbyList() {
    const lobbyList = document.getElementById('lobby-list');
    if (!lobbyList) return;

    lobbyList.innerHTML = '<p class="empty-message">Loading lobbies...</p>';

    try {
      const response = await fetch('/api/lobbies', {
        headers: {
          'Authorization': `Bearer ${this.app.auth.getToken()}`
        }
      });
      const data = await response.json();

      if (data.lobbies && data.lobbies.length > 0) {
        lobbyList.innerHTML = data.lobbies.map(lobby => `
          <div class="lobby-item" data-lobby-id="${lobby.id}">
            <div class="lobby-item-info">
              <div class="lobby-item-name">${this.escapeHtml(lobby.name)}</div>
              <div class="lobby-item-host">Host: ${this.escapeHtml(lobby.host)}</div>
            </div>
            <div class="lobby-item-players">${lobby.playerCount}/${lobby.maxPlayers}</div>
          </div>
        `).join('');

        // Add click handlers
        lobbyList.querySelectorAll('.lobby-item').forEach(item => {
          item.addEventListener('click', () => {
            const lobbyId = item.dataset.lobbyId;
            this.joinLobby(lobbyId);
          });
        });
      } else {
        lobbyList.innerHTML = '<p class="empty-message">No public lobbies available</p>';
      }
    } catch (error) {
      console.error('Failed to load lobbies:', error);
      lobbyList.innerHTML = '<p class="empty-message">Failed to load lobbies</p>';
    }
  }

  joinLobby(lobbyId) {
    this.app.socket.connect();
    
    // Use callback pattern for socket.io
    this.app.socket.socket.emit('lobby:join', lobbyId, (response) => {
      this.hideLoading();
      if (response.success) {
        this.app.lobby.onLobbyJoined({ lobby: response.lobby, isHost: false });
        this.app.navigateTo('lobby', { lobby: response.lobby });
      } else {
        this.showToast(response.error || 'Failed to join lobby', 'error');
      }
    });
    
    this.hideModal('join-lobby-modal');
    this.showLoading('Joining lobby...');
  }

  handleJoinByCode() {
    const code = document.getElementById('join-code')?.value.trim().toUpperCase();
    
    if (!code || code.length !== 6) {
      this.showToast('Please enter a valid 6-character code', 'error');
      return;
    }

    this.app.socket.connect();
    
    // Use callback pattern for socket.io
    this.app.socket.socket.emit('lobby:joinByCode', code, (response) => {
      this.hideLoading();
      if (response.success) {
        this.app.lobby.onLobbyJoined({ lobby: response.lobby, isHost: false });
        this.app.navigateTo('lobby', { lobby: response.lobby });
      } else {
        this.showToast(response.error || 'Failed to join lobby', 'error');
      }
    });
    
    this.hideModal('join-lobby-modal');
    this.showLoading('Joining lobby...');
  }

  copyLobbyCode() {
    const codeEl = document.getElementById('lobby-code');
    if (!codeEl) return;

    const code = codeEl.textContent;
    navigator.clipboard.writeText(code).then(() => {
      this.showToast('Lobby code copied!', 'success');
      this.app.audio.playSFX('click');
    }).catch(() => {
      this.showToast('Failed to copy code', 'error');
    });
  }

  sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    this.app.socket.emit('chat:message', message);
    input.value = '';
  }

  addChatMessage(data) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
      <span class="chat-name">${this.escapeHtml(data.username)}:</span>
      <span class="chat-text">${this.escapeHtml(data.message)}</span>
    `;

    messages.appendChild(messageEl);
    messages.scrollTop = messages.scrollHeight;
  }

  toggleChat() {
    const chatSection = document.getElementById('lobby-chat');
    const toggleBtn = document.getElementById('chat-toggle');
    if (!chatSection) return;

    chatSection.classList.toggle('collapsed');
    if (toggleBtn) {
      toggleBtn.textContent = chatSection.classList.contains('collapsed') ? '💬 Show Chat' : '💬 Hide Chat';
    }
  }

  switchShopCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    this.loadShopItems(category);
  }

  async loadShop() {
    this.switchShopCategory('characters');
  }

  async loadShopItems(category) {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="empty-message">Loading items...</p>';

    // Determine guest state
    const isGuest = this.app.state.user?.isGuest;

    try {
      // Get shop items
      const response = await fetch('/api/shop', {
        headers: { 'Authorization': `Bearer ${this.app.auth.getToken()}` }
      });
      const data = await response.json();
      
      // Get profile to see equipped items
      const profileResponse = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${this.app.auth.getToken()}` }
      });
      const profileData = await profileResponse.json();
      const equippedItems = {
        character: profileData.profile?.selected_character || 'jojo',
        hat: profileData.profile?.selected_hat,
        trail: profileData.profile?.selected_trail,
        emote: profileData.profile?.selected_emote
      };

      if (data.items && data.items.length > 0) {
        // Filter items by category (character -> characters)
        const categoryMap = { 'characters': 'character', 'hats': 'hat', 'trails': 'trail', 'emotes': 'emote' };
        const itemType = categoryMap[category] || category;
        const filteredItems = data.items.filter(item => item.type === itemType);
        
        // Store items for preview
        this.currentShopItems = filteredItems;
        
        if (filteredItems.length > 0) {
          grid.innerHTML = filteredItems.map(item => {
            const isEquipped = equippedItems[item.type] === item.id;
            // JoJo is always owned (default character)
            const isOwned = item.owned || item.isDefault || item.id === 'jojo';
            // Use portrait image for characters, icon for other items
            const previewContent = item.type === 'character' 
              ? `<img src="/assets/characters/${item.id}/portrait.svg" alt="${item.name}" class="char-portrait">`
              : item.icon || '❓';
            
            // Determine price display
            let priceDisplay;
            if (isEquipped) {
              priceDisplay = '✓ Equipped';
            } else if (isOwned) {
              priceDisplay = 'Owned';
            } else if (isGuest) {
              priceDisplay = '🔒 Account Required';
            } else if (item.price === 0) {
              priceDisplay = 'Free';
            } else {
              priceDisplay = `${item.price} 💎`;
            }
            
            return `
              <div class="shop-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''} ${isGuest && !isOwned ? 'guest-locked' : ''}" 
                   data-item-id="${item.id}" data-item-type="${item.type}">
                <button class="btn btn-sm btn-preview" title="Preview">👁️</button>
                <div class="card-preview">${previewContent}</div>
                <div class="card-name">${this.escapeHtml(item.name)}</div>
                <div class="card-price">${priceDisplay}</div>
                ${isOwned && !isEquipped ? '<button class="btn btn-sm btn-equip">Equip</button>' : ''}
              </div>
            `;
          }).join('');

          // Add click handlers for preview buttons
          grid.querySelectorAll('.btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const card = btn.closest('.shop-card');
              this.showItemPreview(card.dataset.itemId, card.dataset.itemType);
            });
          });

          // Add click handlers for purchasing
          grid.querySelectorAll('.shop-card:not(.owned):not(.guest-locked)').forEach(card => {
            card.addEventListener('click', (e) => {
              if (!e.target.classList.contains('btn-equip') && !e.target.classList.contains('btn-preview')) {
                this.purchaseItem(card.dataset.itemId, card.dataset.itemType);
              }
            });
          });

          // Add click handler for equip buttons
          grid.querySelectorAll('.btn-equip').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const card = btn.closest('.shop-card');
              this.equipItem(card.dataset.itemId, card.dataset.itemType);
            });
          });

          // Add click handler for guest-locked items to show message
          grid.querySelectorAll('.shop-card.guest-locked').forEach(card => {
            card.addEventListener('click', (e) => {
              if (!e.target.classList.contains('btn-preview')) {
                this.showToast('Create an account to purchase items!', 'warning');
              }
            });
          });
        } else {
          grid.innerHTML = '<p class="empty-message">No items in this category</p>';
        }
      } else {
        grid.innerHTML = '<p class="empty-message">No items available</p>';
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
      grid.innerHTML = '<p class="empty-message">Failed to load items</p>';
    }
  }

  async equipItem(itemId, itemType) {
    try {
      const fieldMap = {
        'character': 'selected_character',
        'hat': 'selected_hat',
        'trail': 'selected_trail',
        'emote': 'selected_emote'
      };
      
      const field = fieldMap[itemType];
      if (!field) return;

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.app.auth.getToken()}`
        },
        body: JSON.stringify({ [field]: itemId })
      });

      if (response.ok) {
        this.showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} equipped!`, 'success');
        this.app.audio.playSFX('itemGet');
        // Refresh the shop to show equipped state
        this.loadShopItems(document.querySelector('.category-btn.active')?.dataset.category || 'characters');
      } else {
        this.showToast('Failed to equip item', 'error');
      }
    } catch (error) {
      console.error('Equip error:', error);
      this.showToast('Failed to equip item', 'error');
    }
  }

  async purchaseItem(itemId, itemType) {
    // Double-check guest status
    if (this.app.state.user?.isGuest) {
      this.showToast('Create an account to purchase items!', 'warning');
      this.showModal({
        title: '👤 Guest Account',
        content: `
          <p>You're currently playing as a guest.</p>
          <p>Create a free account to:</p>
          <ul style="text-align: left; margin: 1rem 0;">
            <li>✨ Purchase cosmetic items</li>
            <li>💰 Earn and save credits</li>
            <li>🏆 Track achievements</li>
            <li>📊 Save your progress</li>
          </ul>
        `,
        buttons: [
          { text: 'Sign Up', action: () => { this.hideModal(); this.app.navigateTo('menu'); }, primary: true },
          { text: 'Maybe Later', action: () => this.hideModal() }
        ]
      });
      return;
    }

    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.app.auth.getToken()}`
        },
        body: JSON.stringify({ itemId, itemType })
      });

      const data = await response.json();

      if (response.ok) {
        this.showToast('Item purchased!', 'success');
        this.app.audio.playSFX('purchase');
        this.app.state.user.credits = data.newCredits;
        this.updateUserDisplay();
        this.loadShopItems(document.querySelector('.category-btn.active')?.dataset.category || 'characters');
      } else if (response.status === 403) {
        // Guest trying to purchase
        this.showToast('Create an account to purchase items!', 'warning');
      } else {
        this.showToast(data.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      this.showToast('Failed to purchase item', 'error');
    }
  }

  showItemPreview(itemId, itemType) {
    const item = this.currentShopItems?.find(i => i.id === itemId && i.type === itemType);
    if (!item) return;

    const modal = document.getElementById('item-preview-modal');
    if (!modal) return;

    // Update preview content - use portrait for characters
    const previewIcon = document.getElementById('preview-icon');
    if (item.type === 'character') {
      previewIcon.innerHTML = `<img src="/assets/characters/${item.id}/portrait.svg" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
      previewIcon.textContent = item.icon || '❓';
    }
    
    document.getElementById('preview-name').textContent = item.name;
    document.getElementById('preview-description').textContent = item.description || this.getItemDescription(item);
    document.getElementById('preview-type-value').textContent = this.capitalizeFirst(item.type);
    
    const rarityEl = document.getElementById('preview-rarity-value');
    const rarity = item.rarity || 'common';
    rarityEl.textContent = this.capitalizeFirst(rarity);
    rarityEl.className = rarity;

    // Set up showcase animation - different for each type
    const showcase = document.getElementById('preview-showcase');
    showcase.innerHTML = this.getShowcaseContent(item);

    // JoJo is always owned
    const isOwned = item.owned || item.isDefault || item.id === 'jojo';
    
    // Update purchase button
    const purchaseBtn = document.getElementById('preview-purchase-btn');
    const priceSpan = document.getElementById('preview-price');
    
    purchaseBtn.classList.remove('owned', 'equipped');
    purchaseBtn.disabled = false;
    
    if (isOwned) {
      if (this.isItemEquipped(item.id, item.type)) {
        purchaseBtn.innerHTML = '✓ Equipped';
        purchaseBtn.classList.add('equipped');
        purchaseBtn.disabled = true;
      } else {
        purchaseBtn.innerHTML = 'Equip';
        purchaseBtn.classList.add('owned');
        purchaseBtn.disabled = false;
        purchaseBtn.removeEventListener('click', purchaseBtn._equipHandler);
        purchaseBtn._equipHandler = () => {
          this.equipItem(item.id, item.type);
          modal.classList.remove('active');
        };
        purchaseBtn.addEventListener('click', purchaseBtn._equipHandler);
      }
    } else if (this.app.state.user?.isGuest) {
      purchaseBtn.innerHTML = '🔒 Account Required';
      purchaseBtn.disabled = true;
    } else {
      const priceText = item.price === 0 ? 'Free' : `${item.price} 💎`;
      purchaseBtn.innerHTML = item.price === 0 ? 'Claim Free!' : `Buy for <span id="preview-price">${item.price}</span> 💎`;
      purchaseBtn.removeEventListener('click', purchaseBtn._buyHandler);
      purchaseBtn._buyHandler = () => {
        this.purchaseItem(item.id, item.type);
        modal.classList.remove('active');
      };
      purchaseBtn.addEventListener('click', purchaseBtn._buyHandler);
    }

    // Close button handler
    const closeBtn = document.getElementById('preview-close-btn');
    if (closeBtn) {
      closeBtn.removeEventListener('click', closeBtn._closeHandler);
      closeBtn._closeHandler = () => modal.classList.remove('active');
      closeBtn.addEventListener('click', closeBtn._closeHandler);
    }
    const modalCloseBtn = modal.querySelector('.modal-close');
    if (modalCloseBtn) {
      modalCloseBtn.removeEventListener('click', modalCloseBtn._closeHandler);
      modalCloseBtn._closeHandler = () => modal.classList.remove('active');
      modalCloseBtn.addEventListener('click', modalCloseBtn._closeHandler);
    }

    // Show modal
    modal.classList.add('active');
    this.app.audio.playSFX('menuSelect');
  }

  getShowcaseContent(item) {
    // Generate animated showcase content based on item type
    if (item.type === 'character') {
      return `
        <div class="showcase-character">
          <img src="/assets/characters/${item.id}/portrait.svg" alt="${item.name}" class="showcase-portrait">
          <div class="showcase-glow"></div>
        </div>
      `;
    } else if (item.type === 'trail') {
      // Show animated particle trail effect
      const trailColors = {
        sparkles: '#FFD700',
        rainbow: 'linear-gradient(90deg, red, orange, yellow, green, blue, purple)',
        fire: '#FF4500',
        snowflake: '#87CEEB',
        hearts: '#FF69B4',
        music: '#9370DB',
        star: '#FFD700',
        lightning: '#00BFFF'
      };
      const color = trailColors[item.id] || '#6C5CE7';
      return `
        <div class="showcase-trail">
          <div class="trail-demo" style="--trail-color: ${color}">
            <div class="trail-icon">${item.icon}</div>
            <div class="trail-particles">
              ${Array(8).fill(0).map((_, i) => `<span class="particle" style="--i: ${i};">${item.icon}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (item.type === 'hat') {
      return `
        <div class="showcase-hat">
          <div class="hat-demo">
            <span class="hat-icon bounce">${item.icon}</span>
          </div>
        </div>
      `;
    } else if (item.type === 'emote') {
      return `
        <div class="showcase-emote">
          <div class="emote-demo pulse">
            <span class="emote-icon">${item.icon}</span>
          </div>
        </div>
      `;
    }
    return `<div class="showcase-animation">${item.icon || '❓'}</div>`;
  }

  isItemEquipped(itemId, itemType) {
    const profile = this.app.state.user?.profile;
    if (!profile) return false;
    
    const fieldMap = {
      'character': 'selected_character',
      'hat': 'selected_hat',
      'trail': 'selected_trail',
      'emote': 'selected_emote'
    };
    
    return profile[fieldMap[itemType]] === itemId;
  }

  getItemDescription(item) {
    // Generate descriptions based on item type
    const descriptions = {
      character: `Play as ${item.name}! A unique character with their own personality.`,
      hat: `Equip the ${item.name} to customize your character's appearance.`,
      trail: `Leave a trail of ${item.name.toLowerCase()} particles behind you as you move!`,
      emote: `Express yourself with the ${item.name} emote during games.`
    };
    return descriptions[item.type] || 'A collectible item for your collection.';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async loadProfile() {
    try {
      // Check if guest
      const isGuest = this.app.state.user?.isGuest;
      
      // Guest account - show limited profile
      if (isGuest) {
        document.getElementById('profile-username').textContent = this.app.state.user?.username || 'Guest';
        document.getElementById('profile-credits').textContent = '0';
        document.getElementById('stat-games').textContent = '0';
        document.getElementById('stat-wins').textContent = '0';
        document.getElementById('stat-stars').textContent = '0';
        document.getElementById('stat-minigames').textContent = '0';
        document.getElementById('change-avatar-btn').style.display = 'none';
        this.loadAchievements([], true);
        return;
      }

      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${this.app.auth.getToken()}` }
      });

      const data = await response.json();

      if (response.ok) {
        // Update profile username
        document.getElementById('profile-username').textContent = data.username || 'Player';
        document.getElementById('profile-credits').textContent = data.credits || 0;
        
        // Update avatar image
        const avatarImg = document.getElementById('profile-avatar-img');
        if (avatarImg && data.profile?.selected_character) {
          avatarImg.src = `/assets/characters/${data.profile.selected_character}/portrait.svg`;
        }
        
        // Store owned characters for avatar selection
        this.ownedCharacters = data.ownedCharacters || ['jojo'];
        
        // Update stats
        const stats = data.stats || {};
        document.getElementById('stat-wins').textContent = stats.games_won || 0;
        document.getElementById('stat-games').textContent = stats.games_played || 0;
        document.getElementById('stat-minigames').textContent = stats.minigames_won || 0;
        document.getElementById('stat-stars').textContent = stats.total_stars || 0;

        // Load achievements
        this.loadAchievements(data.achievements || [], false);
        
        // Setup avatar change button
        document.getElementById('change-avatar-btn').style.display = 'block';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  loadAchievements(userAchievements = [], isGuest = false) {
    const grid = document.getElementById('achievement-grid');
    const categoriesEl = document.getElementById('achievement-categories');
    const progressFill = document.getElementById('achievement-progress-fill');
    const progressText = document.getElementById('achievement-progress-text');
    
    if (!grid) return;

    if (isGuest) {
      grid.innerHTML = `
        <div class="guest-achievements-message">
          <p>🔒</p>
          <h3>Achievements Locked</h3>
          <p>You cannot earn or track achievements as a guest.</p>
          <p class="guest-achievements-hint">Create an account or log in to unlock achievements and earn rewards!</p>
          <button class="btn btn-primary guest-login-btn" id="guest-achievements-login">Log In / Sign Up</button>
        </div>
      `;
      // Add click handler for login button
      document.getElementById('guest-achievements-login')?.addEventListener('click', () => {
        this.app.auth.logout();
      });
      if (categoriesEl) categoriesEl.innerHTML = '';
      if (progressFill) progressFill.style.width = '0%';
      if (progressText) progressText.textContent = '0/0';
      return;
    }

    // Calculate progress
    const unlocked = userAchievements.filter(a => a.unlocked).length;
    const total = userAchievements.length;
    
    if (progressFill) {
      progressFill.style.width = total > 0 ? `${(unlocked / total) * 100}%` : '0%';
    }
    if (progressText) {
      progressText.textContent = `${unlocked}/${total}`;
    }

    // Group achievements by category
    const categories = {};
    userAchievements.forEach(ach => {
      const cat = ach.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(ach);
    });

    // Create category tabs
    if (categoriesEl) {
      const categoryNames = {
        getting_started: '🎉 Getting Started',
        completion: '📊 Completion',
        wins: '🏆 Wins',
        stars: '⭐ Stars',
        coins: '🪙 Coins',
        minigames: '🎮 Minigames',
        special: '✨ Special',
        other: '📦 Other'
      };
      
      categoriesEl.innerHTML = Object.keys(categories).map((cat, i) => `
        <button class="category-tab ${i === 0 ? 'active' : ''}" data-category="${cat}">
          ${categoryNames[cat] || cat}
        </button>
      `).join('');

      // Add click handlers
      categoriesEl.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          categoriesEl.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderAchievementCategory(categories[tab.dataset.category]);
        });
      });
    }

    // Render first category
    const firstCategory = Object.keys(categories)[0];
    if (firstCategory) {
      this.renderAchievementCategory(categories[firstCategory]);
    } else {
      grid.innerHTML = '<p class="no-achievements">No achievements yet!</p>';
    }
  }

  renderAchievementCategory(achievements) {
    const grid = document.getElementById('achievement-grid');
    if (!grid) return;

    const rarityColors = {
      common: '#9e9e9e',
      uncommon: '#4caf50',
      rare: '#2196f3',
      epic: '#9c27b0',
      legendary: '#ff9800'
    };

    grid.innerHTML = achievements.map(ach => {
      const progressPercent = ach.target > 0 ? Math.min(100, (ach.progress / ach.target) * 100) : 0;
      const isUnlocked = ach.unlocked;
      
      return `
        <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" style="--rarity-color: ${rarityColors[ach.rarity] || '#9e9e9e'}">
          <div class="achievement-icon">${ach.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.description}</div>
            ${!isUnlocked ? `
              <div class="achievement-progress">
                <div class="progress-bar-mini">
                  <div class="progress-fill-mini" style="width: ${progressPercent}%"></div>
                </div>
                <span class="progress-numbers">${ach.progress || 0}/${ach.target}</span>
              </div>
            ` : `
              <div class="achievement-reward">+${ach.reward?.credits || 0} 💎</div>
            `}
          </div>
          ${isUnlocked ? '<div class="achievement-checkmark">✓</div>' : ''}
        </div>
      `;
    }).join('');
  }

  setupAvatarSelection() {
    const changeBtn = document.getElementById('change-avatar-btn');
    const modal = document.getElementById('avatar-selection-modal');
    
    if (changeBtn) {
      changeBtn.addEventListener('click', () => this.openAvatarModal());
    }
    
    if (modal) {
      modal.querySelector('.modal-close')?.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }
  }

  openAvatarModal() {
    const modal = document.getElementById('avatar-selection-modal');
    const grid = document.getElementById('avatar-grid');
    
    if (!modal || !grid) return;
    
    const characters = [
      { id: 'jojo', name: 'JoJo', icon: '🎭' },
      { id: 'mimi', name: 'Mimi', icon: '🦋' }
    ];
    
    grid.innerHTML = characters.map(char => {
      const isOwned = this.ownedCharacters?.includes(char.id);
      const isSelected = this.app.state.user?.profile?.selected_character === char.id;
      
      return `
        <div class="avatar-option ${isOwned ? 'owned' : 'locked'} ${isSelected ? 'selected' : ''}" 
             data-character-id="${char.id}" ${!isOwned ? 'title="Not owned"' : ''}>
          <img src="/assets/characters/${char.id}/portrait.svg" alt="${char.name}">
          <span class="avatar-name">${char.name}</span>
          ${!isOwned ? '<span class="lock-icon">🔒</span>' : ''}
          ${isSelected ? '<span class="selected-icon">✓</span>' : ''}
        </div>
      `;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.avatar-option.owned:not(.selected)').forEach(option => {
      option.addEventListener('click', () => this.selectAvatar(option.dataset.characterId));
    });

    modal.classList.add('active');
  }

  async selectAvatar(characterId) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.app.auth.getToken()}`
        },
        body: JSON.stringify({ selected_character: characterId })
      });

      if (response.ok) {
        // Update avatar image
        const avatarImg = document.getElementById('profile-avatar-img');
        if (avatarImg) {
          avatarImg.src = `/assets/characters/${characterId}/portrait.svg`;
        }
        
        // Update state
        if (this.app.state.user.profile) {
          this.app.state.user.profile.selected_character = characterId;
        }
        
        // Close modal
        document.getElementById('avatar-selection-modal')?.classList.remove('active');
        
        this.showToast('Avatar updated!', 'success');
        this.app.audio.playSFX('success');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      this.showToast('Failed to update avatar', 'error');
    }
  }

  async loadPractice() {
    try {
      const response = await fetch('/api/minigames');
      const data = await response.json();

      const grid = document.querySelector('.minigame-grid');
      if (!grid || !data.minigames) return;

      grid.innerHTML = data.minigames.map(mg => `
        <div class="minigame-card" data-minigame-id="${mg.id}">
          <div class="minigame-preview">${mg.icon || '🎮'}</div>
          <div class="minigame-info">
            <h3>${this.escapeHtml(mg.name)}</h3>
            <p>${this.escapeHtml(mg.description)}</p>
            <span class="minigame-type ${mg.is3D ? 'is-3d' : 'is-2d'}">${mg.type.toUpperCase()} ${mg.is3D ? '(3D)' : '(2D)'}</span>
          </div>
          <div class="minigame-actions">
            <button class="btn btn-primary btn-sm practice-btn" data-id="${mg.id}">▶ Practice</button>
            <button class="btn btn-secondary btn-sm tutorial-btn" data-id="${mg.id}">📖 Tutorial</button>
          </div>
        </div>
      `).join('');

      // Add click handlers for practice
      grid.querySelectorAll('.practice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.app.minigame.startPractice(btn.dataset.id);
        });
      });

      // Add click handlers for tutorial
      grid.querySelectorAll('.tutorial-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.app.minigame.startTutorial(btn.dataset.id);
        });
      });
    } catch (error) {
      console.error('Failed to load practice:', error);
    }
  }

  showResults(data) {
    // Populate podium
    const places = ['first', 'second', 'third'];
    const standings = data.standings || data.rankings || [];
    
    standings.slice(0, 3).forEach((player, index) => {
      const place = document.querySelector(`.podium-place.${places[index]}`);
      if (place) {
        const avatar = place.querySelector('.podium-avatar');
        const name = place.querySelector('.podium-name');
        const stats = place.querySelector('.podium-stats');
        
        if (avatar) avatar.textContent = this.getCharacterIcon(player.character) || '👤';
        if (name) name.textContent = player.username || 'Player';
        if (stats) stats.textContent = `⭐ ${player.stars || 0} | 🪙 ${player.coins || 0}`;
      }
    });

    // Populate standings
    const standingsEl = document.getElementById('final-standings');
    if (standingsEl && standings.length > 0) {
      standingsEl.innerHTML = standings.map((player, index) => `
        <div class="standing-row">
          <span class="standing-position">${index + 1}</span>
          <span class="standing-avatar">${this.getCharacterIcon(player.character) || '👤'}</span>
          <span class="standing-name">${this.escapeHtml(player.username || 'Player')}</span>
          <span class="standing-stats">⭐ ${player.stars || 0} | 🪙 ${player.coins || 0}</span>
        </div>
      `).join('');
    }

    // Populate bonus stars
    const bonusStarsEl = document.getElementById('bonus-stars-list');
    if (bonusStarsEl && data.bonusStars && data.bonusStars.length > 0) {
      const bonusSection = document.getElementById('bonus-stars');
      if (bonusSection) bonusSection.style.display = 'block';
      
      bonusStarsEl.innerHTML = data.bonusStars.map(bonus => {
        const winner = standings.find(p => p.id === bonus.playerId);
        return `
          <div class="bonus-star-item">
            <span class="bonus-icon">⭐</span>
            <span class="bonus-name">${this.escapeHtml(bonus.name)}</span>
            <span class="bonus-winner">${this.escapeHtml(winner?.username || 'Player')}</span>
          </div>
        `;
      }).join('');
    } else {
      const bonusSection = document.getElementById('bonus-stars');
      if (bonusSection) bonusSection.style.display = 'none';
    }

    // Credits earned for current user
    const creditsEl = document.getElementById('credits-earned');
    if (creditsEl) {
      const userId = this.app.state.user?.id;
      const playerReward = data.creditsRewards?.find(r => r.playerId === userId);
      creditsEl.textContent = `+${playerReward?.credits || 0} 💎`;
    }

    // Setup button handlers
    const rematchBtn = document.getElementById('rematch-btn');
    const returnBtn = document.getElementById('return-to-menu');
    
    if (rematchBtn) {
      rematchBtn.removeEventListener('click', rematchBtn._rematchHandler);
      rematchBtn._rematchHandler = () => {
        this.app.lobby.requestRematch();
      };
      rematchBtn.addEventListener('click', rematchBtn._rematchHandler);
    }
    
    if (returnBtn) {
      returnBtn.removeEventListener('click', returnBtn._returnHandler);
      returnBtn._returnHandler = () => {
        this.app.navigateTo('main-menu');
        this.app.audio.playMusic('menu');
      };
      returnBtn.addEventListener('click', returnBtn._returnHandler);
    }
  }

  getCharacterIcon(character) {
    const icons = {
      'jojo': '🎭',
      'mimi': '🦋',
      'sparks': '⚡',
      'coral': '🐚',
      'frost': '❄️',
      'blaze': '🔥',
      'luna': '🌙',
      'rocky': '🪨',
      'bongo': '🥁',
      'pip': '🐦',
      'nova': '✨',
      'zippy': '💨'
    };
    return icons[character] || '👤';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
