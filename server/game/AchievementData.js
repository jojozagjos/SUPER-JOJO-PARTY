/**
 * Super JoJo Party - Achievement Data
 * Defines all achievements players can unlock
 */

export const Achievements = {
  // Getting Started
  first_game: {
    id: 'first_game',
    name: 'Welcome to the Party!',
    description: 'Complete your first game',
    icon: '🎉',
    category: 'getting_started',
    target: 1,
    reward: { credits: 50 },
    rarity: 'common'
  },
  first_win: {
    id: 'first_win',
    name: 'Victory Royale',
    description: 'Win your first game',
    icon: '🏆',
    category: 'getting_started',
    target: 1,
    reward: { credits: 100 },
    rarity: 'common'
  },
  first_star: {
    id: 'first_star',
    name: 'Starry Eyed',
    description: 'Collect your first star',
    icon: '⭐',
    category: 'getting_started',
    target: 1,
    reward: { credits: 25 },
    rarity: 'common'
  },
  first_minigame: {
    id: 'first_minigame',
    name: 'Game On!',
    description: 'Win your first minigame',
    icon: '🎮',
    category: 'getting_started',
    target: 1,
    reward: { credits: 25 },
    rarity: 'common'
  },

  // Game Completion
  games_10: {
    id: 'games_10',
    name: 'Party Regular',
    description: 'Complete 10 games',
    icon: '🎊',
    category: 'completion',
    target: 10,
    reward: { credits: 100 },
    rarity: 'common'
  },
  games_50: {
    id: 'games_50',
    name: 'Party Animal',
    description: 'Complete 50 games',
    icon: '🦁',
    category: 'completion',
    target: 50,
    reward: { credits: 300 },
    rarity: 'uncommon'
  },
  games_100: {
    id: 'games_100',
    name: 'Party Legend',
    description: 'Complete 100 games',
    icon: '👑',
    category: 'completion',
    target: 100,
    reward: { credits: 500 },
    rarity: 'rare'
  },
  games_500: {
    id: 'games_500',
    name: 'Party Master',
    description: 'Complete 500 games',
    icon: '🌟',
    category: 'completion',
    target: 500,
    reward: { credits: 1000 },
    rarity: 'epic'
  },

  // Wins
  wins_5: {
    id: 'wins_5',
    name: 'Rising Star',
    description: 'Win 5 games',
    icon: '🌠',
    category: 'wins',
    target: 5,
    reward: { credits: 150 },
    rarity: 'common'
  },
  wins_25: {
    id: 'wins_25',
    name: 'Champion',
    description: 'Win 25 games',
    icon: '🏅',
    category: 'wins',
    target: 25,
    reward: { credits: 400 },
    rarity: 'uncommon'
  },
  wins_50: {
    id: 'wins_50',
    name: 'Superstar',
    description: 'Win 50 games',
    icon: '💫',
    category: 'wins',
    target: 50,
    reward: { credits: 750 },
    rarity: 'rare'
  },
  wins_100: {
    id: 'wins_100',
    name: 'Party God',
    description: 'Win 100 games',
    icon: '⚡',
    category: 'wins',
    target: 100,
    reward: { credits: 1500 },
    rarity: 'legendary'
  },

  // Stars
  stars_10: {
    id: 'stars_10',
    name: 'Star Collector',
    description: 'Collect 10 total stars',
    icon: '✨',
    category: 'stars',
    target: 10,
    reward: { credits: 75 },
    rarity: 'common'
  },
  stars_50: {
    id: 'stars_50',
    name: 'Star Hunter',
    description: 'Collect 50 total stars',
    icon: '🌟',
    category: 'stars',
    target: 50,
    reward: { credits: 200 },
    rarity: 'uncommon'
  },
  stars_100: {
    id: 'stars_100',
    name: 'Constellation',
    description: 'Collect 100 total stars',
    icon: '🌌',
    category: 'stars',
    target: 100,
    reward: { credits: 500 },
    rarity: 'rare'
  },
  stars_500: {
    id: 'stars_500',
    name: 'Galaxy',
    description: 'Collect 500 total stars',
    icon: '🪐',
    category: 'stars',
    target: 500,
    reward: { credits: 1000 },
    rarity: 'epic'
  },

  // Coins
  coins_100: {
    id: 'coins_100',
    name: 'Penny Saver',
    description: 'Collect 100 total coins',
    icon: '💰',
    category: 'coins',
    target: 100,
    reward: { credits: 50 },
    rarity: 'common'
  },
  coins_1000: {
    id: 'coins_1000',
    name: 'Coin Collector',
    description: 'Collect 1,000 total coins',
    icon: '💵',
    category: 'coins',
    target: 1000,
    reward: { credits: 150 },
    rarity: 'uncommon'
  },
  coins_10000: {
    id: 'coins_10000',
    name: 'Gold Digger',
    description: 'Collect 10,000 total coins',
    icon: '🏦',
    category: 'coins',
    target: 10000,
    reward: { credits: 400 },
    rarity: 'rare'
  },
  coins_100000: {
    id: 'coins_100000',
    name: 'Midas Touch',
    description: 'Collect 100,000 total coins',
    icon: '👑',
    category: 'coins',
    target: 100000,
    reward: { credits: 1000 },
    rarity: 'legendary'
  },

  // Minigames
  minigames_10: {
    id: 'minigames_10',
    name: 'Minigame Rookie',
    description: 'Win 10 minigames',
    icon: '🎯',
    category: 'minigames',
    target: 10,
    reward: { credits: 75 },
    rarity: 'common'
  },
  minigames_50: {
    id: 'minigames_50',
    name: 'Minigame Pro',
    description: 'Win 50 minigames',
    icon: '🎪',
    category: 'minigames',
    target: 50,
    reward: { credits: 200 },
    rarity: 'uncommon'
  },
  minigames_100: {
    id: 'minigames_100',
    name: 'Minigame Expert',
    description: 'Win 100 minigames',
    icon: '🎨',
    category: 'minigames',
    target: 100,
    reward: { credits: 400 },
    rarity: 'rare'
  },
  minigames_500: {
    id: 'minigames_500',
    name: 'Minigame Master',
    description: 'Win 500 minigames',
    icon: '🏆',
    category: 'minigames',
    target: 500,
    reward: { credits: 1000 },
    rarity: 'epic'
  },

  // Overseer (Board Special)
  overseer_first: {
    id: 'overseer_first',
    name: 'Mysterious Encounter',
    description: 'Meet The Overseer for the first time',
    icon: '👁️',
    category: 'overseer',
    target: 1,
    reward: { credits: 100 },
    rarity: 'uncommon'
  },
  overseer_10: {
    id: 'overseer_10',
    name: 'Frequent Visitor',
    description: 'Encounter The Overseer 10 times',
    icon: '🔮',
    category: 'overseer',
    target: 10,
    reward: { credits: 250 },
    rarity: 'rare'
  },
  overseer_win_5: {
    id: 'overseer_win_5',
    name: 'Overseer\'s Favorite',
    description: 'Win 5 Overseer challenges',
    icon: '🌀',
    category: 'overseer',
    target: 5,
    reward: { credits: 500 },
    rarity: 'epic'
  },

  // Social
  play_with_friends: {
    id: 'play_with_friends',
    name: 'Better Together',
    description: 'Play a game with 4 human players',
    icon: '🤝',
    category: 'social',
    target: 1,
    reward: { credits: 100 },
    rarity: 'uncommon'
  },
  host_10: {
    id: 'host_10',
    name: 'Party Host',
    description: 'Host 10 games',
    icon: '🎈',
    category: 'social',
    target: 10,
    reward: { credits: 150 },
    rarity: 'uncommon'
  },

  // Special/Hidden
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win a game after being in last place on the final turn',
    icon: '👑',
    category: 'special',
    target: 1,
    reward: { credits: 300 },
    rarity: 'rare',
    hidden: true
  },
  perfect_minigame: {
    id: 'perfect_minigame',
    name: 'Flawless Victory',
    description: 'Complete a minigame with a perfect score',
    icon: '💯',
    category: 'special',
    target: 1,
    reward: { credits: 200 },
    rarity: 'rare',
    hidden: true
  },
  lucky_seven: {
    id: 'lucky_seven',
    name: 'Lucky Seven',
    description: 'Roll a 7 three times in a row',
    icon: '🍀',
    category: 'special',
    target: 1,
    reward: { credits: 200 },
    rarity: 'rare',
    hidden: true
  },
  shop_spree: {
    id: 'shop_spree',
    name: 'Shopping Spree',
    description: 'Buy 3 items from the shop in one turn',
    icon: '🛒',
    category: 'special',
    target: 1,
    reward: { credits: 150 },
    rarity: 'uncommon',
    hidden: true
  },

  // Character/Cosmetic Collection
  collect_5_characters: {
    id: 'collect_5_characters',
    name: 'Character Collector',
    description: 'Own 5 different characters',
    icon: '🎭',
    category: 'collection',
    target: 5,
    reward: { credits: 200 },
    rarity: 'uncommon'
  },
  collect_all_characters: {
    id: 'collect_all_characters',
    name: 'Full Roster',
    description: 'Own all 12 characters',
    icon: '✨',
    category: 'collection',
    target: 12,
    reward: { credits: 1000 },
    rarity: 'legendary'
  },

  // Board Mastery
  play_all_boards: {
    id: 'play_all_boards',
    name: 'World Traveler',
    description: 'Play on all available boards',
    icon: '🗺️',
    category: 'boards',
    target: 4,
    reward: { credits: 300 },
    rarity: 'uncommon'
  },
  board_master: {
    id: 'board_master',
    name: 'Board Master',
    description: 'Win on all available boards',
    icon: '🏆',
    category: 'boards',
    target: 4,
    reward: { credits: 750 },
    rarity: 'epic'
  }
};

