/**
 * Super JoJo Party - Socket Manager
 * Handles all real-time communication with the server
 */

export class SocketManager {
  constructor(app) {
    this.app = app;
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.eventHandlers = new Map();
    this.pendingEmits = [];
  }

  connect() {
    if (this.socket && this.connected) return;

    const token = this.app.auth.getToken();
    
    this.socket = io(this.app.config.serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.1
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.pendingEmits = [];
    }
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.app.ui.showToast('Connected to server', 'success');
      
      // Flush pending emits
      this.flushPendingEmits();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.connected = false;
      
      // Show reconnection message if not intentional
      if (reason !== 'io client disconnect' && reason !== 'forced close') {
        this.app.ui.showToast('Connection lost. Reconnecting...', 'warning');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      // Show error only after several attempts
      if (this.reconnectAttempts >= 5 && this.reconnectAttempts % 3 === 0) {
        this.app.ui.showToast(
          `Connection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
          'warning'
        );
      }
      
      // Final failure
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.app.ui.showToast(
          'Unable to connect to server. Please refresh the page.',
          'error'
        );
      }
    });

    this.socket.on('reconnect_attempt', () => {
      console.log(`Reconnection attempt ${this.reconnectAttempts + 1}...`);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error === 'Server error' || error === 'Unauthorized') {
        this.app.ui.showToast('Session expired. Please log in again.', 'error');
        this.app.navigateTo('login');
      }
    });

    // Lobby events
    this.socket.on('lobby:created', (data) => {
      console.log('Lobby created:', data);
      this.app.ui.hideLoading();
      this.app.lobby.onLobbyJoined(data);
      this.app.navigateTo('lobby', data);
    });

    this.socket.on('lobby:joined', (data) => {
      console.log('Joined lobby:', data);
      this.app.ui.hideLoading();
      this.app.lobby.onLobbyJoined(data);
      this.app.navigateTo('lobby', data);
    });

    this.socket.on('lobby:updated', (data) => {
      console.log('Lobby updated:', data);
      this.app.lobby.onLobbyUpdated(data);
    });

    // Player join/leave - handle both naming conventions
    this.socket.on('lobby:playerJoined', (data) => {
      console.log('Player joined:', data);
      this.app.lobby.onPlayerJoined(data);
    });
    this.socket.on('lobby:player_joined', (data) => {
      console.log('Player joined:', data);
      this.app.lobby.onPlayerJoined(data);
    });

    this.socket.on('lobby:playerLeft', (data) => {
      console.log('Player left:', data);
      this.app.lobby.onPlayerLeft(data);
    });
    this.socket.on('lobby:player_left', (data) => {
      console.log('Player left:', data);
      this.app.lobby.onPlayerLeft(data);
    });

    // Bot events
    this.socket.on('lobby:botAdded', (data) => {
      console.log('Bot added:', data);
      this.app.lobby.onBotAdded(data);
    });

    this.socket.on('lobby:botRemoved', (data) => {
      console.log('Bot removed:', data);
      this.app.lobby.onBotRemoved(data);
    });

    this.socket.on('lobby:botUpdated', (data) => {
      console.log('Bot updated:', data);
      this.app.lobby.onBotUpdated(data);
    });

    // Ready status
    this.socket.on('lobby:readyUpdated', (data) => {
      this.app.lobby.onReadyUpdated(data);
    });
    this.socket.on('lobby:ready_updated', (data) => {
      this.app.lobby.onReadyUpdated(data);
    });

    // Settings
    this.socket.on('lobby:settingsUpdated', (data) => {
      this.app.lobby.onSettingsUpdated(data);
    });
    this.socket.on('lobby:settings_updated', (data) => {
      this.app.lobby.onSettingsUpdated(data);
    });

    // Character updates
    this.socket.on('lobby:characterUpdated', (data) => {
      this.app.lobby.onCharacterUpdated(data);
    });
    this.socket.on('lobby:character_updated', (data) => {
      this.app.lobby.onCharacterUpdated(data);
    });

    this.socket.on('lobby:chat', (data) => {
      this.app.lobby.onChatMessage(data);
    });

    this.socket.on('chat:message', (data) => {
      this.app.lobby.onChatMessage(data);
    });

    this.socket.on('lobby:error', (data) => {
      console.error('Lobby error:', data);
      this.app.ui.hideLoading();
      this.app.ui.showToast(data.message || 'Lobby error', 'error');
    });

    // Voting started event
    this.socket.on('lobby:votingStarted', (data) => {
      console.log('Voting started:', data);
      this.app.ui.hideLoading();
      // Pass the full data object which contains options, duration, title, etc.
      this.app.navigateTo('voting', data);
    });

    // Character Selection events (after game start, before voting)
    this.socket.on('characterSelect:started', (data) => {
      console.log('Character selection started:', data);
      this.app.navigateTo('character-select', data);
    });

    this.socket.on('characterSelect:update', (data) => {
      this.app.lobby.onCharacterSelectUpdate(data);
    });

    this.socket.on('characterSelect:complete', (data) => {
      console.log('Character selection complete:', data);
      // Move to voting or game
      if (data.nextPhase === 'voting') {
        this.app.navigateTo('voting', data);
      } else {
        this.app.navigateTo('game', data);
      }
    });

    // Voting events
    this.socket.on('voting:started', (data) => {
      console.log('Voting started:', data);
      this.app.navigateTo('voting', data);
    });

    this.socket.on('voting:update', (data) => {
      this.app.lobby.onVotingUpdate(data);
    });

    this.socket.on('voting:result', (data) => {
      console.log('Voting result:', data);
      this.app.lobby.onVotingResult(data);
    });

    // Board vote events (from server's LobbyManager)
    this.socket.on('lobby:boardVote', (data) => {
      console.log('Board vote received:', data);
      // Convert votes object to counts by board
      const voteCounts = {};
      for (const boardId of Object.values(data.votes)) {
        voteCounts[boardId] = (voteCounts[boardId] || 0) + 1;
      }
      this.app.lobby.onVotingUpdate({ votes: voteCounts });
    });

    this.socket.on('lobby:boardSelected', (data) => {
      console.log('Board selected:', data);
      this.app.lobby.onVotingResult({ 
        winner: data.board, 
        winnerName: data.board.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      });
      
      // Show tutorial vote screen
      setTimeout(() => {
        this.app.lobby.showTutorialVote(data.board);
      }, 2000);
    });

    // Tutorial vote events
    this.socket.on('lobby:tutorialDecided', (data) => {
      console.log('Tutorial decided:', data);
      this.app.lobby.onTutorialDecided(data);
    });

    // Game events
    this.socket.on('game:started', (data) => {
      console.log('Game started:', data);
      this.app.navigateTo('game', data);
    });

    this.socket.on('game:phaseChanged', (data) => {
      console.log('Phase changed:', data);
      this.app.game.onPhaseChanged(data);
    });

    this.socket.on('game:state', (data) => {
      this.app.game.onGameState(data);
    });

    this.socket.on('game:diceRolled', (data) => {
      this.app.game.onDiceResult(data);
    });

    this.socket.on('game:playerMoved', (data) => {
      this.app.game.onPlayerMoved(data);
    });

    this.socket.on('game:spaceEvent', (data) => {
      this.app.game.onSpaceEvent(data);
    });

    this.socket.on('game:starOffer', (data) => {
      this.app.game.onStarOffer(data);
    });

    this.socket.on('game:starPurchased', (data) => {
      this.app.game.onStarPurchased(data);
    });

    this.socket.on('game:shopOpen', (data) => {
      this.app.game.onShopOpened(data);
    });

    this.socket.on('game:itemPurchased', (data) => {
      this.app.game.onItemPurchased(data);
    });

    this.socket.on('game:itemUsed', (data) => {
      this.app.game.onItemUsed(data);
    });

    this.socket.on('game:overseerEncounter', (data) => {
      this.app.game.onOverseerEncounter(data);
    });

    this.socket.on('game:overseerResult', (data) => {
      this.app.game.onOverseerResult(data);
    });

    this.socket.on('game:minigameSelected', (data) => {
      this.app.game.onMinigameSelected(data);
    });

    this.socket.on('game:minigameStarted', (data) => {
      this.app.minigame.onStarted(data);
    });

    this.socket.on('game:minigameUpdate', (data) => {
      this.app.minigame.onState(data);
    });

    this.socket.on('game:minigameEnded', (data) => {
      this.app.minigame.onEnded(data);
    });

    this.socket.on('game:vs_event', (data) => {
      this.app.game.onVSEvent(data);
    });

    this.socket.on('game:turn_end', (data) => {
      this.app.game.onTurnEnd(data);
    });

    this.socket.on('game:round_end', (data) => {
      this.app.game.onRoundEnd(data);
    });

    // Minigame events
    this.socket.on('minigame:starting', (data) => {
      console.log('Minigame starting:', data);
      this.app.navigateTo('minigame', data);
    });

    this.socket.on('minigame:countdown', (data) => {
      this.app.minigame.onCountdown(data);
    });

    this.socket.on('minigame:started', (data) => {
      this.app.minigame.onStarted(data);
    });

    this.socket.on('minigame:state', (data) => {
      this.app.minigame.onState(data);
    });

    this.socket.on('minigame:player_action', (data) => {
      this.app.minigame.onPlayerAction(data);
    });

    this.socket.on('minigame:ended', (data) => {
      this.app.minigame.onEnded(data);
    });

    // Results events
    this.socket.on('game:ended', (data) => {
      console.log('Game ended:', data);
      this.app.audio.playSFX('gameEnd');
      this.app.navigateTo('results', data);
    });

    // Last 5 Turns event
    this.socket.on('game:last5Turns', (data) => {
      console.log('Last 5 turns event:', data);
      this.app.audio.playSFX('last5Turns');
      this.app.game.onLast5Turns(data);
    });

    // Duel events
    this.socket.on('game:duelInitiated', (data) => {
      console.log('Duel initiated:', data);
      this.app.audio.playSFX('duelStart');
      this.app.game.onDuelInitiated(data);
    });

    this.socket.on('game:duelMinigameStarted', (data) => {
      console.log('Duel minigame started:', data);
      this.app.game.onDuelMinigameStarted(data);
    });

    this.socket.on('game:duelResolved', (data) => {
      console.log('Duel resolved:', data);
      if (data.winnerId === this.app.auth.getUser()?.id) {
        this.app.audio.playSFX('duelWin');
      } else {
        this.app.audio.playSFX('duelLose');
      }
      this.app.game.onDuelResolved(data);
    });

    // Achievement events
    this.socket.on('achievement:unlocked', (data) => {
      console.log('Achievement unlocked:', data);
      this.app.ui.showAchievementNotification(data.achievements);
    });

    // Emote events
    this.socket.on('player:emote', (data) => {
      this.app.game.showEmote(data);
    });

    // Error events
    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
    });
  }

  // Queue emits if not connected, flush when reconnected
  emit(eventName, data, callback) {
    if (this.socket && this.connected) {
      return this.socket.emit(eventName, data, callback);
    } else {
      // Queue the emit for later
      this.pendingEmits.push({ eventName, data, callback });
      console.warn(`Queued emit: ${eventName} (not connected)`);
      return null;
    }
  }

  flushPendingEmits() {
    while (this.pendingEmits.length > 0) {
      const { eventName, data, callback } = this.pendingEmits.shift();
      if (this.socket && this.connected) {
        console.log(`Flushing queued emit: ${eventName}`);
        this.socket.emit(eventName, data, callback);
      }
    }
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
      this.app.ui.showToast(data.message || 'An error occurred', 'error');
    });
  }

  emit(event, data) {
    if (!this.socket || !this.connected) {
      console.warn('Cannot emit - not connected');
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }

  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
    this.eventHandlers.set(event, handler);
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
    this.eventHandlers.delete(event);
  }

  isConnected() {
    return this.connected;
  }
}
