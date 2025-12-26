// Minigame data definitions
export const MINIGAMES = [
  // FREE FOR ALL MINIGAMES
  {
    id: 'coin_chaos',
    name: 'Coin Chaos',
    description: 'Collect as many falling coins as you can! Avoid the bombs!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 30000,
    is3D: true,
    controls: {
      movement: 'WASD or Arrow Keys',
      action: 'None'
    },
    rules: [
      'Move around the arena to collect coins',
      'Gold coins are worth 1 point, silver coins are worth 3',
      'Avoid bombs - they stun you for 2 seconds',
      'Player with most coins wins!'
    ],
    preview: '/assets/minigames/coin_chaos/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },
  {
    id: 'platform_peril',
    name: 'Platform Peril',
    description: 'Be the last one standing on the shrinking platforms!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 60000,
    is3D: true,
    controls: {
      movement: 'WASD or Arrow Keys',
      action: 'Space to Jump'
    },
    rules: [
      'Stay on the platforms as they shrink',
      'Push other players off by running into them',
      'Falling off eliminates you',
      'Last player standing wins!'
    ],
    preview: '/assets/minigames/platform_peril/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  },
  {
    id: 'rhythm_rally',
    name: 'Rhythm Rally',
    description: 'Hit the notes in time with the music!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'None',
      action: 'Arrow Keys to hit notes'
    },
    rules: [
      'Notes fall from the top of the screen',
      'Press the matching arrow key when notes reach the target',
      'Perfect timing gives bonus points',
      'Highest score wins!'
    ],
    preview: '/assets/minigames/rhythm_rally/preview.png',
    music: '/assets/music/minigame_rhythm.mp3'
  },
  {
    id: 'memory_match',
    name: 'Memory Match',
    description: 'Find all the matching pairs before time runs out!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 60000,
    is3D: true,
    controls: {
      movement: 'Mouse or Arrow Keys',
      action: 'Click or Space to flip'
    },
    rules: [
      'Flip cards to find matching pairs',
      'Each pair found awards points',
      'Wrong matches cost time',
      'Most pairs found wins!'
    ],
    preview: '/assets/minigames/memory_match/preview.png',
    music: '/assets/music/minigame_puzzle.mp3'
  },
  {
    id: 'bumper_balls',
    name: 'Bumper Balls',
    description: 'Knock opponents off the floating island!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'WASD or Arrow Keys',
      action: 'Space to dash'
    },
    rules: [
      'Push other players off the platform',
      'Use dash for powerful pushes',
      'Dash has a 3 second cooldown',
      'Last player on the platform wins!'
    ],
    preview: '/assets/minigames/bumper_balls/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },
  {
    id: 'hot_potato',
    name: 'Hot Potato',
    description: 'Pass the bomb before it explodes!',
    type: 'ffa',
    playerCount: [3, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'WASD to move',
      action: 'Space to throw potato'
    },
    rules: [
      'One player starts with the hot potato',
      'Run into others to pass it',
      'Or throw it at nearby players',
      'Holding it when timer hits zero eliminates you!'
    ],
    preview: '/assets/minigames/hot_potato/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  },
  {
    id: 'speed_typing',
    name: 'Speed Typing',
    description: 'Type the words as fast as you can!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 30000,
    is3D: true,
    controls: {
      movement: 'None',
      action: 'Type shown words'
    },
    rules: [
      'Words appear on screen',
      'Type them correctly to score',
      'Faster typing = more points',
      'Most words typed wins!'
    ],
    preview: '/assets/minigames/speed_typing/preview.png',
    music: '/assets/music/minigame_puzzle.mp3'
  },
  {
    id: 'treasure_dive',
    name: 'Treasure Dive',
    description: 'Dive deep and collect treasures from the ocean floor!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'WASD to swim',
      action: 'Space to grab treasure'
    },
    rules: [
      'Swim down to collect treasures',
      'Watch your air meter!',
      'Surface to refill air',
      'Most treasure value wins!'
    ],
    preview: '/assets/minigames/treasure_dive/preview.png',
    music: '/assets/music/minigame_calm.mp3'
  },
  {
    id: 'reaction_race',
    name: 'Reaction Race',
    description: 'React fastest when the light turns green!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 30000,
    is3D: true,
    controls: {
      movement: 'None',
      action: 'Space when light turns green'
    },
    rules: [
      'Wait for the light to turn green',
      'Press space as fast as you can',
      'False starts add penalty time',
      'Best average reaction time wins!'
    ],
    preview: '/assets/minigames/reaction_race/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  },
  {
    id: 'maze_runner',
    name: 'Maze Runner',
    description: 'Navigate the maze and reach the goal first!',
    type: 'ffa',
    playerCount: [2, 20],
    duration: 60000,
    is3D: true,
    controls: {
      movement: 'WASD or Arrow Keys',
      action: 'None'
    },
    rules: [
      'Find your way through the maze',
      'First to reach the goal wins',
      'Collect bonus coins along the way',
      'Wrong turns waste time!'
    ],
    preview: '/assets/minigames/maze_runner/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },

  // TEAM MINIGAMES
  {
    id: 'tug_of_war',
    name: 'Tug of War',
    description: 'Pull your opponents into the pit!',
    type: 'team',
    playerCount: [4, 20],
    duration: 30000,
    is3D: true,
    controls: {
      movement: 'None',
      action: 'Mash A/D or Left/Right'
    },
    rules: [
      'Teams pull on opposite sides',
      'Mash keys to pull harder',
      'Team coordination matters!',
      'Pull opponents into the pit to win!'
    ],
    preview: '/assets/minigames/tug_of_war/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },
  {
    id: 'relay_race',
    name: 'Relay Race',
    description: 'Pass the baton and race to victory!',
    type: 'team',
    playerCount: [4, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'WASD to run',
      action: 'Space to pass baton'
    },
    rules: [
      'Each team member runs a leg',
      'Pass baton at exchange zones',
      'Bad passes lose time',
      'First team to finish wins!'
    ],
    preview: '/assets/minigames/relay_race/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },
  {
    id: 'castle_defense',
    name: 'Castle Defense',
    description: 'Defend your castle from the attacking team!',
    type: 'team',
    playerCount: [4, 20],
    duration: 60000,
    is3D: true,
    controls: {
      movement: 'WASD to move',
      action: 'Space to throw/block'
    },
    rules: [
      'One team attacks, one defends',
      'Attackers throw balls at castle',
      'Defenders block and rebuild',
      'Most castle HP remaining wins!'
    ],
    preview: '/assets/minigames/castle_defense/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  },
  {
    id: 'balloon_burst',
    name: 'Balloon Burst',
    description: 'Pop the other team\'s balloons!',
    type: 'team',
    playerCount: [4, 20],
    duration: 45000,
    is3D: true,
    controls: {
      movement: 'WASD to move',
      action: 'Space to throw dart'
    },
    rules: [
      'Each team has balloons to protect',
      'Throw darts at enemy balloons',
      'Protect your own!',
      'Team with most balloons wins!'
    ],
    preview: '/assets/minigames/balloon_burst/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },

  // 1 VS 3 MINIGAMES
  {
    id: 'spotlight_escape',
    name: 'Spotlight Escape',
    description: 'One player controls the spotlight, three try to escape!',
    type: '1v3',
    playerCount: [4, 4],
    duration: 45000,
    is3D: true,
    controls: {
      solo: 'Mouse to aim spotlight',
      team: 'WASD to run and hide'
    },
    rules: [
      'Solo player controls the spotlight',
      'Team players must avoid the light',
      'Getting caught eliminates you',
      'Survive the time limit to win!'
    ],
    preview: '/assets/minigames/spotlight_escape/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  },
  {
    id: 'giant_stomp',
    name: 'Giant Stomp',
    description: 'One giant player tries to stomp the others!',
    type: '1v3',
    playerCount: [4, 4],
    duration: 45000,
    is3D: true,
    controls: {
      solo: 'WASD to walk, Space to stomp',
      team: 'WASD to run and dodge'
    },
    rules: [
      'Giant player stomps around',
      'Small players dodge the feet',
      'Getting stomped eliminates you',
      'Giant wins by stomping all!'
    ],
    preview: '/assets/minigames/giant_stomp/preview.png',
    music: '/assets/music/minigame_action.mp3'
  },
  {
    id: 'cannon_dodge',
    name: 'Cannon Dodge',
    description: 'One player fires cannons at the dodging team!',
    type: '1v3',
    playerCount: [4, 4],
    duration: 30000,
    is3D: true,
    controls: {
      solo: 'Mouse to aim, Click to fire',
      team: 'WASD to dodge'
    },
    rules: [
      'Cannon player aims and fires',
      'Team players must dodge',
      'Getting hit eliminates you',
      'Cannon wins by hitting all!'
    ],
    preview: '/assets/minigames/cannon_dodge/preview.png',
    music: '/assets/music/minigame_tense.mp3'
  }
];

// Get minigame by ID
export function getMinigameById(minigameId) {
  return MINIGAMES.find(m => m.id === minigameId);
}

// Get minigames by type
export function getMinigamesByType(type) {
  return MINIGAMES.filter(m => m.type === type);
}

// Get random minigame of type
export function getRandomMinigame(type = null, playerCount = 4) {
  let available = MINIGAMES;
  
  if (type) {
    available = available.filter(m => m.type === type);
  }
  
  available = available.filter(m => 
    playerCount >= m.playerCount[0] && playerCount <= m.playerCount[1]
  );
  
  if (available.length === 0) {
    available = MINIGAMES.filter(m => m.type === 'ffa');
  }
  
  return available[Math.floor(Math.random() * available.length)];
}
