import { v4 as uuidv4 } from 'uuid';
import { BOARDS } from './BoardData.js';
import { MINIGAMES } from './MinigameData.js';
import { CHARACTERS } from './CharacterData.js';
import { ITEMS, SHOP_TYPES, getItemsForShopType } from './ItemData.js';
import { dbHelpers } from '../database/index.js';
import { LOBBY_STATE } from './LobbyManager.js';

export const GAME_PHASE = {
  INTRO: 'intro',
  TURN_START: 'turn_start',
  ITEM_USE: 'item_use',
  DICE_ROLL: 'dice_roll',
  MOVING: 'moving',
  SPACE_EVENT: 'space_event',
  TURN_END: 'turn_end',
  MINIGAME_INTRO: 'minigame_intro',
  MINIGAME: 'minigame',
  MINIGAME_RESULTS: 'minigame_results',
  GAME_END: 'game_end'
};

export const SPACE_TYPE = {
  BLUE: 'blue',
  RED: 'red',
  EVENT: 'event',
  SHOP: 'shop',
  VS: 'vs',
  STAR: 'star',
  OVERSEER: 'overseer',
  START: 'start',
  LUCKY: 'lucky',
  BOWSER: 'bowser'
};

export class GameManager {
  constructor(io, db, lobbyManager) {
    this.io = io;
    this.db = db;
    this.lobbyManager = lobbyManager;
    this.games = new Map();
    this.playerToGame = new Map();
  }

