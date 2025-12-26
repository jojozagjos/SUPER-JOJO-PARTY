/**
 * Super JoJo Party - Lobby Controller
 * Manages lobby state and interactions
 */

export class LobbyController {
  constructor(app) {
    this.app = app;
    
    this.currentLobby = null;
    this.isHost = false;
    this.isReady = false;
    this.selectedCharacter = null;
    this.votingData = null;
    this.selectedVote = null;
    this.votingTimer = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Character selection
    document.querySelectorAll('.character-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectCharacter(e.currentTarget.dataset.characterId);
      });
    });

    // Lobby settings (host only) - new Jamboree-style settings
    document.getElementById('setting-turns')?.addEventListener('change', (e) => {
      if (this.isHost) {
        this.updateSettings({ turns: parseInt(e.target.value) });
        this.updateEstimatedTime();
      }
    });

    document.getElementById('setting-coins')?.addEventListener('change', (e) => {
      if (this.isHost) this.updateSettings({ startingCoins: parseInt(e.target.value) });
    });

    document.getElementById('setting-cpu-difficulty')?.addEventListener('change', (e) => {
      if (this.isHost) this.updateSettings({ cpuDifficulty: e.target.value });
    });

    // Apply difficulty to all bots button
    document.getElementById('apply-difficulty-all')?.addEventListener('click', () => {
      if (this.isHost) this.applyDifficultyToAllBots();
    });

    document.getElementById('setting-bonus-stars')?.addEventListener('change', (e) => {
      if (this.isHost) this.updateSettings({ bonusStars: e.target.checked });
    });

    // Minigame selection modal
    document.getElementById('customize-minigames-btn')?.addEventListener('click', () => {
      if (this.isHost) this.openMinigameSelectionModal();
    });

    document.getElementById('select-all-minigames')?.addEventListener('click', () => {
      this.toggleAllMinigames(true);
    });

    document.getElementById('deselect-all-minigames')?.addEventListener('click', () => {
      this.toggleAllMinigames(false);
    });

    document.getElementById('save-minigame-selection')?.addEventListener('click', () => {
      this.saveMinigameSelection();
    });

    // Close modal
    document.querySelector('#minigame-selection-modal .modal-close')?.addEventListener('click', () => {
      this.closeMinigameSelectionModal();
    });
  }

  // Minigame selection tracking
  allMinigames = [];
  enabledMinigames = [];

  async loadMinigameList() {
    // Fetch minigames from the server
    try {
      const response = await fetch('/api/minigames');
      if (response.ok) {
        const data = await response.json();
        // Handle both array response and {minigames: [...]} response
        this.allMinigames = Array.isArray(data) ? data : (data.minigames || []);
        // Initialize all as enabled unless settings say otherwise
        const disabledIds = this.currentLobby?.settings?.disabledMinigames || [];
        this.enabledMinigames = this.allMinigames.map(m => m.id).filter(id => !disabledIds.includes(id));
      }
    } catch (error) {
      console.error('Failed to load minigames:', error);
      // Fallback to default list
      this.allMinigames = [];
    }
  }

  openMinigameSelectionModal() {
    const modal = document.getElementById('minigame-selection-modal');
    const list = document.getElementById('minigame-selection-list');
    
    if (!modal || !list) return;
    
    // Re-sync enabled minigames from current settings
    const disabledIds = this.currentLobby?.settings?.disabledMinigames || [];
    this.enabledMinigames = this.allMinigames.map(m => m.id).filter(id => !disabledIds.includes(id));
    
    // Populate the list
    list.innerHTML = this.allMinigames.map(minigame => {
      const isEnabled = this.enabledMinigames.includes(minigame.id);
      const typeLabel = minigame.type === 'ffa' ? 'FFA' : minigame.type === 'team' ? 'Team' : minigame.type === 'duel' ? '1v1' : minigame.type === 'battle' ? 'Battle' : '';
      const icon = this.getMinigameIcon(minigame.type);
      return `
        <div class="minigame-selection-item ${isEnabled ? 'selected' : ''}" data-minigame-id="${minigame.id}">
          <input type="checkbox" ${isEnabled ? 'checked' : ''}>
          <span class="minigame-icon">${icon}</span>
          <span class="minigame-name">${minigame.name}</span>
          <span class="minigame-type">${typeLabel}</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    list.querySelectorAll('.minigame-selection-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') return; // Let checkbox handle itself
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        item.classList.toggle('selected', checkbox.checked);
        this.updateMinigameCount();
      });

      item.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        item.classList.toggle('selected', e.target.checked);
        this.updateMinigameCount();
      });
    });

    this.updateMinigameCount();
    modal.classList.add('active');
  }

  closeMinigameSelectionModal() {
    const modal = document.getElementById('minigame-selection-modal');
    if (modal) modal.classList.remove('active');
  }

  getMinigameIcon(type) {
    switch(type) {
      case 'ffa': return '🎮';
      case 'team': return '👥';
      case 'duel': return '⚔️';
      case 'battle': return '💥';
      default: return '🎲';
    }
  }

  toggleAllMinigames(enable) {
    const list = document.getElementById('minigame-selection-list');
    if (!list) return;

    list.querySelectorAll('.minigame-selection-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.checked = enable;
      item.classList.toggle('selected', enable);
    });
    this.updateMinigameCount();
  }

  updateMinigameCount() {
    const list = document.getElementById('minigame-selection-list');
    const countEl = document.getElementById('minigame-selection-count');
    if (!list || !countEl) return;

    const selected = list.querySelectorAll('.minigame-selection-item input:checked').length;
    const total = this.allMinigames.length;
    countEl.textContent = `${selected}/${total} selected`;
  }

  saveMinigameSelection() {
    const list = document.getElementById('minigame-selection-list');
    if (!list) return;

    const disabled = [];
    list.querySelectorAll('.minigame-selection-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox.checked) {
        disabled.push(item.dataset.minigameId);
      }
    });

    // Update settings with disabled minigames
    this.updateSettings({ disabledMinigames: disabled });
    this.closeMinigameSelectionModal();
    
    // Update the count display in the lobby settings
    this.updateMinigamesCountDisplay();
  }

  updateMinigamesCountDisplay() {
    const countView = document.getElementById('view-minigames-count');
    if (!countView) return;

    const disabledIds = this.currentLobby?.settings?.disabledMinigames || [];
    const enabled = this.allMinigames.length - disabledIds.length;
    const total = this.allMinigames.length;

    if (total === 0) {
      countView.textContent = 'Loading...';
    } else if (enabled === total) {
      countView.textContent = `All (${total})`;
    } else if (enabled === 0) {
      countView.textContent = 'None selected!';
    } else {
      countView.textContent = `${enabled}/${total} enabled`;
    }
  }

  showDisabledMinigamesPreview(disabledIds) {
    // Remove existing preview
    const existingPreview = document.querySelector('.disabled-minigames-preview');
    if (existingPreview) existingPreview.remove();
    
    if (!disabledIds || disabledIds.length === 0) return;
    
    const countView = document.getElementById('view-minigames-count');
    if (!countView) return;
    
    const preview = document.createElement('div');
    preview.className = 'disabled-minigames-preview';
    
    const disabledNames = disabledIds.map(id => {
      const mg = this.allMinigames.find(m => m.id === id);
      return mg ? mg.name : id;
    }).slice(0, 5); // Show max 5
    
    disabledNames.forEach(name => {
      const tag = document.createElement('span');
      tag.className = 'disabled-minigame-tag';
      tag.textContent = name;
      preview.appendChild(tag);
    });
    
    if (disabledIds.length > 5) {
      const more = document.createElement('span');
      more.className = 'disabled-minigame-tag';
      more.textContent = `+${disabledIds.length - 5} more`;
      preview.appendChild(more);
    }
    
    countView.parentElement.appendChild(preview);
  }

  updateEstimatedTime() {
    const turns = parseInt(document.getElementById('setting-turns')?.value || 15);
    const minutesPerTurn = 3; // Average time per turn
    const totalMinutes = turns * minutesPerTurn;
    
    const timeValue = document.getElementById('time-value');
    if (timeValue) {
      timeValue.textContent = `~${totalMinutes} minutes`;
    }
  }

  initLobbyScreen(data) {
    // Called when navigating to lobby screen
    if (data.lobby) {
      this.currentLobby = data.lobby;
      this.isHost = data.lobby.hostId === this.app.state.user?.id;
      this.updateLobbyUI();
      this.loadCharacterSelect();
      this.loadMinigameList().then(() => this.updateMinigamesCountDisplay());
    }
  }

  onLobbyJoined(data) {
    this.currentLobby = data.lobby;
    this.isHost = data.isHost;
    this.isReady = false;
    
    this.updateLobbyUI();
    this.loadCharacterSelect();
    this.loadMinigameList().then(() => this.updateMinigamesCountDisplay());
  }

  onLobbyUpdated(data) {
    this.currentLobby = data.lobby;
    this.updateLobbyUI();
  }

  onPlayerJoined(data) {
    // Sync full lobby data from server
    if (data.lobby) {
      this.currentLobby = data.lobby;
    } else if (data.player) {
      // Fallback: just add the new player
      if (!this.currentLobby.players) this.currentLobby.players = [];
      const exists = this.currentLobby.players.find(p => p.id === data.player.id);
      if (!exists) {
        this.currentLobby.players.push(data.player);
      }
    }
    this.updatePlayerSlots();
    this.app.audio.playSFX('playerJoin');
    this.app.ui.addChatMessage({
      username: 'System',
      message: `${data.player?.username || 'A player'} joined the lobby!`
    });
  }

  onBotAdded(data) {
    if (data.lobby) {
      this.currentLobby = data.lobby;
    } else if (data.bot) {
      if (!this.currentLobby.bots) this.currentLobby.bots = [];
      this.currentLobby.bots.push(data.bot);
    }
    this.updatePlayerSlots();
    this.app.ui.addChatMessage({
      username: 'System',
      message: `${data.bot?.username || 'A bot'} joined the lobby!`
    });
  }

  onBotRemoved(data) {
    if (data.lobby) {
      this.currentLobby = data.lobby;
    } else if (data.botId) {
      this.currentLobby.bots = (this.currentLobby.bots || []).filter(b => b.id !== data.botId);
    }
    this.updatePlayerSlots();
    this.app.ui.addChatMessage({
      username: 'System',
      message: 'A bot was removed from the lobby.'
    });
  }

  onPlayerLeft(data) {
    this.currentLobby.players = data.players;
    this.updatePlayerSlots();
    this.app.ui.addChatMessage({
      username: 'System',
      message: `${data.username} left the lobby.`
    });
    
    // Update host status
    if (data.newHost === this.app.state.user.id) {
      this.isHost = true;
      this.app.ui.showToast('You are now the host!', 'info');
    }
    this.updateLobbyUI();
  }

  onReadyUpdated(data) {
    const player = this.currentLobby.players.find(p => p.id === data.playerId);
    if (player) {
      player.ready = data.ready;
    }
    this.updatePlayerSlots();
    this.checkAllReady();
  }

  onSettingsUpdated(data) {
    this.currentLobby.settings = data.settings;
    this.updateSettingsUI();
  }

  onCharacterUpdated(data) {
    const player = this.currentLobby.players.find(p => p.id === data.playerId);
    if (player) {
      player.character = data.character;
    }
    this.updatePlayerSlots();
    this.loadCharacterSelect(); // Update available characters
  }

  onChatMessage(data) {
    this.app.ui.addChatMessage(data);
  }

  updateLobbyUI() {
    // Update lobby code
    const codeDisplay = document.getElementById('lobby-code');
    if (codeDisplay && this.currentLobby?.joinCode) {
      codeDisplay.textContent = this.currentLobby.joinCode;
    }

    // Update lobby title
    const titleEl = document.getElementById('lobby-title');
    if (titleEl && this.currentLobby?.name) {
      titleEl.textContent = this.currentLobby.name;
    }

    // Update player slots
    this.updatePlayerSlots();

    // Update settings UI
    this.updateSettingsUI();

    // Update host-only elements
    const hostElements = document.querySelectorAll('.host-only');
    hostElements.forEach(el => {
      el.style.display = this.isHost ? 'block' : 'none';
    });

    // Update start button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.style.display = this.isHost ? 'block' : 'none';
    }

    // Update add bot button
    const addBotBtn = document.getElementById('add-bot-btn');
    if (addBotBtn) {
      addBotBtn.style.display = this.isHost ? 'block' : 'none';
    }
  }

  updatePlayerSlots() {
    const slotsContainer = document.getElementById('player-slots');
    if (!slotsContainer) return;

    const players = this.currentLobby.players || [];
    const bots = this.currentLobby.bots || [];
    const allParticipants = [...players, ...bots];
    const maxPlayers = this.currentLobby.settings?.maxPlayers || 20;

    let html = '';

    // Only render actual players and bots, no empty slots
    allParticipants.forEach((player, index) => {
      const isCurrentUser = player.id === this.app.state.user?.id;
      const isHostPlayer = player.id === this.currentLobby.hostId;
      const difficultyDisplay = player.isBot ? (player.difficulty || 'normal') : null;
      
      html += `
        <div class="player-slot filled ${player.isReady || player.ready ? 'ready' : ''} ${isHostPlayer ? 'host' : ''} ${player.isBot ? 'bot' : ''}" data-player-id="${player.id}">
          <div class="slot-avatar">${this.getCharacterIcon(player.character)}</div>
          <div class="slot-info">
            <div class="slot-name">${this.escapeHtml(player.username)} ${isHostPlayer ? '👑' : ''}</div>
            <div class="slot-status ${player.isReady || player.ready ? 'ready' : ''}">
              ${player.isBot ? `<span class="bot-difficulty">${difficultyDisplay}</span>` : ''}
              ${player.isReady || player.ready ? '✓ Ready' : 'Not Ready'}
            </div>
          </div>
          ${this.isHost && player.isBot ? `
            <div class="bot-controls">
              <button class="edit-bot-btn" data-player-id="${player.id}" title="Edit bot">✏️</button>
              <button class="remove-bot-btn" data-player-id="${player.id}" title="Remove bot">✕</button>
            </div>
          ` : ''}
        </div>
      `;
    });

    // Show player count
    html += `
      <div class="player-count">
        ${allParticipants.length}/${maxPlayers} Players
        ${this.isHost && allParticipants.length < maxPlayers ? '<span class="add-hint">(Add bots or invite friends)</span>' : ''}
      </div>
    `;

    slotsContainer.innerHTML = html;

    // Add event listeners for remove bot buttons
    slotsContainer.querySelectorAll('.remove-bot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeBot(btn.dataset.playerId);
      });
    });

    // Add event listeners for edit bot buttons
    slotsContainer.querySelectorAll('.edit-bot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showEditBotModal(btn.dataset.playerId);
      });
    });

    // Update start button state
    this.checkAllReady();
  }

  showEditBotModal(botId) {
    const bot = this.currentLobby.bots?.find(b => b.id === botId);
    if (!bot) return;

    // Create modal HTML
    const existingModal = document.getElementById('edit-bot-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-bot-modal';
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">×</button>
        <h2>🤖 Edit Bot</h2>
        <div class="form-group">
          <label for="bot-name-input">Bot Name</label>
          <input type="text" id="bot-name-input" value="${bot.username.replace(' (Bot)', '')}" maxlength="15" placeholder="Enter bot name">
          <span class="form-hint">"(Bot)" will be added automatically</span>
        </div>
        <div class="form-group">
          <label for="bot-difficulty-select">Difficulty</label>
          <select id="bot-difficulty-select">
            <option value="easy" ${bot.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="normal" ${bot.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="hard" ${bot.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
            <option value="master" ${bot.difficulty === 'master' ? 'selected' : ''}>Master</option>
          </select>
        </div>
        <button class="btn btn-primary" id="save-bot-btn">Save Changes</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#save-bot-btn').addEventListener('click', () => {
      const name = modal.querySelector('#bot-name-input').value.trim();
      const difficulty = modal.querySelector('#bot-difficulty-select').value;
      this.updateBot(botId, name, difficulty);
      modal.remove();
    });
  }

  updateBot(botId, name, difficulty) {
    this.app.socket.socket.emit('lobby:updateBot', { botId, name, difficulty }, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to update bot', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  applyDifficultyToAllBots() {
    const difficultySelect = document.getElementById('setting-cpu-difficulty');
    const difficulty = difficultySelect?.value || 'normal';
    
    if (!this.currentLobby?.bots || this.currentLobby.bots.length === 0) {
      this.app.ui.showToast('No bots in lobby', 'warning');
      return;
    }

    // Update all bots to the selected difficulty
    let updatedCount = 0;
    this.currentLobby.bots.forEach(bot => {
      this.app.socket.socket.emit('lobby:updateBot', { 
        botId: bot.id, 
        name: bot.username.replace(' (Bot)', ''), 
        difficulty: difficulty 
      }, (response) => {
        if (response.success) {
          updatedCount++;
        }
      });
    });

    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    this.app.ui.showToast(`Set all bots to ${difficultyLabel} difficulty`, 'success');
    this.app.audio.playSFX('click');
  }

  onBotUpdated(data) {
    if (data.lobby) {
      this.currentLobby = data.lobby;
    } else if (data.bot) {
      const botIndex = this.currentLobby.bots?.findIndex(b => b.id === data.bot.id);
      if (botIndex !== -1) {
        this.currentLobby.bots[botIndex] = data.bot;
      }
    }
    this.updatePlayerSlots();
  }

  getCharacterIcon(character) {
    const charId = typeof character === 'object' ? character.id : character;
    // Return image tag for character portrait
    return `<img src="/assets/characters/${charId || 'jojo'}/portrait.svg" alt="${charId || 'Player'}" class="slot-avatar-img">`;
  }

  getCharacterEmoji(character) {
    const icons = {
      'jojo': '🎭',
      'mimi': '🦋'
    };
    const charId = typeof character === 'object' ? character.id : character;
    return icons[charId] || '👤';
  }

  updateSettingsUI() {
    const settings = this.currentLobby.settings || {};

    // Host-only controls visibility
    document.querySelectorAll('.host-control').forEach(el => {
      el.style.display = this.isHost ? '' : 'none';
    });
    document.querySelectorAll('.setting-view').forEach(el => {
      el.style.display = this.isHost ? 'none' : '';
    });

    // Turns select
    const turnsSelect = document.getElementById('setting-turns');
    const turnsView = document.getElementById('setting-turns-view');
    if (turnsSelect) {
      turnsSelect.value = settings.turns || 15;
    }
    if (turnsView) {
      turnsView.textContent = settings.turns || 15;
    }

    // Starting coins
    const coinsSelect = document.getElementById('setting-coins');
    const coinsView = document.getElementById('setting-coins-view');
    if (coinsSelect) {
      coinsSelect.value = settings.startingCoins || 10;
    }
    if (coinsView) {
      coinsView.textContent = settings.startingCoins || 10;
    }

    // CPU difficulty
    const cpuSelect = document.getElementById('setting-cpu-difficulty');
    const cpuView = document.getElementById('setting-cpu-difficulty-view');
    if (cpuSelect) {
      cpuSelect.value = settings.cpuDifficulty || 'normal';
    }
    if (cpuView) {
      const difficultyNames = { easy: 'Easy', normal: 'Normal', hard: 'Hard', master: 'Master' };
      cpuView.textContent = difficultyNames[settings.cpuDifficulty] || 'Normal';
    }

    // Minigames - update enabled count display
    this.updateMinigamesCountDisplay();
    
    // Show disabled minigames for non-hosts
    if (!this.isHost && settings.disabledMinigames?.length > 0) {
      this.showDisabledMinigamesPreview(settings.disabledMinigames);
    }

    // Bonus stars toggle
    const bonusToggle = document.getElementById('setting-bonus-stars');
    const bonusView = document.getElementById('setting-bonus-stars-view');
    if (bonusToggle) {
      bonusToggle.checked = settings.bonusStars !== false;
    }
    if (bonusView) {
      bonusView.textContent = settings.bonusStars !== false ? 'On' : 'Off';
    }

    // Update estimated time
    this.updateEstimatedTime();
  }

  loadCharacterSelect() {
    const grid = document.querySelector('.character-grid');
    if (!grid) return;

    // Only 2 characters: JoJo (free) and Mimi (100 credits)
    const characters = [
      { id: 'jojo', name: 'JoJo', icon: '🎭', default: true },
      { id: 'mimi', name: 'Mimi', icon: '🦋', purchasable: true, price: 100 }
    ];

    // Get taken characters
    const takenCharacters = new Set();
    this.currentLobby.players?.forEach(player => {
      if (player.character && player.id !== this.app.state.user.id) {
        takenCharacters.add(player.character.id || player.character);
      }
    });

    // Get user's owned characters from inventory
    const ownedCharacters = new Set(['jojo']); // JoJo is always owned
    this.app.state.user?.inventory?.forEach(item => {
      if (item.item_type === 'character') {
        ownedCharacters.add(item.item_id);
      }
    });

    grid.innerHTML = characters.map(char => {
      const isLocked = !char.default && !ownedCharacters.has(char.id);
      const isTaken = takenCharacters.has(char.id);
      const isSelected = this.selectedCharacter === char.id;

      return `
        <div class="character-option ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isTaken ? 'taken' : ''}"
             data-character-id="${char.id}"
             ${isLocked || isTaken ? 'disabled' : ''}>
          <div class="char-icon">
            <img src="/assets/characters/${char.id}/portrait.svg" alt="${char.name}">
          </div>
          <div class="char-name">${char.name}</div>
          ${isLocked ? `<div class="char-lock">🔒 ${char.price}💎</div>` : ''}
          ${isTaken ? '<div class="char-taken">Taken</div>' : ''}
        </div>
      `;
    }).join('');

    // Re-attach event listeners
    grid.querySelectorAll('.character-option:not(.locked):not(.taken)').forEach(option => {
      option.addEventListener('click', () => {
        this.selectCharacter(option.dataset.characterId);
      });
    });
  }

  selectCharacter(characterId) {
    this.selectedCharacter = characterId;
    
    // Update UI
    document.querySelectorAll('.character-option').forEach(option => {
      option.classList.toggle('selected', option.dataset.characterId === characterId);
    });

    // Send to server with callback
    this.app.socket.socket.emit('lobby:setCharacter', characterId, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to select character', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  toggleReady() {
    this.isReady = !this.isReady;
    
    // Update button
    const btn = document.getElementById('ready-btn');
    if (btn) {
      btn.textContent = this.isReady ? 'Not Ready' : 'Ready!';
      btn.classList.toggle('btn-success', this.isReady);
      btn.classList.toggle('btn-secondary', !this.isReady);
    }

    // Send to server with callback
    this.app.socket.socket.emit('lobby:setReady', this.isReady, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to update ready status', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  checkAllReady() {
    // Check if all human players are ready (host is always ready)
    const allPlayersReady = this.currentLobby.players?.every(p => p.isReady || p.ready || p.isHost);
    
    // Count total participants (players + bots)
    const totalParticipants = (this.currentLobby.players?.length || 0) + (this.currentLobby.bots?.length || 0);
    
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      const canStart = allPlayersReady && totalParticipants >= 2;
      startBtn.disabled = !canStart;
      
      // Update button text to show why it's disabled
      if (!canStart) {
        if (totalParticipants < 2) {
          startBtn.title = 'Need at least 2 players to start';
        } else if (!allPlayersReady) {
          startBtn.title = 'Waiting for all players to be ready';
        }
      } else {
        startBtn.title = 'Start the game!';
      }
    }
  }

  updateSettings(settings) {
    if (!this.isHost) return;
    this.app.socket.socket.emit('lobby:updateSettings', settings, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to update settings', 'error');
      }
    });
  }

  addBot() {
    if (!this.isHost) return;
    this.app.socket.socket.emit('lobby:addBot', (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to add bot', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  removeBot(playerId) {
    if (!this.isHost) return;
    this.app.socket.socket.emit('lobby:removeBot', playerId, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to remove bot', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  startGame() {
    if (!this.isHost) return;
    
    // Count total participants (players + bots)
    const totalParticipants = (this.currentLobby.players?.length || 0) + (this.currentLobby.bots?.length || 0);
    
    if (totalParticipants < 2) {
      this.app.ui.showToast('Need at least 2 players to start', 'error');
      return;
    }

    // Prevent starting if WebGL is not available on this client
    if (window.hasWebGL === false) {
      this.app.ui.showToast('Cannot start game: 3D graphics are not available on this device', 'error');
      this.app.ui.showToast('Please enable hardware acceleration or try another browser', 'warning');
      return;
    }

    this.app.socket.socket.emit('lobby:startGame', (response) => {
      if (!response.success) {
        this.app.ui.hideLoading();
        this.app.ui.showToast(response.error || 'Failed to start game', 'error');
      }
    });
    this.app.ui.showLoading('Starting game...');
  }

  leaveLobby() {
    this.app.socket.socket.emit('lobby:leave', (response) => {
      // Navigate regardless of response
      this.currentLobby = null;
      this.isHost = false;
      this.isReady = false;
      this.selectedCharacter = null;
      this.app.navigateTo('main-menu');
    });
  }

  // Character Select Screen (after game starts, before voting)
  initCharacterSelectScreen(data) {
    this.selectedCharacter = null;
    this.characterSelectData = data;
    
    // Only 2 characters: JoJo (free) and Mimi (100 credits)
    const characters = [
      { id: 'jojo', name: 'JoJo', icon: '🎭', description: 'The party star!', default: true },
      { id: 'mimi', name: 'Mimi', icon: '🦋', description: 'Clever strategist!', purchasable: true, price: 100 }
    ];

    // Get user's owned characters
    const ownedCharacters = new Set(['jojo']);
    this.app.state.user?.inventory?.forEach(item => {
      if (item.item_type === 'character') {
        ownedCharacters.add(item.item_id);
      }
    });

    // Get already selected characters by other players
    const takenCharacters = new Set();
    if (data.selections) {
      Object.entries(data.selections).forEach(([playerId, charId]) => {
        if (playerId !== this.app.state.user?.id && charId) {
          takenCharacters.add(charId);
        }
      });
    }

    const grid = document.getElementById('character-select-grid');
    if (grid) {
      grid.innerHTML = characters.map(char => {
        const isOwned = char.default || ownedCharacters.has(char.id);
        const isTaken = takenCharacters.has(char.id);
        const isLocked = !isOwned;
        
        return `
          <div class="char-select-card ${isLocked ? 'locked' : ''} ${isTaken ? 'taken' : ''}"
               data-char-id="${char.id}"
               ${isLocked || isTaken ? '' : ''}>
            <div class="char-icon">${char.icon}</div>
            <div class="char-name">${char.name}</div>
            ${isLocked ? `<div class="char-status">🔒 ${char.price || 0}💎</div>` : ''}
            ${isTaken ? '<div class="char-status">Taken</div>' : ''}
          </div>
        `;
      }).join('');

      // Add click handlers
      grid.querySelectorAll('.char-select-card:not(.locked):not(.taken)').forEach(card => {
        card.addEventListener('click', () => {
          this.selectCharacterForGame(card.dataset.charId);
        });
      });
    }

    // Update other players section
    this.updateOtherPlayersSelection(data);

    // Setup confirm button
    const confirmBtn = document.getElementById('confirm-character-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmCharacterSelection();
      confirmBtn.disabled = true;
    }

    // Start timer if provided
    if (data.duration) {
      this.startCharacterSelectTimer(data.duration);
    }
  }

  selectCharacterForGame(charId) {
    this.selectedCharacter = charId;
    
    const characters = {
      'jojo': { name: 'JoJo', icon: '🎭' },
      'mimi': { name: 'Mimi', icon: '🦋' }
    };
    
    // Update UI
    document.querySelectorAll('.char-select-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.charId === charId);
    });

    // Update preview
    const preview = document.getElementById('selected-preview');
    if (preview) {
      const char = characters[charId];
      preview.innerHTML = `
        <div class="preview-icon">${char?.icon || '❓'}</div>
        <div class="preview-name">${char?.name || 'Unknown'}</div>
      `;
    }

    // Enable confirm button
    const confirmBtn = document.getElementById('confirm-character-btn');
    if (confirmBtn) confirmBtn.disabled = false;

    // Notify server of selection (not confirmed yet)
    this.app.socket.socket.emit('characterSelect:hover', charId);
    this.app.audio.playSFX('click');
  }

  confirmCharacterSelection() {
    if (!this.selectedCharacter) return;

    const confirmBtn = document.getElementById('confirm-character-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirmed!';
    }

    // Send confirmation to server
    this.app.socket.socket.emit('characterSelect:confirm', this.selectedCharacter, (response) => {
      if (response.success) {
        this.app.ui.showToast('Character confirmed!', 'success');
      } else {
        this.app.ui.showToast(response.error || 'Failed to confirm', 'error');
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm';
        }
      }
    });
  }

  startCharacterSelectTimer(duration) {
    let remaining = duration;
    const timerEl = document.getElementById('select-timer');

    if (this.characterSelectTimer) {
      clearInterval(this.characterSelectTimer);
    }

    const update = () => {
      if (timerEl) {
        timerEl.textContent = remaining;
      }
      
      if (remaining <= 0) {
        clearInterval(this.characterSelectTimer);
        // Auto-confirm if not selected
        if (!this.selectedCharacter) {
          this.selectCharacterForGame('jojo');
        }
        this.confirmCharacterSelection();
        return;
      }
      
      remaining--;
    };

    update();
    this.characterSelectTimer = setInterval(update, 1000);
  }

  updateOtherPlayersSelection(data) {
    const container = document.getElementById('other-selections');
    if (!container || !data.players) return;

    const characters = {
      'jojo': '🎭',
      'mimi': '🦋'
    };

    container.innerHTML = data.players
      .filter(p => p.id !== this.app.state.user?.id && !p.isBot)
      .map(player => {
        const selection = data.selections?.[player.id];
        const confirmed = data.confirmed?.[player.id];
        
        return `
          <div class="other-selection ${confirmed ? 'confirmed' : selection ? 'selecting' : ''}">
            <div class="other-name">${this.escapeHtml(player.username)}</div>
            <div class="other-char">${selection ? characters[selection] || '❓' : '❓'}</div>
          </div>
        `;
      }).join('');
  }

  onCharacterSelectUpdate(data) {
    this.updateOtherPlayersSelection(data);
    
    // Update taken characters
    if (data.selections) {
      Object.entries(data.selections).forEach(([playerId, charId]) => {
        if (playerId !== this.app.state.user?.id && charId) {
          document.querySelectorAll(`.char-select-card[data-char-id="${charId}"]`).forEach(card => {
            if (!card.classList.contains('selected')) {
              card.classList.add('taken');
              const status = card.querySelector('.char-status');
              if (!status) {
                card.innerHTML += '<div class="char-status">Taken</div>';
              }
            }
          });
        }
      });
    }
  }

  // Voting methods
  initVotingScreen(data) {
    this.votingData = data;
    this.selectedVote = null;

    const title = document.getElementById('voting-title');
    const subtitle = document.getElementById('voting-subtitle');
    const options = document.getElementById('voting-options');
    const timer = document.getElementById('voting-timer');

    if (title) title.textContent = data.title || 'Vote!';
    if (subtitle) subtitle.textContent = data.subtitle || 'Select an option';

    if (options && data.options) {
      options.innerHTML = data.options.map(option => `
        <div class="vote-option" data-vote-id="${option.id}">
          <div class="option-preview">${option.icon || '❓'}</div>
          <div class="option-name">${this.escapeHtml(option.name)}</div>
          <div class="option-desc">${this.escapeHtml(option.description || '')}</div>
          <div class="vote-count" id="vote-count-${option.id}">0 votes</div>
        </div>
      `).join('');

      // Add click handlers
      options.querySelectorAll('.vote-option').forEach(option => {
        option.addEventListener('click', () => {
          this.castVote(option.dataset.voteId);
        });
      });
    }

    // Start timer
    if (data.duration) {
      this.startVotingTimer(data.duration);
    }
  }

  startVotingTimer(duration) {
    let remaining = duration;
    const timerEl = document.getElementById('vote-timer');

    const update = () => {
      if (timerEl) {
        timerEl.textContent = remaining;
      }
      
      if (remaining <= 0) {
        clearInterval(this.votingTimer);
        return;
      }
      
      remaining--;
    };

    update();
    this.votingTimer = setInterval(update, 1000);
  }

  castVote(optionId) {
    this.selectedVote = optionId;
    
    // Update UI
    document.querySelectorAll('.vote-option').forEach(option => {
      option.classList.toggle('selected', option.dataset.voteId === optionId);
    });

    // Send to server (vote:board is the expected event on server)
    this.app.socket.socket.emit('vote:board', optionId, (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to cast vote', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  onVotingUpdate(data) {
    // Update vote counts
    if (data.votes) {
      Object.entries(data.votes).forEach(([optionId, count]) => {
        const countEl = document.getElementById(`vote-count-${optionId}`);
        if (countEl) {
          countEl.textContent = `${count} vote${count !== 1 ? 's' : ''}`;
        }
      });
    }
  }

  onVotingResult(data) {
    if (this.votingTimer) {
      clearInterval(this.votingTimer);
    }

    // Highlight winner
    document.querySelectorAll('.vote-option').forEach(option => {
      option.classList.toggle('winner', option.dataset.voteId === data.winner);
    });

    // Show result
    const status = document.getElementById('vote-status');
    if (status) {
      status.textContent = `Selected: ${data.winnerName}`;
    }

    this.app.ui.showToast(`${data.winnerName} selected!`, 'success');

    // Show start game button for host
    const startBtn = document.getElementById('start-actual-game-btn');
    if (startBtn && this.isHost) {
      startBtn.classList.remove('hidden');
      startBtn.addEventListener('click', () => {
        this.startActualGame();
      });
    }
  }

  startActualGame() {
    this.app.socket.socket.emit('vote:readyToStart', (response) => {
      if (!response.success) {
        this.app.ui.showToast(response.error || 'Failed to start game', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  showTutorialVote(selectedBoard) {
    // Create tutorial vote overlay
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-vote-overlay';
    overlay.className = 'tutorial-vote-overlay';
    
    const boardName = selectedBoard.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    overlay.innerHTML = `
      <div class="tutorial-vote-container">
        <div class="tutorial-vote-header">
          <h2>🎓 Play Tutorial?</h2>
          <p>Learn the basics of ${boardName} before starting</p>
        </div>
        
        <div class="tutorial-preview">
          <div class="map-cinematic">
            <div class="cinematic-placeholder">
              <span class="cinematic-icon">🗺️</span>
              <span class="cinematic-text">Map Preview</span>
            </div>
          </div>
          <div class="tutorial-info">
            <h3>What you'll learn:</h3>
            <ul>
              <li>🎲 How to move around the board</li>
              <li>⭐ How to collect stars</li>
              <li>💰 Earning and spending coins</li>
              <li>🎮 How minigames work</li>
              <li>🎁 Using items effectively</li>
            </ul>
          </div>
        </div>
        
        <div class="tutorial-vote-buttons">
          <button class="btn btn-secondary btn-large" id="tutorial-vote-skip">
            <span class="btn-icon">⏭️</span>
            <span>Skip Tutorial</span>
          </button>
          <button class="btn btn-primary btn-large" id="tutorial-vote-play">
            <span class="btn-icon">▶️</span>
            <span>Play Tutorial</span>
          </button>
        </div>
        
        <div class="vote-count">
          <span id="tutorial-yes-count">0</span> want tutorial • 
          <span id="tutorial-no-count">0</span> want to skip
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('tutorial-vote-skip').addEventListener('click', () => {
      this.submitTutorialVote(false);
    });
    
    document.getElementById('tutorial-vote-play').addEventListener('click', () => {
      this.submitTutorialVote(true);
    });
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
    
    this.tutorialVoteOverlay = overlay;
  }

  submitTutorialVote(wantsTutorial) {
    this.app.socket.socket.emit('vote:tutorial', wantsTutorial, (response) => {
      if (response.success) {
        // Disable buttons after voting
        const skipBtn = document.getElementById('tutorial-vote-skip');
        const playBtn = document.getElementById('tutorial-vote-play');
        
        if (skipBtn) skipBtn.disabled = true;
        if (playBtn) playBtn.disabled = true;
        
        // Highlight selected
        if (wantsTutorial && playBtn) {
          playBtn.classList.add('selected');
        } else if (skipBtn) {
          skipBtn.classList.add('selected');
        }
        
        this.app.ui.showToast('Vote submitted!', 'success');
      } else {
        this.app.ui.showToast(response.error || 'Failed to vote', 'error');
      }
    });
    this.app.audio.playSFX('click');
  }

  onTutorialDecided(data) {
    // Remove the vote overlay
    if (this.tutorialVoteOverlay) {
      this.tutorialVoteOverlay.classList.remove('active');
      setTimeout(() => {
        this.tutorialVoteOverlay.remove();
        this.tutorialVoteOverlay = null;
      }, 500);
    }
    
    if (data.showTutorial) {
      this.app.ui.showToast('Tutorial will be shown! 🎓', 'info');
      // The game will handle showing the tutorial
    } else {
      this.app.ui.showToast('Skipping tutorial - Let\'s play! 🎮', 'info');
    }
    
    // If host, show the start game button
    if (this.isHost) {
      setTimeout(() => {
        const startBtn = document.getElementById('start-actual-game-btn');
        if (startBtn) {
          startBtn.classList.remove('hidden');
          startBtn.textContent = data.showTutorial ? 'Start with Tutorial' : 'Start Game';
        }
      }, 1000);
    }
  }

  requestRematch() {
    this.app.socket.emit('lobby:rematch');
    this.app.ui.showLoading('Requesting rematch...');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
