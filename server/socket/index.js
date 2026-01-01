import { verifySocketToken } from '../routes/auth.js';
import { dbHelpers } from '../database/index.js';
import { achievementManager } from '../game/AchievementManager.js';

export function setupSocketHandlers(io, db, lobbyManager, gameManager) {
  // Initialize achievement manager with socket.io
  achievementManager.init(io);

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const user = verifySocketToken(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }

    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🎮 Player connected: ${socket.user.username} (${socket.id})`);

    // Join user's personal room for direct messages
    socket.join(`user:${socket.user.userId}`);

    // Register socket for achievement notifications
    achievementManager.registerUserSocket(socket.user.userId, socket.id);

    // Send any pending achievement notifications
    achievementManager.sendPendingNotifications(socket.user.userId);

    // LOBBY HANDLERS
    
    // Create lobby
    socket.on('lobby:create', (options, callback) => {
      try {
        const profile = dbHelpers.getProfile(socket.user.userId);
        const lobby = lobbyManager.createLobby(
          socket.user.userId,
          socket.user.username,
          { 
            ...options.settings, 
            character: profile?.selected_character || 'jojo' 
          }
        );
        
        socket.join(lobby.id);
        callback({ success: true, lobby: lobbyManager.sanitizeLobby(lobby) });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Join lobby by ID
    socket.on('lobby:join', (lobbyId, callback) => {
      try {
        const profile = dbHelpers.getProfile(socket.user.userId);
        const result = lobbyManager.joinLobby(
          lobbyId,
          socket.user.userId,
          socket.user.username,
          profile?.selected_character || 'jojo'
        );
        
        if (result.success) {
          socket.join(lobbyId);
        }
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Join lobby by code
    socket.on('lobby:joinByCode', (code, callback) => {
      try {
        const lobby = lobbyManager.getLobbyByCode(code);
        if (!lobby) {
          return callback({ success: false, error: 'Invalid code' });
        }

        const profile = dbHelpers.getProfile(socket.user.userId);
        const result = lobbyManager.joinLobby(
          lobby.id,
          socket.user.userId,
          socket.user.username,
          profile?.selected_character || 'jojo'
        );
        
        if (result.success) {
          socket.join(lobby.id);
        }
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Quick match - only join existing public lobbies, don't create new ones
    socket.on('lobby:quickMatch', (callback) => {
      try {
        let lobbyId = lobbyManager.findQuickMatch();
        
        if (!lobbyId) {
          // No available lobbies - return error instead of creating one
          return callback({ success: false, error: 'No available public lobbies. Try hosting your own!' });
        }

        const profile = dbHelpers.getProfile(socket.user.userId);
        const result = lobbyManager.joinLobby(
          lobbyId,
          socket.user.userId,
          socket.user.username,
          profile?.selected_character || 'jojo'
        );
        
        if (result.success) {
          socket.join(lobbyId);
        }
        callback({ ...result, created: false });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Leave lobby
    socket.on('lobby:leave', (callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (lobby) {
          socket.leave(lobby.id);
          lobbyManager.leaveLobby(socket.user.userId);
        }
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: error.message });
      }
    });

    // Add bot
    socket.on('lobby:addBot', (callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.addBot(lobby.id, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Remove bot
    socket.on('lobby:removeBot', (botId, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.removeBot(lobby.id, botId, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Update bot settings (name, difficulty)
    socket.on('lobby:updateBot', ({ botId, name, difficulty }, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.updateBot(lobby.id, botId, socket.user.userId, { name, difficulty });
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Update lobby settings
    socket.on('lobby:updateSettings', (settings, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.updateSettings(lobby.id, socket.user.userId, settings);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Set ready status
    socket.on('lobby:setReady', (isReady, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.setPlayerReady(lobby.id, socket.user.userId, isReady);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Set character
    socket.on('lobby:setCharacter', (character, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.setPlayerCharacter(lobby.id, socket.user.userId, character);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Start game (host only)
    socket.on('lobby:startGame', (callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.startVoting(lobby.id, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // CHARACTER SELECTION HANDLERS

    // Hover over character (not confirmed)
    socket.on('characterSelect:hover', (characterId) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (lobby) {
          lobbyManager.handleCharacterHover(lobby.id, socket.user.userId, characterId);
        }
      } catch (error) {
        console.error('Character hover error:', error);
      }
    });

    // Confirm character selection
    socket.on('characterSelect:confirm', (characterId, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.handleCharacterConfirm(lobby.id, socket.user.userId, characterId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // VOTING HANDLERS

    // Submit board vote
    socket.on('vote:board', (boardId, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.submitBoardVote(lobby.id, socket.user.userId, boardId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Submit tutorial vote
    socket.on('vote:tutorial', (wantsTutorial, callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          return callback({ success: false, error: 'Not in a lobby' });
        }
        
        const result = lobbyManager.submitTutorialVote(lobby.id, socket.user.userId, wantsTutorial);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Confirm ready to start game after voting
    socket.on('vote:readyToStart', (callback) => {
      try {
        const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
        if (!lobby) {
          console.error('vote:readyToStart - No lobby found for user:', socket.user.userId);
          return callback({ success: false, error: 'Not in a lobby' });
        }
        if (lobby.hostId !== socket.user.userId) {
          console.error('vote:readyToStart - User is not host:', socket.user.userId, 'Host:', lobby.hostId);
          return callback({ success: false, error: 'Not authorized' });
        }
        if (!lobby.selectedBoard) {
          console.error('vote:readyToStart - No board selected for lobby:', lobby.id);
          return callback({ success: false, error: 'No board selected' });
        }

        console.log('Starting game for lobby:', lobby.id, 'Board:', lobby.selectedBoard);
        const result = gameManager.startGame(lobby.id);
        console.log('Game start result:', result);
        callback(result);
      } catch (error) {
        console.error('vote:readyToStart error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // GAME HANDLERS

    // Ready to start (after intro)
    socket.on('game:ready', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback?.({ success: false, error: 'Not in a game' });
        }

        // Mark player as ready
        // When all players ready, advance phase
        gameManager.advancePhase(game.id);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: error.message });
      }
    });

    // Roll dice
    socket.on('game:rollDice', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.rollDice(game.id, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Move player
    socket.on('game:move', (targetSpaceId, callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.movePlayer(game.id, socket.user.userId, targetSpaceId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Use item
    socket.on('game:useItem', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.useItem(game.id, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Skip item use
    socket.on('game:skipItem', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.skipItem(game.id, socket.user.userId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Purchase star
    socket.on('game:purchaseStar', (purchase, callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.purchaseStar(game.id, socket.user.userId, purchase);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Purchase item from shop
    socket.on('game:purchaseItem', (itemId, callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.purchaseItem(game.id, socket.user.userId, itemId);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Skip shop
    socket.on('game:skipShop', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.purchaseItem(game.id, socket.user.userId, null);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // MINIGAME HANDLERS

    // Ready for minigame
    socket.on('minigame:ready', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback?.({ success: false, error: 'Not in a game' });
        }

        gameManager.startMinigame(game.id);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: error.message });
      }
    });

    // Submit minigame input
    socket.on('minigame:input', (input, callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback?.({ success: false, error: 'Not in a game' });
        }

        const result = gameManager.submitMinigameInput(game.id, socket.user.userId, input);
        callback?.(result);
      } catch (error) {
        callback?.({ success: false, error: error.message });
      }
    });

    // Acknowledge minigame end
    socket.on('minigame:acknowledge', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback?.({ success: false, error: 'Not in a game' });
        }

        gameManager.advancePhase(game.id);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: error.message });
      }
    });

    // CHAT

    socket.on('chat:message', (message) => {
      const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
      const game = gameManager.getPlayerGame(socket.user.userId);
      const roomId = game?.lobbyId || lobby?.id;

      if (roomId && message && message.length <= 200) {
        io.to(roomId).emit('chat:message', {
          userId: socket.user.userId,
          username: socket.user.username,
          message: message.slice(0, 200),
          timestamp: Date.now()
        });
      }
    });

    // EMOTES

    socket.on('emote:send', (emoteId) => {
      const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
      const game = gameManager.getPlayerGame(socket.user.userId);
      const roomId = game?.lobbyId || lobby?.id;

      if (roomId) {
        io.to(roomId).emit('emote:show', {
          userId: socket.user.userId,
          emoteId,
          timestamp: Date.now()
        });
      }
    });

    // DISCONNECT

    socket.on('disconnect', () => {
      console.log(`👋 Player disconnected: ${socket.user.username}`);

      // Unregister socket for achievement notifications
      achievementManager.unregisterUserSocket(socket.user.userId);

      // Handle lobby disconnect
      const lobby = lobbyManager.getPlayerLobby(socket.user.userId);
      if (lobby) {
        lobbyManager.leaveLobby(socket.user.userId);
      }

      // Handle game disconnect - bot takes over
      const game = gameManager.getPlayerGame(socket.user.userId);
      if (game) {
        const player = game.players.find(p => p.id === socket.user.userId);
        if (player) {
          player.disconnected = true;
          player.disconnectedAt = Date.now();
          
          io.to(game.lobbyId).emit('game:playerDisconnected', {
            playerId: socket.user.userId,
            username: socket.user.username
          });
        }
      }
    });

    // Reconnection
    socket.on('reconnect:game', (callback) => {
      try {
        const game = gameManager.getPlayerGame(socket.user.userId);
        if (!game) {
          return callback({ success: false, error: 'No active game' });
        }

        const player = game.players.find(p => p.id === socket.user.userId);
        if (player) {
          player.disconnected = false;
          socket.join(game.lobbyId);

          io.to(game.lobbyId).emit('game:playerReconnected', {
            playerId: socket.user.userId,
            username: socket.user.username
          });

          callback({
            success: true,
            game: gameManager.sanitizeGame(game)
          });
        } else {
          callback({ success: false, error: 'Not a participant' });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });
  });
}