  getBoardsData() {
    return BOARDS.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      theme: b.theme,
      difficulty: b.difficulty,
      preview: b.preview
    }));
  }

  getMinigamesData() {
    return MINIGAMES.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      type: m.type,
      playerCount: m.playerCount,
      preview: m.preview,
      icon: this.getMinigameIcon(m.type)
    }));
  }

  getMinigameById(id) {
    const m = MINIGAMES.find(mg => mg.id === id);
    if (!m) return null;
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      type: m.type,
      duration: m.duration,
      controls: m.controls,
      rules: m.rules,
      is3D: m.is3D,
      icon: this.getMinigameIcon(m.type)
    };
  }

  getMinigameIcon(type) {
    const icons = {
      'ffa': '🎮',
      'team': '👥',
      '1v3': '⚔️',
      'coop': '🤝',
      'duel': '🆚'
    };
    return icons[type] || '🎮';
  }

  getCharactersData() {
    return CHARACTERS;
  }

  startGame(lobbyId) {
    const lobby = this.lobbyManager.getLobby(lobbyId);
    if (!lobby || !lobby.selectedBoard) return { success: false };

    const board = BOARDS.find(b => b.id === lobby.selectedBoard);
    if (!board) return { success: false };

    lobby.state = LOBBY_STATE.PLAYING;

    const gameId = uuidv4();
    const allParticipants = [...lobby.players, ...lobby.bots];

    // Initialize player states
    const players = allParticipants.map((p, index) => ({
      id: p.id,
      username: p.username,
      isBot: p.isBot,
      character: p.character,
      coins: lobby.settings.startingCoins,
      stars: 0,
      items: [], // Can hold up to 3 items
      position: board.startSpaceId,
      turnOrder: index,
      minigamesWon: 0,
      totalMovement: 0,
      itemsUsed: 0,
      landedSpaces: { blue: 0, red: 0, event: 0, shop: 0, vs: 0, overseer: 0, lucky: 0, bowser: 0 }
    }));

    // Shuffle turn order
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i].turnOrder, players[j].turnOrder] = [players[j].turnOrder, players[i].turnOrder];
    }
    players.sort((a, b) => a.turnOrder - b.turnOrder);

    // Pick random star location
    const starSpaces = board.spaces.filter(s => s.canHaveStar);
    const starLocation = starSpaces[Math.floor(Math.random() * starSpaces.length)].id;

    const game = {
      id: gameId,
      lobbyId,
      board: board.id,
      boardData: board,
      players,
      settings: { ...lobby.settings },
      currentTurn: 1,
      maxTurns: lobby.settings.turns,
      currentPlayerIndex: 0,
      phase: GAME_PHASE.INTRO,
      starLocation,
      starCost: 20,
      lastMinigameResults: null,
      turnHistory: [],
      startTime: Date.now(),
      diceResult: null,
      movesRemaining: 0,
      currentPath: [],
      pendingEvent: null,
      overseerWheel: null
    };

    this.games.set(gameId, game);
    
    // Map players to game
    for (const player of players) {
      if (!player.isBot) {
        this.playerToGame.set(player.id, gameId);
      }
    }

    // Emit game start
    this.io.to(lobbyId).emit('game:started', {
      gameId,
      game: this.sanitizeGame(game)
    });

    return { success: true, gameId, game: this.sanitizeGame(game) };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  getPlayerGame(playerId) {
    const gameId = this.playerToGame.get(playerId);
    return gameId ? this.games.get(gameId) : null;
  }

  getCurrentPlayer(game) {
    return game.players[game.currentPlayerIndex];
  }

  advancePhase(gameId, targetPhase = null) {
    const game = this.games.get(gameId);
    if (!game) return;

    const previousPhase = game.phase;

    if (targetPhase) {
      game.phase = targetPhase;
    } else {
      // Auto-advance based on current phase
      switch (game.phase) {
        case GAME_PHASE.INTRO:
          game.phase = GAME_PHASE.TURN_START;
          break;
        case GAME_PHASE.TURN_START:
          game.phase = GAME_PHASE.ITEM_USE;
          break;
        case GAME_PHASE.ITEM_USE:
          game.phase = GAME_PHASE.DICE_ROLL;
          break;
        case GAME_PHASE.DICE_ROLL:
          game.phase = GAME_PHASE.MOVING;
          break;
        case GAME_PHASE.MOVING:
          game.phase = GAME_PHASE.SPACE_EVENT;
          break;
        case GAME_PHASE.SPACE_EVENT:
          game.phase = GAME_PHASE.TURN_END;
          break;
        case GAME_PHASE.TURN_END:
          this.nextPlayer(game);
          break;
        case GAME_PHASE.MINIGAME_INTRO:
          game.phase = GAME_PHASE.MINIGAME;
          break;
        case GAME_PHASE.MINIGAME:
          game.phase = GAME_PHASE.MINIGAME_RESULTS;
          break;
        case GAME_PHASE.MINIGAME_RESULTS:
          this.startNewRound(game);
          break;
      }
    }

    this.io.to(game.lobbyId).emit('game:phaseChanged', {
      previousPhase,
      newPhase: game.phase,
      game: this.sanitizeGame(game)
    });
  }

  nextPlayer(game) {
    game.currentPlayerIndex++;

    // If all players have gone, trigger minigame
    if (game.currentPlayerIndex >= game.players.length) {
      game.currentPlayerIndex = 0;
      game.phase = GAME_PHASE.MINIGAME_INTRO;
      this.selectMinigame(game);
    } else {
      game.phase = GAME_PHASE.TURN_START;
    }
  }

  startNewRound(game) {
    game.currentTurn++;

    if (game.currentTurn > game.maxTurns) {
      game.phase = GAME_PHASE.GAME_END;
      this.endGame(game);
    } else {
      // Check for Last 5 Turns event
      const turnsRemaining = game.maxTurns - game.currentTurn + 1;
      if (turnsRemaining === 5 && !game.last5TurnsTriggered) {
        game.last5TurnsTriggered = true;
        this.triggerLast5TurnsEvent(game);
      }
      
      game.currentPlayerIndex = 0;
      game.phase = GAME_PHASE.TURN_START;
    }
  }

  triggerLast5TurnsEvent(game) {
    // Pick a random event for the last 5 turns
    const events = [
      { 
        id: 'double_coins',
        name: '💰 Double Coins!',
        description: 'All blue and red spaces now give/take DOUBLE coins!',
        effect: { coinMultiplier: 2 }
      },
      { 
        id: 'triple_minigame',
        name: '🎮 Triple Minigame Rewards!',
        description: 'Minigame rewards are TRIPLED!',
        effect: { minigameMultiplier: 3 }
      },
      { 
        id: 'red_to_blue',
        name: '💙 Red Spaces Turn Blue!',
        description: 'All red spaces become blue spaces!',
        effect: { redToBlue: true }
      },
      { 
        id: 'double_dice',
        name: '🎲 Double Dice!',
        description: 'Everyone rolls twice the dice value!',
        effect: { diceMultiplier: 2 }
      },
      { 
        id: 'star_discount',
        name: '⭐ Star Sale!',
        description: 'Stars cost half price (10 coins)!',
        effect: { starCostMultiplier: 0.5 }
      },
      { 
        id: 'bowser_rampage',
        name: '🔥 Bowser\'s Rampage!',
        description: 'More Bowser events will occur!',
        effect: { extraBowserEvents: true }
      },
      { 
        id: 'lucky_bonus',
        name: '🍀 Lucky Finale!',
        description: 'Lucky spaces give even better rewards!',
        effect: { luckyBoost: true }
      }
    ];

    const selectedEvent = events[Math.floor(Math.random() * events.length)];
    
    // Store the active event
    game.last5TurnsEffect = selectedEvent.effect;
    game.last5TurnsEventName = selectedEvent.name;

    // Apply immediate effects
    if (selectedEvent.effect.starCostMultiplier) {
      game.starCost = Math.floor(game.starCost * selectedEvent.effect.starCostMultiplier);
    }

    this.io.to(game.lobbyId).emit('game:last5Turns', {
      turnsRemaining: 5,
      event: {
        id: selectedEvent.id,
        name: selectedEvent.name,
        description: selectedEvent.description
      }
    });
  }

  rollDice(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId && !currentPlayer.isBot) {
      return { success: false, error: 'Not your turn' };
    }

    if (game.phase !== GAME_PHASE.DICE_ROLL) {
      return { success: false, error: 'Cannot roll dice now' };
    }

    // Roll 1-10
    let diceResult = Math.floor(Math.random() * 10) + 1;

    // Apply item modifiers if any (check for active item effects)
    if (currentPlayer.items && currentPlayer.items.length > 0) {
      const itemEffect = this.applyItemEffect(game, currentPlayer, 'diceRoll', diceResult);
      if (itemEffect.modifiedDice !== undefined) {
        diceResult = itemEffect.modifiedDice;
      }
    }
    
    // Apply Last 5 Turns dice multiplier if active
    if (game.last5TurnsEffect?.diceMultiplier) {
      diceResult = Math.floor(diceResult * game.last5TurnsEffect.diceMultiplier);
    }

    game.diceResult = diceResult;
    game.movesRemaining = diceResult;

    this.io.to(game.lobbyId).emit('game:diceRolled', {
      playerId: currentPlayer.id,
      result: diceResult,
      game: this.sanitizeGame(game)
    });

    this.advancePhase(gameId);
    return { success: true, result: diceResult };
  }

  movePlayer(gameId, playerId, targetSpaceId) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId) return { success: false };
    if (game.phase !== GAME_PHASE.MOVING) return { success: false };

    const board = game.boardData;
    const currentSpace = board.spaces.find(s => s.id === currentPlayer.position);
    
    // Validate move
    if (!currentSpace.connections.includes(targetSpaceId)) {
      return { success: false, error: 'Invalid move' };
    }

    currentPlayer.position = targetSpaceId;
    currentPlayer.totalMovement++;
    game.movesRemaining--;

    const newSpace = board.spaces.find(s => s.id === targetSpaceId);

    this.io.to(game.lobbyId).emit('game:playerMoved', {
      playerId: currentPlayer.id,
      fromSpace: currentSpace.id,
      toSpace: targetSpaceId,
      movesRemaining: game.movesRemaining
    });

    // Check if passing star
    if (targetSpaceId === game.starLocation && game.movesRemaining > 0) {
      // Passing by star - offer purchase
      if (currentPlayer.coins >= game.starCost) {
        game.pendingEvent = { type: 'star_offer' };
        this.io.to(game.lobbyId).emit('game:starOffer', {
          playerId: currentPlayer.id,
          cost: game.starCost
        });
        return { success: true, starOffer: true };
      }
    }

    // If no moves left, trigger space event
    if (game.movesRemaining <= 0) {
      this.advancePhase(gameId);
      this.triggerSpaceEvent(game, newSpace);
    }

    return { success: true, movesRemaining: game.movesRemaining };
  }

  purchaseStar(gameId, playerId, purchase) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId) return { success: false };

    if (purchase && currentPlayer.coins >= game.starCost) {
      currentPlayer.coins -= game.starCost;
      currentPlayer.stars++;

      // Move star to new location
      const board = game.boardData;
      const starSpaces = board.spaces.filter(s => s.canHaveStar && s.id !== game.starLocation);
      game.starLocation = starSpaces[Math.floor(Math.random() * starSpaces.length)].id;

      this.io.to(game.lobbyId).emit('game:starPurchased', {
        playerId: currentPlayer.id,
        newStars: currentPlayer.stars,
        newCoins: currentPlayer.coins,
        newStarLocation: game.starLocation
      });
    }

    game.pendingEvent = null;
    return { success: true };
  }

  triggerSpaceEvent(game, space) {
    const currentPlayer = this.getCurrentPlayer(game);
    currentPlayer.landedSpaces[space.type] = (currentPlayer.landedSpaces[space.type] || 0) + 1;

    switch (space.type) {
      case SPACE_TYPE.BLUE:
        this.handleBlueSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.RED:
        this.handleRedSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.EVENT:
        this.handleEventSpace(game, currentPlayer, space);
        break;
      case SPACE_TYPE.SHOP:
        this.handleShopSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.VS:
        this.handleVSSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.OVERSEER:
        this.handleOverseerSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.STAR:
        this.handleStarSpace(game, currentPlayer);
        break;
      case SPACE_TYPE.LUCKY:
        this.handleLuckySpace(game, currentPlayer);
        break;
      case SPACE_TYPE.BOWSER:
        this.handleBowserSpace(game, currentPlayer);
        break;
      default:
        this.advancePhase(game.id);
    }
  }

  handleBlueSpace(game, player) {
    let baseCoins = game.currentTurn === game.maxTurns ? 6 : 3; // Double on last turn
    
    // Apply Last 5 Turns multiplier if active
    if (game.last5TurnsEffect?.coinMultiplier) {
      baseCoins *= game.last5TurnsEffect.coinMultiplier;
    }
    
    // Check if red-to-blue effect is active (bonus message)
    const wasRed = game.last5TurnsEffect?.redToBlue;
    
    player.coins += baseCoins;

    this.io.to(game.lobbyId).emit('game:spaceEvent', {
      type: 'blue',
      playerId: player.id,
      coinsChange: baseCoins,
      newCoins: player.coins,
      multiplied: !!game.last5TurnsEffect?.coinMultiplier
    });

    this.advancePhase(game.id);
  }

  handleRedSpace(game, player) {
    // If red-to-blue effect is active, treat as blue space
    if (game.last5TurnsEffect?.redToBlue) {
      this.handleBlueSpace(game, player);
      return;
    }
    
    let coinsLost = game.currentTurn === game.maxTurns ? 6 : 3;
    
    // Apply Last 5 Turns multiplier if active
    if (game.last5TurnsEffect?.coinMultiplier) {
      coinsLost *= game.last5TurnsEffect.coinMultiplier;
    }
    
    player.coins = Math.max(0, player.coins - coinsLost);

    this.io.to(game.lobbyId).emit('game:spaceEvent', {
      type: 'red',
      playerId: player.id,
      coinsChange: -coinsLost,
      newCoins: player.coins,
      multiplied: !!game.last5TurnsEffect?.coinMultiplier
    });

    this.advancePhase(game.id);
  }

  handleEventSpace(game, player, space) {
    const events = space.events || ['coinGift', 'coinSteal', 'shuffle', 'teleport'];
    const event = events[Math.floor(Math.random() * events.length)];

    let eventData = { type: 'event', eventName: event, playerId: player.id };

    switch (event) {
      case 'coinGift':
        // All players get 5 coins
        for (const p of game.players) {
          p.coins += 5;
        }
        eventData.message = 'Everyone receives 5 coins!';
        break;

      case 'coinSteal':
        // Steal 5 coins from random player
        const others = game.players.filter(p => p.id !== player.id && p.coins > 0);
        if (others.length > 0) {
          const victim = others[Math.floor(Math.random() * others.length)];
          const stolen = Math.min(5, victim.coins);
          victim.coins -= stolen;
          player.coins += stolen;
          eventData.message = `Stole ${stolen} coins from ${victim.username}!`;
          eventData.victimId = victim.id;
        }
        break;

      case 'shuffle':
        // Shuffle all player positions
        const positions = game.players.map(p => p.position);
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        game.players.forEach((p, i) => p.position = positions[i]);
        eventData.message = 'All players shuffled positions!';
        eventData.newPositions = game.players.map(p => ({ id: p.id, position: p.position }));
        break;

      case 'teleport':
        // Teleport to random space
        const spaces = game.boardData.spaces.filter(s => s.type !== SPACE_TYPE.START);
        const newSpace = spaces[Math.floor(Math.random() * spaces.length)];
        player.position = newSpace.id;
        eventData.message = `Teleported to ${newSpace.name || 'a new location'}!`;
        eventData.newPosition = newSpace.id;
        break;
    }

    this.io.to(game.lobbyId).emit('game:spaceEvent', eventData);
    this.advancePhase(game.id);
  }

  handleShopSpace(game, player) {
    const MAX_ITEMS = 3;
    if (player.items && player.items.length >= MAX_ITEMS) {
      this.io.to(game.lobbyId).emit('game:spaceEvent', {
        type: 'shop',
        playerId: player.id,
        message: 'Item bag is full! (Max 3 items)'
      });
      this.advancePhase(game.id);
      return;
    }

    // Get shop type from current space
    const currentSpace = game.board.spaces.find(s => s.id === player.position);
    const shopType = currentSpace?.shopType || 'item';
    const shopConfig = SHOP_TYPES[shopType] || SHOP_TYPES.item;
    
    // Get items available in this shop type
    const availableItems = getItemsForShopType(shopType, player.coins);
    
    game.pendingEvent = {
      type: 'shop',
      shopType: shopType,
      items: availableItems
    };

    this.io.to(game.lobbyId).emit('game:shopOpen', {
      playerId: player.id,
      shopType: shopType,
      shopName: shopConfig.name,
      shopIcon: shopConfig.icon,
      shopDescription: shopConfig.description,
      items: availableItems,
      playerCoins: player.coins
    });
  }

  purchaseItem(gameId, playerId, itemId) {
    const game = this.games.get(gameId);
    if (!game || game.pendingEvent?.type !== 'shop') return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId) return { success: false };

    if (itemId) {
      // Find the item in the shop's available items (which has adjusted price)
      const shopItem = game.pendingEvent.items.find(i => i.id === itemId);
      const MAX_ITEMS = 3;
      if (shopItem && currentPlayer.coins >= shopItem.price && currentPlayer.items.length < MAX_ITEMS) {
        currentPlayer.coins -= shopItem.price;
        currentPlayer.items.push(itemId);

        this.io.to(game.lobbyId).emit('game:itemPurchased', {
          playerId: currentPlayer.id,
          itemId,
          itemName: shopItem.name,
          itemIcon: shopItem.icon,
          price: shopItem.price,
          newCoins: currentPlayer.coins,
          totalItems: currentPlayer.items.length
        });
      }
    }

    game.pendingEvent = null;
    this.advancePhase(game.id);
    return { success: true };
  }

  handleVSSpace(game, player) {
    // Queue a VS minigame for after the normal minigame
    game.pendingVSMinigame = {
      triggeredBy: player.id
    };

    this.io.to(game.lobbyId).emit('game:spaceEvent', {
      type: 'vs',
      playerId: player.id,
      message: 'VS Minigame will occur!'
    });

    this.advancePhase(game.id);
  }

  handleLuckySpace(game, player) {
    // Lucky space - random good things happen!
    const luckyEvents = [
      { id: 'coin_bonus', name: 'Coin Shower!', weight: 30, effect: { coins: 10 } },
      { id: 'big_coin_bonus', name: 'Jackpot!', weight: 15, effect: { coins: 20 } },
      { id: 'free_item', name: 'Free Item!', weight: 20, effect: { freeItem: true } },
      { id: 'double_next', name: 'Double Next Space!', weight: 15, effect: { doubleNextReward: true } },
      { id: 'steal_coins', name: 'Lucky Steal!', weight: 10, effect: { stealRandom: 10 } },
      { id: 'move_to_star', name: 'Warp to Star!', weight: 5, effect: { moveNearStar: true } },
      { id: 'mega_bonus', name: 'MEGA BONUS!', weight: 4, effect: { coins: 30 } },
      { id: 'free_star', name: '⭐ FREE STAR! ⭐', weight: 1, effect: { stars: 1 } }
    ];

    // Weighted random selection
    const totalWeight = luckyEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedEvent = luckyEvents[0];
    
    for (const event of luckyEvents) {
      random -= event.weight;
      if (random <= 0) {
        selectedEvent = event;
        break;
      }
    }

    // Apply effect
    let message = selectedEvent.name;
    const effect = selectedEvent.effect;
    
    if (effect.coins) {
      player.coins += effect.coins;
      message += ` +${effect.coins} coins!`;
    }
    if (effect.stars) {
      player.stars += effect.stars;
      message += ` +${effect.stars} star!`;
    }
    if (effect.freeItem && player.items.length < 3) {
      // Give a random common/uncommon item
      const freeItems = ITEMS.filter(i => i.rarity === 'common' || i.rarity === 'uncommon');
      const randomItem = freeItems[Math.floor(Math.random() * freeItems.length)];
      player.items.push(randomItem.id);
      message += ` Got ${randomItem.name}!`;
    }
    if (effect.stealRandom) {
      const others = game.players.filter(p => p.id !== player.id && p.coins > 0);
      if (others.length > 0) {
        const victim = others[Math.floor(Math.random() * others.length)];
        const stolen = Math.min(effect.stealRandom, victim.coins);
        victim.coins -= stolen;
        player.coins += stolen;
        message += ` Stole ${stolen} coins!`;
      }
    }
    if (effect.doubleNextReward) {
      player.doubleNextReward = true;
    }

    this.io.to(game.lobbyId).emit('game:spaceEvent', {
      type: 'lucky',
      playerId: player.id,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      message: message,
      coinsChange: effect.coins || 0,
      starsChange: effect.stars || 0,
      newCoins: player.coins,
      newStars: player.stars
    });

    this.advancePhase(game.id);
  }

  handleBowserSpace(game, player) {
    // Bowser space - bad things happen!
    const bowserEvents = [
      { id: 'coin_tax', name: 'Bowser Tax!', weight: 30, effect: { coins: -10 } },
      { id: 'big_tax', name: 'Bowser\'s Greed!', weight: 15, effect: { coins: -20 } },
      { id: 'coin_shuffle', name: 'Coin Chaos!', weight: 15, effect: { shuffleCoins: true } },
      { id: 'everyone_loses', name: 'Bowser\'s Fury!', weight: 12, effect: { everyoneLoses: 5 } },
      { id: 'item_steal', name: 'Item Snatch!', weight: 10, effect: { loseItem: true } },
      { id: 'half_coins', name: 'Bowser\'s Toll!', weight: 8, effect: { halfCoins: true } },
      { id: 'star_steal', name: 'Star Snatch!', weight: 5, effect: { stars: -1 } },
      { id: 'bowser_revolution', name: 'Bowser Revolution!', weight: 4, effect: { revolution: true } },
      { id: 'bowser_mercy', name: 'Bowser\'s Mercy', weight: 1, effect: {} }
    ];

    // Weighted random selection
    const totalWeight = bowserEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedEvent = bowserEvents[0];
    
    for (const event of bowserEvents) {
      random -= event.weight;
      if (random <= 0) {
        selectedEvent = event;
        break;
      }
    }

    // Apply effect
    let message = selectedEvent.name;
    const effect = selectedEvent.effect;
    let coinsChange = 0;
    let starsChange = 0;
    
    if (effect.coins) {
      const lost = Math.min(Math.abs(effect.coins), player.coins);
      player.coins -= lost;
      coinsChange = -lost;
      message += ` Lost ${lost} coins!`;
    }
    if (effect.stars && player.stars > 0) {
      player.stars = Math.max(0, player.stars + effect.stars);
      starsChange = effect.stars;
      message += ` Lost a star!`;
    }
    if (effect.halfCoins) {
      const lost = Math.floor(player.coins / 2);
      player.coins -= lost;
      coinsChange = -lost;
      message += ` Lost ${lost} coins!`;
    }
    if (effect.loseItem && player.items && player.items.length > 0) {
      const lostItemId = player.items.pop(); // Remove last item
      const item = ITEMS.find(i => i.id === lostItemId);
      message += ` Lost ${item?.name || 'item'}!`;
    }
    if (effect.everyoneLoses) {
      game.players.forEach(p => {
        const lost = Math.min(effect.everyoneLoses, p.coins);
        p.coins -= lost;
      });
      message += ` Everyone lost ${effect.everyoneLoses} coins!`;
    }
    if (effect.shuffleCoins) {
      const totalCoins = game.players.reduce((sum, p) => sum + p.coins, 0);
      const perPlayer = Math.floor(totalCoins / game.players.length);
      game.players.forEach(p => p.coins = perPlayer);
      message += ' All coins shuffled!';
    }
    if (effect.revolution) {
      // Revolution: everyone's coins become equal (averaged)
      const totalCoins = game.players.reduce((sum, p) => sum + p.coins, 0);
      const perPlayer = Math.floor(totalCoins / game.players.length);
      game.players.forEach(p => p.coins = perPlayer);
      message = 'Bowser Revolution! Everyone now has equal coins!';
    }

    this.io.to(game.lobbyId).emit('game:spaceEvent', {
      type: 'bowser',
      playerId: player.id,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      message: message,
      coinsChange: coinsChange,
      starsChange: starsChange,
      newCoins: player.coins,
      newStars: player.stars
    });

    this.advancePhase(game.id);
  }

  handleOverseerSpace(game, player) {
    // Create overseer wheel
    const outcomes = [
      { id: 'lose_coins_10', name: 'Lose 10 Coins', weight: 25, effect: { coins: -10 } },
      { id: 'lose_coins_20', name: 'Lose 20 Coins', weight: 20, effect: { coins: -20 } },
      { id: 'lose_coins_half', name: 'Lose Half Coins', weight: 15, effect: { coinsPercent: -50 } },
      { id: 'lose_star', name: 'Lose a Star', weight: 10, effect: { stars: -1 } },
      { id: 'everyone_loses_10', name: 'Everyone Loses 10', weight: 10, effect: { everyoneCoins: -10 } },
      { id: 'shuffle_coins', name: 'Shuffle All Coins', weight: 8, effect: { shuffleCoins: true } },
      { id: 'teleport_back', name: 'Back to Start', weight: 7, effect: { teleportStart: true } },
      { id: 'nothing', name: 'Overseer\'s Mercy', weight: 4.999, effect: {} },
      { id: 'free_star', name: 'FREE STAR!', weight: 0.001, effect: { stars: 1 } }
    ];

    game.overseerWheel = {
      outcomes,
      playerId: player.id
    };

    this.io.to(game.lobbyId).emit('game:overseerEncounter', {
      playerId: player.id,
      outcomes: outcomes.map(o => ({ id: o.id, name: o.name }))
    });

    // Auto-spin after delay
    setTimeout(() => this.spinOverseerWheel(game.id), 3000);
  }

  spinOverseerWheel(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.overseerWheel) return;

    const { outcomes, playerId } = game.overseerWheel;
    const player = game.players.find(p => p.id === playerId);

    // Weighted random selection
    const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedOutcome = outcomes[0];

    for (const outcome of outcomes) {
      random -= outcome.weight;
      if (random <= 0) {
        selectedOutcome = outcome;
        break;
      }
    }

    // Apply effect
    const effect = selectedOutcome.effect;
    let resultMessage = selectedOutcome.name;

    if (effect.coins) {
      player.coins = Math.max(0, player.coins + effect.coins);
    }
    if (effect.coinsPercent) {
      const change = Math.floor(player.coins * (effect.coinsPercent / 100));
      player.coins = Math.max(0, player.coins + change);
    }
    if (effect.stars) {
      player.stars = Math.max(0, player.stars + effect.stars);
    }
    if (effect.everyoneCoins) {
      for (const p of game.players) {
        p.coins = Math.max(0, p.coins + effect.everyoneCoins);
      }
    }
    if (effect.shuffleCoins) {
      const allCoins = game.players.map(p => p.coins);
      for (let i = allCoins.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCoins[i], allCoins[j]] = [allCoins[j], allCoins[i]];
      }
      game.players.forEach((p, i) => p.coins = allCoins[i]);
    }
    if (effect.teleportStart) {
      player.position = game.boardData.startSpaceId;
    }

    // Record encounter
    dbHelpers.updateStats(this.db, playerId, {
      overseer_encounters: 1,
      overseer_wins: selectedOutcome.id === 'free_star' ? 1 : 0
    });

    this.io.to(game.lobbyId).emit('game:overseerResult', {
      playerId,
      outcome: selectedOutcome.id,
      outcomeName: selectedOutcome.name,
      game: this.sanitizeGame(game)
    });

    game.overseerWheel = null;
    this.advancePhase(game.id);
  }

  handleStarSpace(game, player) {
    if (game.starLocation === player.position && player.coins >= game.starCost) {
      game.pendingEvent = { type: 'star_offer' };
      this.io.to(game.lobbyId).emit('game:starOffer', {
        playerId: player.id,
        cost: game.starCost
      });
    } else {
      this.advancePhase(game.id);
    }
  }

  useItem(gameId, playerId, itemId = null) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId) return { success: false };
    if (game.phase !== GAME_PHASE.ITEM_USE) return { success: false };
    if (!currentPlayer.items || currentPlayer.items.length === 0) return { success: false, error: 'No items' };

    // If itemId not provided, use the first item
    const targetItemId = itemId || currentPlayer.items[0];
    const itemIndex = currentPlayer.items.indexOf(targetItemId);
    if (itemIndex === -1) return { success: false, error: 'Item not in inventory' };

    const item = ITEMS.find(i => i.id === targetItemId);
    if (!item) return { success: false };

    const result = this.applyItemEffect(game, currentPlayer, 'use', null, targetItemId);
    
    // Remove the used item from inventory
    currentPlayer.items.splice(itemIndex, 1);
    currentPlayer.itemsUsed = (currentPlayer.itemsUsed || 0) + 1;

    this.io.to(game.lobbyId).emit('game:itemUsed', {
      playerId: currentPlayer.id,
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      result,
      remainingItems: currentPlayer.items
    });

    return { success: true, result };
  }

  skipItem(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const currentPlayer = this.getCurrentPlayer(game);
    if (currentPlayer.id !== playerId) return { success: false };

    this.advancePhase(gameId);
    return { success: true };
  }

  applyItemEffect(game, player, trigger, value, itemId = null) {
    // If itemId provided, use it; otherwise use the first item in inventory
    const targetItemId = itemId || (player.items && player.items[0]);
    const item = ITEMS.find(i => i.id === targetItemId);
    if (!item) return {};

    let result = {};

    switch (item.id) {
      case 'double_dice':
        if (trigger === 'diceRoll') {
          result.modifiedDice = value * 2;
        }
        break;

      case 'triple_dice':
        if (trigger === 'diceRoll') {
          result.modifiedDice = Math.min(value * 3, 30);
        }
        break;

      case 'custom_dice':
        if (trigger === 'use') {
          result.chooseDice = true;
        }
        break;

      case 'coin_steal':
        if (trigger === 'use') {
          const others = game.players.filter(p => p.id !== player.id && p.coins > 0);
          if (others.length > 0) {
            const victim = others[Math.floor(Math.random() * others.length)];
            const stolen = Math.min(10, victim.coins);
            victim.coins -= stolen;
            player.coins += stolen;
            result.stolen = stolen;
            result.victimId = victim.id;
          }
        }
        break;

      case 'position_swap':
        if (trigger === 'use') {
          const others = game.players.filter(p => p.id !== player.id);
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            const temp = player.position;
            player.position = target.position;
            target.position = temp;
            result.swappedWith = target.id;
          }
        }
        break;

      case 'star_discount':
        result.starDiscount = 10;
        break;

      case 'golden_pipe':
        if (trigger === 'use') {
          player.position = game.starLocation;
          result.teleportedToStar = true;
        }
        break;
        
      case 'dueling_glove':
        if (trigger === 'use') {
          result.initiateDuel = true;
        }
        break;
    }

    return result;
  }

  // Duel System
  initiateDuel(gameId, challengerId, targetId, coinsAtStake = 20) {
    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const challenger = game.players.find(p => p.id === challengerId);
    const target = game.players.find(p => p.id === targetId);
    
    if (!challenger || !target) return { success: false, error: 'Invalid players' };

    // Store duel info
    game.pendingDuel = {
      challengerId,
      targetId,
      coinsAtStake: Math.min(coinsAtStake, challenger.coins, target.coins),
      status: 'pending'
    };

    this.io.to(game.lobbyId).emit('game:duelInitiated', {
      challengerId,
      challengerName: challenger.username,
      targetId,
      targetName: target.username,
      coinsAtStake: game.pendingDuel.coinsAtStake
    });

    return { success: true };
  }

  startDuelMinigame(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.pendingDuel) return { success: false };

    // Pick a random duel minigame
    const duelMinigames = MINIGAMES.filter(m => m.type === 'duel' || m.supportsDuel);
    
    // If no duel-specific minigames, use a simple randomized outcome
    if (duelMinigames.length === 0) {
      // Simple dice roll duel
      const challengerRoll = Math.floor(Math.random() * 10) + 1;
      const targetRoll = Math.floor(Math.random() * 10) + 1;
      
      let winnerId, loserId;
      if (challengerRoll >= targetRoll) {
        winnerId = game.pendingDuel.challengerId;
        loserId = game.pendingDuel.targetId;
      } else {
        winnerId = game.pendingDuel.targetId;
        loserId = game.pendingDuel.challengerId;
      }
      
      this.resolveDuel(gameId, winnerId, loserId, {
        type: 'dice_duel',
        challengerRoll,
        targetRoll
      });
      
      return { success: true };
    }

    const selectedMinigame = duelMinigames[Math.floor(Math.random() * duelMinigames.length)];

    game.currentMinigame = {
      id: selectedMinigame.id,
      data: selectedMinigame,
      type: 'duel',
      duelInfo: game.pendingDuel,
      participants: [game.pendingDuel.challengerId, game.pendingDuel.targetId],
      scores: {},
      inputs: {},
      startTime: Date.now(),
      ended: false
    };

    this.io.to(game.lobbyId).emit('game:duelMinigameStarted', {
      minigame: selectedMinigame,
      challenger: game.pendingDuel.challengerId,
      target: game.pendingDuel.targetId,
      coinsAtStake: game.pendingDuel.coinsAtStake
    });

    // Set timeout for duel end
    const duration = selectedMinigame.duration || 30000;
    setTimeout(() => {
      if (game.currentMinigame && !game.currentMinigame.ended && game.currentMinigame.type === 'duel') {
        this.endDuelMinigame(gameId);
      }
    }, duration);

    return { success: true };
  }

  endDuelMinigame(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.currentMinigame || game.currentMinigame.type !== 'duel') return;

    const duelInfo = game.currentMinigame.duelInfo;
    const scores = game.currentMinigame.scores;
    
    const challengerScore = scores[duelInfo.challengerId] || 0;
    const targetScore = scores[duelInfo.targetId] || 0;

    let winnerId, loserId;
    if (challengerScore >= targetScore) {
      winnerId = duelInfo.challengerId;
      loserId = duelInfo.targetId;
    } else {
      winnerId = duelInfo.targetId;
      loserId = duelInfo.challengerId;
    }

    this.resolveDuel(gameId, winnerId, loserId, {
      type: 'minigame',
      challengerScore,
      targetScore
    });
  }

  resolveDuel(gameId, winnerId, loserId, resultDetails) {
    const game = this.games.get(gameId);
    if (!game) return;

    const winner = game.players.find(p => p.id === winnerId);
    const loser = game.players.find(p => p.id === loserId);
    const coinsAtStake = game.pendingDuel?.coinsAtStake || 20;

    // Transfer coins
    const actualTransfer = Math.min(coinsAtStake, loser.coins);
    loser.coins -= actualTransfer;
    winner.coins += actualTransfer;

    this.io.to(game.lobbyId).emit('game:duelResolved', {
      winnerId,
      winnerName: winner.username,
      loserId,
      loserName: loser.username,
      coinsTransferred: actualTransfer,
      resultDetails,
      newWinnerCoins: winner.coins,
      newLoserCoins: loser.coins
    });

    // Clean up
    game.pendingDuel = null;
    if (game.currentMinigame?.type === 'duel') {
      game.currentMinigame.ended = true;
      game.currentMinigame = null;
    }

    // Continue game flow
    this.advancePhase(gameId);
  }

  selectMinigame(game) {
    // Determine minigame type based on landed spaces
    const blueTeam = [];
    const redTeam = [];

    for (const player of game.players) {
      const lastSpace = game.boardData.spaces.find(s => s.id === player.position);
      if (lastSpace?.type === SPACE_TYPE.RED) {
        redTeam.push(player.id);
      } else {
        blueTeam.push(player.id);
      }
    }

    let minigameType = 'ffa'; // free-for-all
    if (blueTeam.length === redTeam.length && blueTeam.length > 0) {
      minigameType = 'team';
    } else if (blueTeam.length === 1 || redTeam.length === 1) {
      minigameType = '1v3';
    }

    // Select random minigame of appropriate type
    const availableMinigames = MINIGAMES.filter(m => 
      m.type === minigameType || m.type === 'ffa'
    );
    const selectedMinigame = availableMinigames[Math.floor(Math.random() * availableMinigames.length)];

    game.currentMinigame = {
      id: selectedMinigame.id,
      data: selectedMinigame,
      type: minigameType,
      teams: minigameType === 'team' ? { blue: blueTeam, red: redTeam } : null,
      scores: {},
      inputs: {},
      startTime: null,
      ended: false
    };

    this.io.to(game.lobbyId).emit('game:minigameSelected', {
      minigame: selectedMinigame,
      type: minigameType,
      teams: game.currentMinigame.teams
    });
  }

  startMinigame(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.currentMinigame) return { success: false };

    game.phase = GAME_PHASE.MINIGAME;
    game.currentMinigame.startTime = Date.now();

    this.io.to(game.lobbyId).emit('game:minigameStarted', {
      minigame: game.currentMinigame.data,
      startTime: game.currentMinigame.startTime
    });

    // Set timeout for minigame end
    const duration = game.currentMinigame.data.duration || 60000;
    setTimeout(() => {
      if (!game.currentMinigame.ended) {
        this.endMinigame(gameId);
      }
    }, duration);

    return { success: true };
  }

  submitMinigameInput(gameId, playerId, input) {
    const game = this.games.get(gameId);
    if (!game || !game.currentMinigame || game.currentMinigame.ended) {
      return { success: false };
    }

    game.currentMinigame.inputs[playerId] = input;

    // Process input based on minigame type
    const minigame = game.currentMinigame.data;
    if (minigame.processInput) {
      const result = this.processMinigameInput(game, playerId, input);
      
      this.io.to(game.lobbyId).emit('game:minigameUpdate', {
        playerId,
        update: result
      });
    }

    return { success: true };
  }

  processMinigameInput(game, playerId, input) {
    const mg = game.currentMinigame;
    
    // Generic scoring based on input type
    if (!mg.scores[playerId]) {
      mg.scores[playerId] = 0;
    }

    if (input.score !== undefined) {
      mg.scores[playerId] = input.score;
    }
    if (input.addScore !== undefined) {
      mg.scores[playerId] += input.addScore;
    }
    if (input.finished) {
      mg.finishTimes = mg.finishTimes || {};
      mg.finishTimes[playerId] = Date.now() - mg.startTime;
    }

    return { scores: mg.scores };
  }

  endMinigame(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.currentMinigame) return;

    game.currentMinigame.ended = true;
    game.phase = GAME_PHASE.MINIGAME_RESULTS;

    // Calculate results
    const mg = game.currentMinigame;
    const results = { winners: [], rewards: {} };

    if (mg.type === 'ffa') {
      // Highest score wins
      let maxScore = -1;
      for (const [playerId, score] of Object.entries(mg.scores)) {
        if (score > maxScore) {
          maxScore = score;
          results.winners = [playerId];
        } else if (score === maxScore) {
          results.winners.push(playerId);
        }
      }

      // Award coins to winner(s)
      const reward = Math.floor(10 / results.winners.length);
      for (const winnerId of results.winners) {
        const player = game.players.find(p => p.id === winnerId);
        if (player) {
          player.coins += reward;
          player.minigamesWon++;
          results.rewards[winnerId] = reward;
        }
      }
    } else if (mg.type === 'team') {
      // Team with higher combined score wins
      const blueScore = mg.teams.blue.reduce((sum, id) => sum + (mg.scores[id] || 0), 0);
      const redScore = mg.teams.red.reduce((sum, id) => sum + (mg.scores[id] || 0), 0);

      const winningTeam = blueScore >= redScore ? mg.teams.blue : mg.teams.red;
      results.winners = winningTeam;

      for (const winnerId of winningTeam) {
        const player = game.players.find(p => p.id === winnerId);
        if (player) {
          player.coins += 10;
          player.minigamesWon++;
          results.rewards[winnerId] = 10;
        }
      }
    }

    game.lastMinigameResults = results;

    // Update stats for human players
    for (const player of game.players) {
      if (!player.isBot) {
        dbHelpers.updateStats(this.db, player.id, {
          minigames_played: 1,
          minigames_won: results.winners.includes(player.id) ? 1 : 0
        });
      }
    }

    this.io.to(game.lobbyId).emit('game:minigameEnded', {
      results,
      game: this.sanitizeGame(game)
    });

    // Clear minigame data
    game.currentMinigame = null;
  }

  endGame(game) {
    // Calculate final standings
    const standings = [...game.players].sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.coins - a.coins;
    });

    // Assign positions
    standings.forEach((player, index) => {
      player.finalPosition = index + 1;
    });

    // Calculate bonus stars if enabled
    const bonusStars = [];
    if (game.settings.bonusStars) {
      // Coin Star - Most coins at end of game
      const richest = [...game.players].sort((a, b) => b.coins - a.coins)[0];
      bonusStars.push({ 
        type: 'coin_star', 
        playerId: richest.id, 
        playerName: richest.username,
        name: '💰 Coin Star',
        description: 'Most coins at game end',
        value: richest.coins
      });
      richest.stars++;

      // Minigame Star - Most minigames won
      const minigameChamp = [...game.players].sort((a, b) => b.minigamesWon - a.minigamesWon)[0];
      if (minigameChamp.minigamesWon > 0) {
        bonusStars.push({ 
          type: 'minigame_star', 
          playerId: minigameChamp.id,
          playerName: minigameChamp.username, 
          name: '🎮 Minigame Star',
          description: 'Most minigames won',
          value: minigameChamp.minigamesWon
        });
        minigameChamp.stars++;
      }

      // Movement Star - Most spaces traveled
      const traveler = [...game.players].sort((a, b) => b.totalMovement - a.totalMovement)[0];
      if (traveler.totalMovement > 0) {
        bonusStars.push({ 
          type: 'movement_star', 
          playerId: traveler.id,
          playerName: traveler.username, 
          name: '🏃 Movement Star',
          description: 'Most spaces traveled',
          value: traveler.totalMovement
        });
        traveler.stars++;
      }

      // Item Star - Most items used
      const itemUser = [...game.players].sort((a, b) => (b.itemsUsed || 0) - (a.itemsUsed || 0))[0];
      if (itemUser.itemsUsed > 0) {
        bonusStars.push({ 
          type: 'item_star', 
          playerId: itemUser.id,
          playerName: itemUser.username, 
          name: '🎁 Item Star',
          description: 'Most items used',
          value: itemUser.itemsUsed
        });
        itemUser.stars++;
      }

      // Lucky Star - Most lucky spaces landed on
      const luckyOne = [...game.players].sort((a, b) => 
        (b.landedSpaces?.lucky || 0) - (a.landedSpaces?.lucky || 0)
      )[0];
      if (luckyOne.landedSpaces?.lucky > 0) {
        bonusStars.push({ 
          type: 'lucky_star', 
          playerId: luckyOne.id,
          playerName: luckyOne.username, 
          name: '🍀 Lucky Star',
          description: 'Most lucky spaces landed',
          value: luckyOne.landedSpaces.lucky
        });
        luckyOne.stars++;
      }

      // Happening Star - Most event spaces landed on
      const eventLander = [...game.players].sort((a, b) => 
        (b.landedSpaces?.event || 0) - (a.landedSpaces?.event || 0)
      )[0];
      if (eventLander.landedSpaces?.event > 0) {
        bonusStars.push({ 
          type: 'happening_star', 
          playerId: eventLander.id,
          playerName: eventLander.username, 
          name: '❓ Happening Star',
          description: 'Most event spaces landed',
          value: eventLander.landedSpaces.event
        });
        eventLander.stars++;
      }

      // Recalculate standings after bonus stars
      standings.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return b.coins - a.coins;
      });
      standings.forEach((player, index) => {
        player.finalPosition = index + 1;
      });
    }

    const winner = standings[0];

    // Calculate credits earned
    const creditsRewards = standings.map((player, index) => {
      let credits = 50; // Base participation
      credits += player.stars * 20;
      credits += Math.floor(player.coins / 5);
      credits += player.minigamesWon * 5;
      if (index === 0) credits += 100; // Winner bonus
      else if (index === 1) credits += 50;
      else if (index === 2) credits += 25;
      return { playerId: player.id, credits };
    });

    // Save to database for human players
    const matchId = game.id;
    this.db.prepare(`
      INSERT INTO match_history (id, board_id, turns, winner_id, ended_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(matchId, game.board, game.maxTurns, winner.isBot ? null : winner.id);

    for (const player of game.players) {
      if (!player.isBot) {
        const reward = creditsRewards.find(r => r.playerId === player.id);
        
        // Save participant data
        this.db.prepare(`
          INSERT INTO match_participants (match_id, user_id, final_position, final_stars, final_coins, credits_earned)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(matchId, player.id, player.finalPosition, player.stars, player.coins, reward?.credits || 0);

        // Award credits
        if (reward) {
          dbHelpers.addCredits(player.id, reward.credits);
        }

        // Update profile stats
        dbHelpers.updateStats(player.id, {
          games_played: 1,
          games_won: player.finalPosition === 1 ? 1 : 0,
          total_stars: player.stars,
          total_coins: player.coins,
          total_distance: player.totalMovement
        });
      }
    }

    const results = {
      standings,
      bonusStars,
      winner: {
        id: winner.id,
        username: winner.username,
        stars: winner.stars,
        coins: winner.coins
      },
      creditsRewards,
      gameDuration: Date.now() - game.startTime
    };

    this.io.to(game.lobbyId).emit('game:ended', results);

    // Clean up
    const lobby = this.lobbyManager.getLobby(game.lobbyId);
    if (lobby) {
      lobby.state = LOBBY_STATE.FINISHED;
    }

    // Schedule game cleanup
    setTimeout(() => {
      this.cleanupGame(game.id);
    }, 60000);

    return results;
  }

  cleanupGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    for (const player of game.players) {
      if (!player.isBot) {
        this.playerToGame.delete(player.id);
      }
    }

    this.games.delete(gameId);
  }

  // Advanced Bot AI
  getBotDifficulty(bot) {
    // Bot difficulty levels: 'easy', 'normal', 'hard'
    return bot.difficulty || 'normal';
  }

  // Calculate distance to star using BFS
  calculateDistanceToStar(game, fromSpaceId) {
    const starLocation = game.starLocation;
    if (fromSpaceId === starLocation) return 0;

    const visited = new Set();
    const queue = [{ spaceId: fromSpaceId, distance: 0 }];
    visited.add(fromSpaceId);

    while (queue.length > 0) {
      const { spaceId, distance } = queue.shift();
      const space = game.boardData.spaces.find(s => s.id === spaceId);
      
      if (!space || !space.connections) continue;

      for (const nextId of space.connections) {
        if (nextId === starLocation) return distance + 1;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ spaceId: nextId, distance: distance + 1 });
        }
      }
    }
    return Infinity; // No path found
  }

  // Evaluate space value for bot decision making
  evaluateSpaceValue(game, spaceId, bot) {
    const space = game.boardData.spaces.find(s => s.id === spaceId);
    if (!space) return 0;

    let value = 0;
    const canAffordStar = bot.coins >= game.starCost;

    switch (space.type) {
      case SPACE_TYPE.BLUE:
        value = 3; // Gain coins
        break;
      case SPACE_TYPE.RED:
        value = -2; // Lose coins
        break;
      case SPACE_TYPE.STAR:
        value = canAffordStar ? 100 : 5; // High priority if can afford
        break;
      case SPACE_TYPE.SHOP:
        value = bot.item ? 0 : 8; // Good if no item
        break;
      case SPACE_TYPE.EVENT:
        value = 5; // Events can be good or bad, neutral-positive
        break;
      case SPACE_TYPE.VS:
        value = bot.coins > 10 ? 2 : -1; // Risk/reward
        break;
      case SPACE_TYPE.OVERSEER:
        value = 10; // Usually beneficial
        break;
    }

    // Bonus for being closer to star
    const distanceToStar = this.calculateDistanceToStar(game, spaceId);
    if (canAffordStar && distanceToStar < Infinity) {
      value += Math.max(0, 20 - distanceToStar);
    }

    return value;
  }

  // Smart item usage decision
  shouldBotUseItem(game, bot) {
    if (!bot.item) return false;

    const item = ITEMS.find(i => i.id === bot.item);
    if (!item) return false;

    const difficulty = this.getBotDifficulty(bot);
    const canAffordStar = bot.coins >= game.starCost;
    const distanceToStar = this.calculateDistanceToStar(game, bot.position);
    const turnsRemaining = game.maxTurns - game.currentTurn;
    const opponents = game.players.filter(p => p.id !== bot.id);

    // Easy bots use items randomly (30% chance)
    if (difficulty === 'easy') {
      return Math.random() < 0.3;
    }

    // Normal and Hard bots make strategic decisions
    switch (item.effect.type) {
      case 'diceModifier':
        // Use double/triple dice when close to star and can afford it
        if (canAffordStar && distanceToStar <= 6) return true;
        // Or in late game to maximize movement
        if (turnsRemaining <= 3) return true;
        if (difficulty === 'hard') {
          return distanceToStar <= item.effect.multiplier * 5;
        }
        return Math.random() < 0.4;

      case 'chooseDice':
        // Custom dice - use when exact movement needed
        if (canAffordStar && distanceToStar <= 10) return true;
        if (turnsRemaining === 1) return true;
        return false;

      case 'stealCoins':
      case 'stealCoinsTargeted':
        // Steal when we need coins for star, or someone has many coins
        const richestOpponent = Math.max(...opponents.map(p => p.coins));
        if (!canAffordStar && richestOpponent >= 15) return true;
        if (turnsRemaining <= 2 && richestOpponent >= 10) return true;
        return difficulty === 'hard' && Math.random() < 0.5;

      case 'swapPosition':
        // Swap when opponent is close to star
        const opponentDistances = opponents.map(p => ({
          player: p,
          distance: this.calculateDistanceToStar(game, p.position)
        }));
        const closestOpponent = opponentDistances.reduce((a, b) => a.distance < b.distance ? a : b);
        if (canAffordStar && closestOpponent.distance < distanceToStar - 3) return true;
        return false;

      case 'starDiscount':
        // Use star coupon only when getting a star
        return false; // Let it apply automatically

      case 'shield':
        // Save shield - don't use proactively
        return false;

      default:
        return Math.random() < 0.3;
    }
  }

  processBotTurn(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const currentPlayer = this.getCurrentPlayer(game);
    if (!currentPlayer.isBot) return;

    const difficulty = this.getBotDifficulty(currentPlayer);
    const thinkTime = difficulty === 'hard' ? 800 : difficulty === 'normal' ? 1200 : 1500;

    // Advanced bot logic based on phase
    setTimeout(() => {
      switch (game.phase) {
        case GAME_PHASE.ITEM_USE:
          // Strategic item usage
          if (this.shouldBotUseItem(game, currentPlayer)) {
            this.useItem(gameId, currentPlayer.id);
          } else {
            this.skipItem(gameId, currentPlayer.id);
          }
          break;

        case GAME_PHASE.DICE_ROLL:
          this.rollDice(gameId, currentPlayer.id);
          break;

        case GAME_PHASE.MOVING:
          this.botMove(game);
          break;
      }
    }, 1000);
  }

  botMove(game) {
    const currentPlayer = this.getCurrentPlayer(game);
    const currentSpace = game.boardData.spaces.find(s => s.id === currentPlayer.position);

    if (!currentSpace.connections || currentSpace.connections.length === 0) {
      game.movesRemaining = 0;
      this.advancePhase(game.id);
      return;
    }

    const difficulty = this.getBotDifficulty(currentPlayer);
    let targetSpace;

    if (currentSpace.connections.length === 1) {
      // Only one option
      targetSpace = currentSpace.connections[0];
    } else {
      // Multiple paths - make strategic choice
      const pathEvaluations = currentSpace.connections.map(nextId => {
        const value = this.evaluateSpaceValue(game, nextId, currentPlayer);
        const distanceToStar = this.calculateDistanceToStar(game, nextId);
        return {
          spaceId: nextId,
          value,
          distanceToStar
        };
      });

      // Sort by value, with some randomness based on difficulty
      pathEvaluations.sort((a, b) => b.value - a.value);

      if (difficulty === 'easy') {
        // Easy bots make random choices 50% of the time
        targetSpace = Math.random() < 0.5 
          ? pathEvaluations[0].spaceId 
          : currentSpace.connections[Math.floor(Math.random() * currentSpace.connections.length)];
      } else if (difficulty === 'normal') {
        // Normal bots usually pick the best, but sometimes make mistakes
        targetSpace = Math.random() < 0.8 
          ? pathEvaluations[0].spaceId 
          : pathEvaluations[Math.floor(Math.random() * pathEvaluations.length)].spaceId;
      } else {
        // Hard bots always pick the best option
        targetSpace = pathEvaluations[0].spaceId;
      }
    }

    this.movePlayer(game.id, currentPlayer.id, targetSpace);

    // Continue moving if moves remain
    if (game.movesRemaining > 0 && game.phase === GAME_PHASE.MOVING) {
      const moveDelay = difficulty === 'hard' ? 300 : 500;
      setTimeout(() => this.botMove(game), moveDelay);
    }
  }

  handleBotMinigame(gameId, botId) {
    const game = this.games.get(gameId);
    if (!game || !game.currentMinigame) return;

    const bot = game.players.find(p => p.id === botId);
    const difficulty = bot ? this.getBotDifficulty(bot) : 'normal';

    // Bot scores based on difficulty
    let baseScore;
    if (difficulty === 'easy') {
      baseScore = Math.floor(Math.random() * 50) + 20; // 20-70
    } else if (difficulty === 'normal') {
      baseScore = Math.floor(Math.random() * 60) + 30; // 30-90
    } else {
      baseScore = Math.floor(Math.random() * 30) + 70; // 70-100
    }

    this.submitMinigameInput(gameId, botId, { score: baseScore });
  }

  sanitizeGame(game) {
    return {
      id: game.id,
      lobbyId: game.lobbyId,
      board: game.board,
      players: game.players.map(p => ({
        id: p.id,
        username: p.username,
        isBot: p.isBot,
        character: p.character,
        coins: p.coins,
        stars: p.stars,
        items: p.items || [],
        position: p.position,
        turnOrder: p.turnOrder,
        minigamesWon: p.minigamesWon,
        totalMovement: p.totalMovement,
        itemsUsed: p.itemsUsed || 0
      })),
      settings: game.settings,
      currentTurn: game.currentTurn,
      maxTurns: game.maxTurns,
      currentPlayerIndex: game.currentPlayerIndex,
      phase: game.phase,
      starLocation: game.starLocation,
      starCost: game.starCost,
      diceResult: game.diceResult,
      movesRemaining: game.movesRemaining,
      currentMinigame: game.currentMinigame ? {
        id: game.currentMinigame.id,
        type: game.currentMinigame.type,
        teams: game.currentMinigame.teams
      } : null
    };
  }
}
