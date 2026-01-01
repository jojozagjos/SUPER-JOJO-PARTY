import { v4 as uuidv4 } from 'uuid';
import { BOARDS } from './BoardData.js';

// Lobby states
export const LOBBY_STATE = {
  WAITING: 'waiting',
  VOTING: 'voting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

export class LobbyManager {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.lobbies = new Map();
    this.playerToLobby = new Map();
    this.joinCodes = new Map();
  }

  createLobby(hostId, hostUsername, options = {}) {
    const lobbyId = uuidv4();
    const joinCode = this.generateJoinCode();

    const lobby = {
      id: lobbyId,
      name: options.name || `${hostUsername}'s Party`,
      hostId,
      isPublic: options.isPublic !== false,
      joinCode,
      state: LOBBY_STATE.WAITING,
      players: [{
        id: hostId,
        username: hostUsername,
        isHost: true,
        isBot: false,
        isReady: false,
        character: options.character || 'jojo',
        slot: 0
      }],
      bots: [],
      settings: {
        turns: options.turns || 15,
        startingCoins: options.startingCoins || 10,
        bonusStars: options.bonusStars !== false,
        cpuDifficulty: options.cpuDifficulty || 'normal', // easy, normal, hard
        minigamePackType: options.minigamePackType || 'all', // all, family, action
        maxPlayers: Math.min(Math.max(options.maxPlayers || 20, 4), 20), // Clamp between 4-20
        disabledMinigames: options.disabledMinigames || [] // List of disabled minigame IDs
      },
      votes: {
        board: {},
        tutorial: {}
      },
      selectedBoard: null,
      createdAt: Date.now()
    };

    this.lobbies.set(lobbyId, lobby);
    this.joinCodes.set(joinCode, lobbyId);
    this.playerToLobby.set(hostId, lobbyId);

    return lobby;
  }

  generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.joinCodes.has(code));
    return code;
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  getLobbyByCode(code) {
    const lobbyId = this.joinCodes.get(code.toUpperCase());
    return lobbyId ? this.lobbies.get(lobbyId) : null;
  }

  getPlayerLobby(playerId) {
    const lobbyId = this.playerToLobby.get(playerId);
    return lobbyId ? this.lobbies.get(lobbyId) : null;
  }

  joinLobby(lobbyId, playerId, username, character = 'jojo') {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false, error: 'Lobby not found' };
    if (lobby.state !== LOBBY_STATE.WAITING) return { success: false, error: 'Game already started' };
    if (lobby.players.length + lobby.bots.length >= lobby.settings.maxPlayers) {
      return { success: false, error: 'Lobby is full' };
    }

    // Check if player already in a lobby
    const currentLobby = this.getPlayerLobby(playerId);
    if (currentLobby) {
      this.leaveLobby(playerId);
    }

    // Find available slot
    const usedSlots = new Set([...lobby.players.map(p => p.slot), ...lobby.bots.map(b => b.slot)]);
    let slot = 0;
    while (usedSlots.has(slot)) slot++;

    lobby.players.push({
      id: playerId,
      username,
      isHost: false,
      isBot: false,
      isReady: false,
      character,
      slot
    });

    this.playerToLobby.set(playerId, lobbyId);

    // Notify all players in lobby
    this.io.to(lobbyId).emit('lobby:playerJoined', {
      player: lobby.players[lobby.players.length - 1],
      lobby: this.sanitizeLobby(lobby)
    });

    return { success: true, lobby: this.sanitizeLobby(lobby) };
  }

  leaveLobby(playerId) {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) return;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const wasHost = lobby.players[playerIndex].isHost;
    lobby.players.splice(playerIndex, 1);
    this.playerToLobby.delete(playerId);

    // If host left, assign new host or close lobby
    if (wasHost && lobby.players.length > 0) {
      lobby.players[0].isHost = true;
      lobby.hostId = lobby.players[0].id;
    }

    // If lobby is empty, delete it
    if (lobby.players.length === 0) {
      this.deleteLobby(lobbyId);
      return;
    }

    // Notify remaining players
    this.io.to(lobbyId).emit('lobby:playerLeft', {
      playerId,
      newHostId: lobby.hostId,
      lobby: this.sanitizeLobby(lobby)
    });
  }

  deleteLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    // Remove all player mappings
    for (const player of lobby.players) {
      this.playerToLobby.delete(player.id);
    }

    this.joinCodes.delete(lobby.joinCode);
    this.lobbies.delete(lobbyId);
  }

  addBot(lobbyId, hostId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return { success: false };
    if (lobby.players.length + lobby.bots.length >= lobby.settings.maxPlayers) {
      return { success: false, error: 'Lobby is full' };
    }

    const botNames = ['Buddy', 'Rival', 'Ace', 'Champ', 'Duke', 
                      'Max', 'Star', 'Vic', 'Ally', 'Titan'];
    const characters = ['jojo', 'mimi'];

    // Find available slot
    const usedSlots = new Set([...lobby.players.map(p => p.slot), ...lobby.bots.map(b => b.slot)]);
    let slot = 0;
    while (usedSlots.has(slot)) slot++;

    const usedNames = new Set(lobby.bots.map(b => b.username.replace(' (Bot)', '')));
    let botName = botNames.find(n => !usedNames.has(n)) || `Bot${lobby.bots.length + 1}`;

    const bot = {
      id: `bot_${uuidv4()}`,
      username: `${botName} (Bot)`,
      isHost: false,
      isBot: true,
      isReady: true,
      character: characters[Math.floor(Math.random() * characters.length)],
      slot,
      difficulty: 'normal'
    };

    lobby.bots.push(bot);

    this.io.to(lobbyId).emit('lobby:botAdded', {
      bot,
      lobby: this.sanitizeLobby(lobby)
    });

    return { success: true, bot };
  }

  removeBot(lobbyId, botId, hostId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return { success: false };

    const botIndex = lobby.bots.findIndex(b => b.id === botId);
    if (botIndex === -1) return { success: false };

    lobby.bots.splice(botIndex, 1);

    this.io.to(lobbyId).emit('lobby:botRemoved', {
      botId,
      lobby: this.sanitizeLobby(lobby)
    });

    return { success: true };
  }

  updateBot(lobbyId, botId, hostId, { name, difficulty }) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return { success: false };

    const bot = lobby.bots.find(b => b.id === botId);
    if (!bot) return { success: false };

    // Update bot name (always append (Bot) suffix)
    if (name !== undefined) {
      // Clean the name and ensure it ends with (Bot)
      let cleanName = name.replace(/\s*\(Bot\)\s*$/i, '').trim();
      if (cleanName.length > 15) cleanName = cleanName.substring(0, 15);
      if (cleanName.length < 1) cleanName = 'Bot';
      bot.username = `${cleanName} (Bot)`;
    }

    // Update difficulty
    if (difficulty !== undefined) {
      const validDifficulties = ['easy', 'normal', 'hard', 'master'];
      if (validDifficulties.includes(difficulty)) {
        bot.difficulty = difficulty;
      }
    }

    this.io.to(lobbyId).emit('lobby:botUpdated', {
      bot,
      lobby: this.sanitizeLobby(lobby)
    });

    return { success: true, bot };
  }

  updateSettings(lobbyId, hostId, settings) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return { success: false };
    if (lobby.state !== LOBBY_STATE.WAITING) return { success: false };

    // Validate and update settings - Mario Party Jamboree style
    if (settings.turns !== undefined) {
      // Turns: 10, 12, 15, 20, 25, 30
      const validTurns = [10, 12, 15, 20, 25, 30];
      const turns = parseInt(settings.turns);
      lobby.settings.turns = validTurns.includes(turns) ? turns : 15;
    }
    if (settings.startingCoins !== undefined) {
      lobby.settings.startingCoins = Math.max(0, Math.min(50, parseInt(settings.startingCoins)));
    }
    if (settings.bonusStars !== undefined) {
      lobby.settings.bonusStars = Boolean(settings.bonusStars);
    }
    if (settings.cpuDifficulty !== undefined) {
      const validDifficulties = ['easy', 'normal', 'hard', 'master'];
      lobby.settings.cpuDifficulty = validDifficulties.includes(settings.cpuDifficulty) ? settings.cpuDifficulty : 'normal';
    }
    if (settings.minigamePackType !== undefined) {
      const validPacks = ['all', 'family', 'action'];
      lobby.settings.minigamePackType = validPacks.includes(settings.minigamePackType) ? settings.minigamePackType : 'all';
    }
    if (settings.name !== undefined) {
      lobby.name = settings.name.slice(0, 30);
    }
    if (settings.isPublic !== undefined) {
      lobby.isPublic = Boolean(settings.isPublic);
    }

    this.io.to(lobbyId).emit('lobby:settingsUpdated', {
      settings: lobby.settings,
      name: lobby.name,
      isPublic: lobby.isPublic
    });

    return { success: true };
  }

  setPlayerReady(lobbyId, playerId, isReady) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false };

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    player.isReady = isReady;
    player.ready = isReady; // Also set ready for compatibility

    this.io.to(lobbyId).emit('lobby:readyUpdated', {
      playerId,
      ready: isReady,
      isReady,
      lobby: this.sanitizeLobby(lobby)
    });

    return { success: true };
  }

  setPlayerCharacter(lobbyId, playerId, character) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false };

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    player.character = character;

    this.io.to(lobbyId).emit('lobby:playerCharacter', {
      playerId,
      character
    });

    return { success: true };
  }

  canStartGame(lobby) {
    const totalPlayers = lobby.players.length + lobby.bots.length;
    if (totalPlayers < 2) return false;
    
    // All human players must be ready
    return lobby.players.every(p => p.isHost || p.isReady);
  }

  startVoting(lobbyId, hostId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return { success: false };
    if (!this.canStartGame(lobby)) return { success: false, error: 'Not all players ready' };

    lobby.state = LOBBY_STATE.VOTING;
    lobby.votes = { board: {}, tutorial: {} };
    lobby.boardVoteFinalized = false;
    if (lobby.votingTimeout) {
      clearTimeout(lobby.votingTimeout);
      lobby.votingTimeout = null;
    }

    // Build voting options from BOARDS, excluding any disabled boards in settings
    const disabled = new Set(lobby.settings.disabledMinigames || []);
    const candidates = BOARDS.filter(b => !disabled.has(b.id));

    // Shuffle candidates and pick up to 4 options
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const picked = candidates.slice(0, Math.min(4, candidates.length));

    const options = picked.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.preview || null
    }));

    // Keep the current voting options so we can resolve fallback winners if no one votes
    lobby.currentVotingOptions = options.map(o => o.id);

    const duration = 30;

    const votingPayload = {
      title: 'Vote!',
      subtitle: 'Select a board',
      options,
      duration,
      lobby: this.sanitizeLobby(lobby)
    };

    this.io.to(lobbyId).emit('lobby:votingStarted', votingPayload);

    // Fallback: if not everyone votes, tally automatically when the timer expires
    lobby.votingTimeout = setTimeout(() => {
      this.tallyBoardVotes(lobby);
    }, duration * 1000);

    return { success: true };
  }

  submitBoardVote(lobbyId, playerId, boardId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.state !== LOBBY_STATE.VOTING) return { success: false };
    if (lobby.boardVoteFinalized) return { success: true };

    lobby.votes.board[playerId] = boardId;

    // Add bot votes randomly
    for (const bot of lobby.bots) {
      if (!lobby.votes.board[bot.id]) {
        const boards = ['tropical_paradise', 'crystal_caves', 'haunted_manor', 'sky_kingdom'];
        lobby.votes.board[bot.id] = boards[Math.floor(Math.random() * boards.length)];
      }
    }

    this.io.to(lobbyId).emit('lobby:boardVote', {
      votes: lobby.votes.board,
      voterId: playerId
    });

    // Check if all votes are in
    const totalVoters = lobby.players.length + lobby.bots.length;
    if (Object.keys(lobby.votes.board).length >= totalVoters) {
      if (lobby.votingTimeout) {
        clearTimeout(lobby.votingTimeout);
        lobby.votingTimeout = null;
      }
      this.tallyBoardVotes(lobby);
    }

    return { success: true };
  }

  tallyBoardVotes(lobby) {
    if (!lobby || lobby.state !== LOBBY_STATE.VOTING) return;
    if (lobby.boardVoteFinalized) return;
    lobby.boardVoteFinalized = true;

    if (lobby.votingTimeout) {
      clearTimeout(lobby.votingTimeout);
      lobby.votingTimeout = null;
    }

    const voteCounts = {};
    for (const boardId of Object.values(lobby.votes.board)) {
      voteCounts[boardId] = (voteCounts[boardId] || 0) + 1;
    }

    // If nobody voted (possible if everyone timed out), pick a random option
    if (Object.keys(voteCounts).length === 0) {
      const fallback = lobby.currentVotingOptions?.length
        ? lobby.currentVotingOptions[Math.floor(Math.random() * lobby.currentVotingOptions.length)]
        : 'tropical_paradise';
      voteCounts[fallback] = 1;
    }

    // Find winner(s)
    const maxVotes = Math.max(...Object.values(voteCounts));
    const winners = Object.keys(voteCounts).filter(b => voteCounts[b] === maxVotes);

    // Random tiebreaker
    lobby.selectedBoard = winners[Math.floor(Math.random() * winners.length)];

    this.io.to(lobby.id).emit('lobby:boardSelected', {
      board: lobby.selectedBoard,
      votes: voteCounts
    });
  }

  submitTutorialVote(lobbyId, playerId, wantsTutorial) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.state !== LOBBY_STATE.VOTING) return { success: false };

    lobby.votes.tutorial[playerId] = wantsTutorial;

    // Add bot votes (bots vote no)
    for (const bot of lobby.bots) {
      if (lobby.votes.tutorial[bot.id] === undefined) {
        lobby.votes.tutorial[bot.id] = false;
      }
    }

    const totalVoters = lobby.players.length + lobby.bots.length;
    if (Object.keys(lobby.votes.tutorial).length >= totalVoters) {
      this.tallyTutorialVotes(lobby);
    }

    return { success: true };
  }

  tallyTutorialVotes(lobby) {
    const yesVotes = Object.values(lobby.votes.tutorial).filter(v => v).length;
    const showTutorial = yesVotes > (lobby.players.length + lobby.bots.length) / 2;

    this.io.to(lobby.id).emit('lobby:tutorialDecided', {
      showTutorial
    });

    return showTutorial;
  }

  getPublicLobbies() {
    const publicLobbies = [];
    for (const lobby of this.lobbies.values()) {
      if (lobby.isPublic && lobby.state === LOBBY_STATE.WAITING) {
        publicLobbies.push(this.sanitizeLobby(lobby));
      }
    }
    return publicLobbies;
  }

  findQuickMatch() {
    // Find a suitable public lobby
    for (const lobby of this.lobbies.values()) {
      if (lobby.isPublic && 
          lobby.state === LOBBY_STATE.WAITING &&
          lobby.players.length + lobby.bots.length < lobby.settings.maxPlayers) {
        return lobby.id;
      }
    }
    return null;
  }

  sanitizeLobby(lobby) {
    const host = lobby.players.find(p => p.id === lobby.hostId);
    return {
      id: lobby.id,
      name: lobby.name,
      hostId: lobby.hostId,
      host: host?.username || 'Unknown',
      isPublic: lobby.isPublic,
      joinCode: lobby.joinCode,
      state: lobby.state,
      players: lobby.players,
      bots: lobby.bots,
      settings: lobby.settings,
      selectedBoard: lobby.selectedBoard,
      playerCount: lobby.players.length + lobby.bots.length,
      maxPlayers: lobby.settings.maxPlayers
    };
  }
}