// Categories for UI organization
export const AchievementCategories = {
  getting_started: {
    id: 'getting_started',
    name: 'Getting Started',
    icon: '🚀',
    order: 1
  },
  completion: {
    id: 'completion',
    name: 'Game Completion',
    icon: '📊',
    order: 2
  },
  wins: {
    id: 'wins',
    name: 'Victories',
    icon: '🏆',
    order: 3
  },
  stars: {
    id: 'stars',
    name: 'Star Collection',
    icon: '⭐',
    order: 4
  },
  coins: {
    id: 'coins',
    name: 'Coin Collection',
    icon: '💰',
    order: 5
  },
  minigames: {
    id: 'minigames',
    name: 'Minigames',
    icon: '🎮',
    order: 6
  },
  overseer: {
    id: 'overseer',
    name: 'The Overseer',
    icon: '👁️',
    order: 7
  },
  social: {
    id: 'social',
    name: 'Social',
    icon: '🤝',
    order: 8
  },
  collection: {
    id: 'collection',
    name: 'Collection',
    icon: '🎭',
    order: 9
  },
  boards: {
    id: 'boards',
    name: 'Board Mastery',
    icon: '🗺️',
    order: 10
  },
  special: {
    id: 'special',
    name: 'Special',
    icon: '✨',
    order: 11
  }
};

