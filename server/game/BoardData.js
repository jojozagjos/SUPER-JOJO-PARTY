// Board data with detailed space configurations
export const BOARDS = [
  {
    id: 'tropical_paradise',
    name: 'Tropical Paradise',
    description: 'A sunny island getaway with beaches, palm trees, and hidden treasures! Watch out for the tide that changes paths!',
    theme: 'tropical',
    difficulty: 'easy',
    preview: '/assets/boards/tropical_paradise/preview.png',
    music: '/assets/music/board_tropical.mp3',
    startSpaceId: 'tp_start',
    specialMechanic: {
      type: 'tide',
      description: 'Every 3 turns, the tide changes and some paths become blocked while others open up!'
    },
    spaces: [
      // Start area
      { id: 'tp_start', type: 'start', name: 'Beach Landing', x: 0, y: 0, z: 0, connections: ['tp_1'], canHaveStar: false },
      
      // Main path - Beach route
      { id: 'tp_1', type: 'blue', name: 'Sandy Shore', x: 2, y: 0, z: 0, connections: ['tp_2', 'tp_1a'], canHaveStar: false },
      { id: 'tp_2', type: 'blue', x: 4, y: 0, z: 0, connections: ['tp_3'], canHaveStar: true },
      { id: 'tp_3', type: 'event', name: 'Coconut Grove', x: 6, y: 0, z: 0, connections: ['tp_4'], canHaveStar: false, events: ['coinGift', 'teleport'] },
      { id: 'tp_4', type: 'red', x: 8, y: 0, z: 0, connections: ['tp_5'], canHaveStar: false },
      { id: 'tp_5', type: 'lucky', name: 'Lucky Lagoon', x: 10, y: 0, z: 0, connections: ['tp_6', 'tp_5a'], canHaveStar: false },
      
      // Upper path - Jungle route
      { id: 'tp_1a', type: 'blue', name: 'Jungle Path', x: 2, y: 0, z: 2, connections: ['tp_2a'], canHaveStar: false },
      { id: 'tp_2a', type: 'shop', name: 'Tiki Shop', x: 4, y: 0, z: 2, connections: ['tp_3a'], canHaveStar: false, shopType: 'item' },
      { id: 'tp_3a', type: 'blue', x: 6, y: 0, z: 2, connections: ['tp_4a'], canHaveStar: true },
      { id: 'tp_4a', type: 'overseer', name: 'Volcano Shrine', x: 8, y: 0, z: 2, connections: ['tp_5'], canHaveStar: false },
      
      // Right side - Waterfall area
      { id: 'tp_5a', type: 'blue', name: 'Waterfall Mist', x: 10, y: 0, z: 2, connections: ['tp_6a'], canHaveStar: false },
      { id: 'tp_6a', type: 'event', x: 12, y: 0, z: 2, connections: ['tp_7a'], canHaveStar: false, events: ['coinSteal', 'shuffle'] },
      { id: 'tp_7a', type: 'blue', x: 14, y: 0, z: 2, connections: ['tp_8'], canHaveStar: true },
      
      // Continue main path
      { id: 'tp_6', type: 'blue', x: 12, y: 0, z: 0, connections: ['tp_7'], canHaveStar: false },
      { id: 'tp_7', type: 'vs', name: 'Arena Cove', x: 14, y: 0, z: 0, connections: ['tp_8'], canHaveStar: false },
      { id: 'tp_8', type: 'blue', x: 16, y: 0, z: 1, connections: ['tp_9'], canHaveStar: true },
      { id: 'tp_9', type: 'red', x: 18, y: 0, z: 1, connections: ['tp_10'], canHaveStar: false },
      { id: 'tp_10', type: 'event', name: 'Treasure Beach', x: 20, y: 0, z: 1, connections: ['tp_11', 'tp_10a'], canHaveStar: false, events: ['coinGift', 'coinSteal'] },
      
      // Lower loop
      { id: 'tp_10a', type: 'blue', x: 20, y: 0, z: -1, connections: ['tp_11a'], canHaveStar: true },
      { id: 'tp_11a', type: 'shop', name: 'Pier Market', x: 18, y: 0, z: -1, connections: ['tp_12a'], canHaveStar: false, shopType: 'lucky' },
      { id: 'tp_12a', type: 'blue', x: 16, y: 0, z: -1, connections: ['tp_13a'], canHaveStar: false },
      { id: 'tp_13a', type: 'red', x: 14, y: 0, z: -1, connections: ['tp_14'], canHaveStar: false },
      
      // Return path
      { id: 'tp_11', type: 'blue', x: 22, y: 0, z: 1, connections: ['tp_12'], canHaveStar: false },
      { id: 'tp_12', type: 'overseer', name: 'Dark Lagoon', x: 22, y: 0, z: 0, connections: ['tp_13'], canHaveStar: false },
      { id: 'tp_13', type: 'blue', x: 22, y: 0, z: -1, connections: ['tp_14'], canHaveStar: true },
      { id: 'tp_14', type: 'event', x: 20, y: 0, z: -2, connections: ['tp_15'], canHaveStar: false, events: ['teleport', 'shuffle'] },
      { id: 'tp_15', type: 'bowser', name: 'Bowser Beach', x: 16, y: 0, z: -2, connections: ['tp_16'], canHaveStar: false },
      { id: 'tp_16', type: 'blue', x: 12, y: 0, z: -2, connections: ['tp_17'], canHaveStar: true },
      { id: 'tp_17', type: 'shop', name: 'Sunset Shop', x: 8, y: 0, z: -2, connections: ['tp_18'], canHaveStar: false, shopType: 'rare' },
      { id: 'tp_18', type: 'blue', x: 4, y: 0, z: -2, connections: ['tp_19'], canHaveStar: false },
      { id: 'tp_19', type: 'vs', name: 'Tide Pool Arena', x: 2, y: 0, z: -1, connections: ['tp_start'], canHaveStar: false }
    ]
  },
  
  {
    id: 'crystal_caves',
    name: 'Crystal Caves',
    description: 'A dazzling underground cavern filled with glowing crystals and mysterious passages. Some crystals grant bonuses!',
    theme: 'cave',
    difficulty: 'medium',
    preview: '/assets/boards/crystal_caves/preview.png',
    music: '/assets/music/board_cave.mp3',
    startSpaceId: 'cc_start',
    specialMechanic: {
      type: 'crystals',
      description: 'Crystal spaces randomly award bonus coins or items when landed on!'
    },
    spaces: [
      { id: 'cc_start', type: 'start', name: 'Cave Entrance', x: 0, y: 0, z: 0, connections: ['cc_1'], canHaveStar: false },
      { id: 'cc_1', type: 'blue', x: 2, y: -1, z: 0, connections: ['cc_2', 'cc_1a'], canHaveStar: false },
      { id: 'cc_2', type: 'blue', name: 'Amethyst Hall', x: 4, y: -1, z: 0, connections: ['cc_3'], canHaveStar: true },
      { id: 'cc_3', type: 'event', x: 6, y: -2, z: 0, connections: ['cc_4'], canHaveStar: false, events: ['coinGift', 'teleport'] },
      { id: 'cc_4', type: 'blue', x: 8, y: -2, z: 0, connections: ['cc_5'], canHaveStar: true },
      { id: 'cc_5', type: 'shop', name: 'Gem Trader', x: 10, y: -2, z: 0, connections: ['cc_6', 'cc_5a'], canHaveStar: false, shopType: 'item' },
      
      // Upper cavern
      { id: 'cc_1a', type: 'blue', name: 'Stalactite Path', x: 2, y: -1, z: 2, connections: ['cc_2a'], canHaveStar: false },
      { id: 'cc_2a', type: 'red', x: 4, y: -2, z: 2, connections: ['cc_3a'], canHaveStar: false },
      { id: 'cc_3a', type: 'blue', x: 6, y: -2, z: 2, connections: ['cc_4a'], canHaveStar: true },
      { id: 'cc_4a', type: 'overseer', name: 'Shadow Grotto', x: 8, y: -3, z: 2, connections: ['cc_5'], canHaveStar: false },
      
      // Deep caves
      { id: 'cc_5a', type: 'lucky', name: 'Lucky Crystal', x: 10, y: -3, z: 2, connections: ['cc_6a'], canHaveStar: false },
      { id: 'cc_6a', type: 'event', x: 12, y: -4, z: 2, connections: ['cc_7a'], canHaveStar: false, events: ['coinSteal', 'shuffle'] },
      { id: 'cc_7a', type: 'blue', x: 14, y: -4, z: 2, connections: ['cc_8'], canHaveStar: true },
      
      { id: 'cc_6', type: 'blue', x: 12, y: -3, z: 0, connections: ['cc_7'], canHaveStar: false },
      { id: 'cc_7', type: 'vs', name: 'Crystal Arena', x: 14, y: -3, z: 0, connections: ['cc_8'], canHaveStar: false },
      { id: 'cc_8', type: 'blue', name: 'Emerald Chamber', x: 16, y: -4, z: 1, connections: ['cc_9'], canHaveStar: true },
      { id: 'cc_9', type: 'red', x: 18, y: -4, z: 1, connections: ['cc_10'], canHaveStar: false },
      { id: 'cc_10', type: 'blue', x: 20, y: -5, z: 1, connections: ['cc_11', 'cc_10a'], canHaveStar: false },
      
      // Underground lake loop
      { id: 'cc_10a', type: 'blue', name: 'Underground Lake', x: 20, y: -5, z: -1, connections: ['cc_11a'], canHaveStar: true },
      { id: 'cc_11a', type: 'event', x: 18, y: -5, z: -1, connections: ['cc_12a'], canHaveStar: false, events: ['coinGift', 'teleport'] },
      { id: 'cc_12a', type: 'blue', x: 16, y: -4, z: -1, connections: ['cc_13a'], canHaveStar: false },
      { id: 'cc_13a', type: 'overseer', name: 'Dark Abyss', x: 14, y: -4, z: -1, connections: ['cc_14'], canHaveStar: false },
      
      { id: 'cc_11', type: 'blue', x: 22, y: -5, z: 1, connections: ['cc_12'], canHaveStar: false },
      { id: 'cc_12', type: 'shop', name: 'Ruby Exchange', x: 22, y: -4, z: 0, connections: ['cc_13'], canHaveStar: false, shopType: 'rare' },
      { id: 'cc_13', type: 'blue', x: 22, y: -3, z: -1, connections: ['cc_14'], canHaveStar: true },
      { id: 'cc_14', type: 'bowser', name: 'Bowser Cavern', x: 20, y: -2, z: -1, connections: ['cc_15'], canHaveStar: false },
      { id: 'cc_15', type: 'event', x: 16, y: -2, z: -1, connections: ['cc_16'], canHaveStar: false, events: ['shuffle', 'coinSteal'] },
      { id: 'cc_16', type: 'blue', x: 12, y: -1, z: -1, connections: ['cc_17'], canHaveStar: true },
      { id: 'cc_17', type: 'red', x: 8, y: -1, z: -1, connections: ['cc_18'], canHaveStar: false },
      { id: 'cc_18', type: 'blue', x: 4, y: 0, z: -1, connections: ['cc_19'], canHaveStar: false },
      { id: 'cc_19', type: 'vs', name: 'Minecart Track', x: 2, y: 0, z: -1, connections: ['cc_start'], canHaveStar: false }
    ]
  },
  
  {
    id: 'haunted_manor',
    name: 'Haunted Manor',
    description: 'A spooky mansion filled with ghosts, traps, and supernatural surprises. Boo! Ghosts can steal your coins!',
    theme: 'haunted',
    difficulty: 'hard',
    preview: '/assets/boards/haunted_manor/preview.png',
    music: '/assets/music/board_haunted.mp3',
    startSpaceId: 'hm_start',
    specialMechanic: {
      type: 'ghosts',
      description: 'Ghost spaces can randomly steal coins from players or swap positions!'
    },
    spaces: [
      { id: 'hm_start', type: 'start', name: 'Manor Gates', x: 0, y: 0, z: 0, connections: ['hm_1'], canHaveStar: false },
      { id: 'hm_1', type: 'blue', name: 'Entrance Hall', x: 2, y: 0, z: 0, connections: ['hm_2', 'hm_1a'], canHaveStar: false },
      { id: 'hm_2', type: 'event', x: 4, y: 0, z: 0, connections: ['hm_3'], canHaveStar: false, events: ['coinSteal', 'shuffle', 'teleport'] },
      { id: 'hm_3', type: 'red', name: 'Cursed Corridor', x: 6, y: 0, z: 0, connections: ['hm_4'], canHaveStar: false },
      { id: 'hm_4', type: 'blue', x: 8, y: 0, z: 0, connections: ['hm_5', 'hm_4a'], canHaveStar: true },
      
      // Upstairs - West Wing
      { id: 'hm_1a', type: 'blue', name: 'Grand Staircase', x: 2, y: 2, z: 2, connections: ['hm_2a'], canHaveStar: false },
      { id: 'hm_2a', type: 'shop', name: 'Ghost Shop', x: 4, y: 2, z: 2, connections: ['hm_3a'], canHaveStar: false, shopType: 'item' },
      { id: 'hm_3a', type: 'blue', x: 6, y: 2, z: 2, connections: ['hm_4a'], canHaveStar: true },
      { id: 'hm_4a', type: 'overseer', name: 'Master Bedroom', x: 8, y: 2, z: 2, connections: ['hm_5'], canHaveStar: false },
      
      { id: 'hm_5', type: 'event', name: 'Library', x: 10, y: 1, z: 1, connections: ['hm_6'], canHaveStar: false, events: ['coinGift', 'teleport'] },
      { id: 'hm_6', type: 'blue', x: 12, y: 1, z: 1, connections: ['hm_7', 'hm_6a'], canHaveStar: true },
      
      // Basement path
      { id: 'hm_6a', type: 'red', name: 'Dungeon Stairs', x: 12, y: -2, z: -1, connections: ['hm_7a'], canHaveStar: false },
      { id: 'hm_7a', type: 'lucky', name: 'Lucky Cellar', x: 14, y: -2, z: -1, connections: ['hm_8a'], canHaveStar: false },
      { id: 'hm_8a', type: 'overseer', name: 'Crypt', x: 16, y: -2, z: -1, connections: ['hm_9a'], canHaveStar: false },
      { id: 'hm_9a', type: 'blue', x: 18, y: -2, z: -1, connections: ['hm_10'], canHaveStar: true },
      
      { id: 'hm_7', type: 'vs', name: 'Ballroom', x: 14, y: 1, z: 1, connections: ['hm_8'], canHaveStar: false },
      { id: 'hm_8', type: 'blue', x: 16, y: 1, z: 1, connections: ['hm_9'], canHaveStar: false },
      { id: 'hm_9', type: 'event', name: 'Séance Room', x: 18, y: 0, z: 1, connections: ['hm_10'], canHaveStar: false, events: ['shuffle', 'coinSteal'] },
      { id: 'hm_10', type: 'blue', x: 20, y: 0, z: 0, connections: ['hm_11', 'hm_10a'], canHaveStar: true },
      
      // Tower path
      { id: 'hm_10a', type: 'blue', name: 'Tower Stairs', x: 20, y: 3, z: 2, connections: ['hm_11a'], canHaveStar: false },
      { id: 'hm_11a', type: 'event', x: 22, y: 4, z: 2, connections: ['hm_12a'], canHaveStar: false, events: ['coinGift', 'teleport'] },
      { id: 'hm_12a', type: 'red', x: 24, y: 3, z: 2, connections: ['hm_13'], canHaveStar: false },
      
      { id: 'hm_11', type: 'shop', name: 'Potion Cellar', x: 22, y: 0, z: 0, connections: ['hm_12'], canHaveStar: false, shopType: 'lucky' },
      { id: 'hm_12', type: 'blue', x: 24, y: 0, z: 0, connections: ['hm_13'], canHaveStar: false },
      { id: 'hm_13', type: 'blue', name: 'Conservatory', x: 24, y: 0, z: -2, connections: ['hm_14'], canHaveStar: true },
      { id: 'hm_14', type: 'red', x: 22, y: 0, z: -2, connections: ['hm_15'], canHaveStar: false },
      { id: 'hm_15', type: 'event', name: 'Graveyard', x: 20, y: 0, z: -2, connections: ['hm_16'], canHaveStar: false, events: ['coinSteal', 'shuffle'] },
      { id: 'hm_16', type: 'bowser', name: 'Bowser Crypt', x: 16, y: 0, z: -2, connections: ['hm_17'], canHaveStar: false },
      { id: 'hm_17', type: 'overseer', name: 'Mausoleum', x: 12, y: 0, z: -2, connections: ['hm_18'], canHaveStar: false },
      { id: 'hm_18', type: 'blue', x: 8, y: 0, z: -2, connections: ['hm_19'], canHaveStar: false },
      { id: 'hm_19', type: 'shop', name: 'Witch\'s Hut', x: 4, y: 0, z: -2, connections: ['hm_20'], canHaveStar: false, shopType: 'rare' },
      { id: 'hm_20', type: 'vs', name: 'Ghost Arena', x: 2, y: 0, z: -1, connections: ['hm_start'], canHaveStar: false }
    ]
  },
  
  {
    id: 'sky_kingdom',
    name: 'Sky Kingdom',
    description: 'A magical realm floating in the clouds with castles, rainbows, and flying platforms. Wind can change your destination!',
    theme: 'sky',
    difficulty: 'expert',
    preview: '/assets/boards/sky_kingdom/preview.png',
    music: '/assets/music/board_sky.mp3',
    startSpaceId: 'sk_start',
    specialMechanic: {
      type: 'wind',
      description: 'Strong winds can blow players forward or backward additional spaces!'
    },
    spaces: [
      { id: 'sk_start', type: 'start', name: 'Cloud Gate', x: 0, y: 10, z: 0, connections: ['sk_1'], canHaveStar: false },
      { id: 'sk_1', type: 'blue', name: 'Rainbow Bridge', x: 2, y: 10, z: 0, connections: ['sk_2', 'sk_1a'], canHaveStar: false },
      { id: 'sk_2', type: 'blue', x: 4, y: 11, z: 0, connections: ['sk_3'], canHaveStar: true },
      { id: 'sk_3', type: 'event', name: 'Wind Temple', x: 6, y: 12, z: 0, connections: ['sk_4'], canHaveStar: false, events: ['teleport', 'shuffle'] },
      { id: 'sk_4', type: 'blue', x: 8, y: 12, z: 0, connections: ['sk_5', 'sk_4a'], canHaveStar: false },
      
      // Upper cloud path
      { id: 'sk_1a', type: 'blue', name: 'Nimbus Path', x: 2, y: 12, z: 2, connections: ['sk_2a'], canHaveStar: false },
      { id: 'sk_2a', type: 'red', x: 4, y: 13, z: 2, connections: ['sk_3a'], canHaveStar: false },
      { id: 'sk_3a', type: 'shop', name: 'Sky Market', x: 6, y: 14, z: 2, connections: ['sk_4a'], canHaveStar: false, shopType: 'rare' },
      { id: 'sk_4a', type: 'blue', x: 8, y: 14, z: 2, connections: ['sk_5'], canHaveStar: true },
      
      { id: 'sk_5', type: 'overseer', name: 'Storm King\'s Throne', x: 10, y: 13, z: 1, connections: ['sk_6'], canHaveStar: false },
      { id: 'sk_6', type: 'blue', x: 12, y: 13, z: 1, connections: ['sk_7', 'sk_6a'], canHaveStar: true },
      
      // Floating castle path
      { id: 'sk_6a', type: 'lucky', name: 'Lucky Cloud', x: 12, y: 15, z: 3, connections: ['sk_7a'], canHaveStar: false },
      { id: 'sk_7a', type: 'event', name: 'Throne Room', x: 14, y: 16, z: 3, connections: ['sk_8a'], canHaveStar: false, events: ['coinGift', 'coinSteal'] },
      { id: 'sk_8a', type: 'blue', x: 16, y: 15, z: 3, connections: ['sk_9a'], canHaveStar: true },
      { id: 'sk_9a', type: 'red', x: 18, y: 14, z: 3, connections: ['sk_10'], canHaveStar: false },
      
      { id: 'sk_7', type: 'vs', name: 'Cloud Colosseum', x: 14, y: 13, z: 1, connections: ['sk_8'], canHaveStar: false },
      { id: 'sk_8', type: 'blue', x: 16, y: 12, z: 1, connections: ['sk_9'], canHaveStar: false },
      { id: 'sk_9', type: 'shop', name: 'Angel Shop', x: 18, y: 12, z: 1, connections: ['sk_10'], canHaveStar: false, shopType: 'item' },
      { id: 'sk_10', type: 'blue', name: 'Starfall Platform', x: 20, y: 11, z: 2, connections: ['sk_11', 'sk_10a'], canHaveStar: true },
      
      // Lower cloud loop
      { id: 'sk_10a', type: 'blue', name: 'Misty Descent', x: 20, y: 8, z: 0, connections: ['sk_11a'], canHaveStar: false },
      { id: 'sk_11a', type: 'event', x: 18, y: 7, z: 0, connections: ['sk_12a'], canHaveStar: false, events: ['shuffle', 'teleport'] },
      { id: 'sk_12a', type: 'overseer', name: 'Thunder Pit', x: 16, y: 6, z: 0, connections: ['sk_13a'], canHaveStar: false },
      { id: 'sk_13a', type: 'blue', x: 14, y: 7, z: 0, connections: ['sk_14'], canHaveStar: true },
      
      { id: 'sk_11', type: 'blue', x: 22, y: 11, z: 2, connections: ['sk_12'], canHaveStar: false },
      { id: 'sk_12', type: 'red', x: 24, y: 10, z: 2, connections: ['sk_13'], canHaveStar: false },
      { id: 'sk_13', type: 'bowser', name: 'Bowser Cloud', x: 24, y: 10, z: 0, connections: ['sk_14'], canHaveStar: false },
      { id: 'sk_14', type: 'event', name: 'Sunset Terrace', x: 22, y: 9, z: -1, connections: ['sk_15'], canHaveStar: false, events: ['coinGift', 'coinSteal'] },
      { id: 'sk_15', type: 'blue', x: 20, y: 9, z: -1, connections: ['sk_16'], canHaveStar: true },
      { id: 'sk_16', type: 'shop', name: 'Cloud Vendor', x: 16, y: 9, z: -1, connections: ['sk_17'], canHaveStar: false, shopType: 'lucky' },
      { id: 'sk_17', type: 'blue', x: 12, y: 10, z: -1, connections: ['sk_18'], canHaveStar: false },
      { id: 'sk_18', type: 'red', x: 8, y: 10, z: -1, connections: ['sk_19'], canHaveStar: false },
      { id: 'sk_19', type: 'event', name: 'Aurora Garden', x: 4, y: 10, z: -1, connections: ['sk_20'], canHaveStar: false, events: ['teleport', 'shuffle'] },
      { id: 'sk_20', type: 'vs', name: 'Sky Arena', x: 2, y: 10, z: -1, connections: ['sk_start'], canHaveStar: false }
    ]
  }
];

// Helper function to get board by ID
export function getBoardById(boardId) {
  return BOARDS.find(b => b.id === boardId);
}

// Helper function to get space by ID on a board
export function getSpaceById(board, spaceId) {
  return board.spaces.find(s => s.id === spaceId);
}

// Helper to get all star-eligible spaces
export function getStarSpaces(board) {
  return board.spaces.filter(s => s.canHaveStar);
}