// Rarity colors for UI
export const RarityColors = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800'
};

// Helper function to get achievement by ID
export function getAchievement(id) {
  return Achievements[id] || null;
}

// Helper function to get achievements by category
export function getAchievementsByCategory(category) {
  return Object.values(Achievements).filter(a => a.category === category);
}

// Helper function to get all non-hidden achievements
export function getVisibleAchievements() {
  return Object.values(Achievements).filter(a => !a.hidden);
}

// Helper function to check which achievements should be checked for a stat update
export function getAchievementsForStat(statName) {
  const mapping = {
    games_played: ['first_game', 'games_10', 'games_50', 'games_100', 'games_500'],
    games_won: ['first_win', 'wins_5', 'wins_25', 'wins_50', 'wins_100'],
    total_stars: ['first_star', 'stars_10', 'stars_50', 'stars_100', 'stars_500'],
    total_coins: ['coins_100', 'coins_1000', 'coins_10000', 'coins_100000'],
    minigames_won: ['first_minigame', 'minigames_10', 'minigames_50', 'minigames_100', 'minigames_500'],
    overseer_encounters: ['overseer_first', 'overseer_10'],
    overseer_wins: ['overseer_win_5']
  };
  return mapping[statName] || [];
}

export default { 
  Achievements, 
  AchievementCategories, 
  RarityColors,
  getAchievement,
  getAchievementsByCategory,
  getVisibleAchievements,
  getAchievementsForStat
};
