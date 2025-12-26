// Item data definitions with Koopa Shop support
export const ITEMS = [
  {
    id: 'double_dice',
    name: 'Double Dice',
    description: 'Roll twice the number on your dice!',
    price: 10,
    rarity: 'common',
    icon: '🎲',
    effect: { type: 'diceModifier', multiplier: 2 },
    shopChance: 0.3,
    shopTypes: ['item', 'lucky']
  },
  {
    id: 'triple_dice',
    name: 'Triple Dice',
    description: 'Roll three times the number on your dice!',
    price: 20,
    rarity: 'uncommon',
    icon: '🎲',
    effect: { type: 'diceModifier', multiplier: 3 },
    shopChance: 0.2,
    shopTypes: ['item', 'rare']
  },
  {
    id: 'custom_dice',
    name: 'Custom Dice',
    description: 'Choose exactly which number to roll (1-10)!',
    price: 30,
    rarity: 'rare',
    icon: '✨',
    effect: { type: 'chooseDice', min: 1, max: 10 },
    shopChance: 0.1,
    shopTypes: ['rare']
  },
  {
    id: 'coin_steal',
    name: 'Coin Snatcher',
    description: 'Steal 10 coins from a random opponent!',
    price: 15,
    rarity: 'common',
    icon: '💰',
    effect: { type: 'stealCoins', amount: 10 },
    shopChance: 0.25,
    shopTypes: ['item']
  },
  {
    id: 'coin_steal_targeted',
    name: 'Targeted Theft',
    description: 'Steal 15 coins from a player of your choice!',
    price: 25,
    rarity: 'uncommon',
    icon: '🎯',
    effect: { type: 'stealCoinsTargeted', amount: 15 },
    shopChance: 0.15,
    shopTypes: ['item', 'rare']
  },
  {
    id: 'position_swap',
    name: 'Swap Space',
    description: 'Swap positions with a random player!',
    price: 15,
    rarity: 'common',
    icon: '🔄',
    effect: { type: 'swapPosition', targetType: 'random' },
    shopChance: 0.2,
    shopTypes: ['item']
  },
  {
    id: 'position_swap_targeted',
    name: 'Targeted Swap',
    description: 'Swap positions with a player of your choice!',
    price: 30,
    rarity: 'uncommon',
    icon: '🎯',
    effect: { type: 'swapPosition', targetType: 'choice' },
    shopChance: 0.1,
    shopTypes: ['rare']
  },
  {
    id: 'star_discount',
    name: 'Star Coupon',
    description: 'Get 10 coins off your next star purchase!',
    price: 15,
    rarity: 'uncommon',
    icon: '🎟️',
    effect: { type: 'starDiscount', discount: 10 },
    shopChance: 0.2,
    shopTypes: ['item', 'lucky']
  },
  {
    id: 'golden_pipe',
    name: 'Golden Pipe',
    description: 'Instantly teleport to the current star location!',
    price: 40,
    rarity: 'rare',
    icon: '🚿',
    effect: { type: 'teleportToStar' },
    shopChance: 0.05,
    shopTypes: ['rare', 'lucky']
  },
  {
    id: 'reverse_card',
    name: 'Reverse Card',
    description: 'Move backwards instead of forwards this turn!',
    price: 8,
    rarity: 'common',
    icon: '↩️',
    effect: { type: 'reverseMovement' },
    shopChance: 0.15,
    shopTypes: ['item']
  },
  {
    id: 'shield',
    name: 'Safety Shield',
    description: 'Block the next negative effect that would hit you!',
    price: 20,
    rarity: 'uncommon',
    icon: '🛡️',
    effect: { type: 'blockNegative' },
    shopChance: 0.15,
    shopTypes: ['item', 'rare']
  },
  {
    id: 'double_coins',
    name: 'Coin Doubler',
    description: 'Double your coin gains this turn!',
    price: 18,
    rarity: 'common',
    icon: '💵',
    effect: { type: 'doubleCoinGain' },
    shopChance: 0.2,
    shopTypes: ['item', 'lucky']
  },
  {
    id: 'magic_lamp',
    name: 'Magic Lamp',
    description: 'The genie will carry you directly to the star!',
    price: 50,
    rarity: 'legendary',
    icon: '🪔',
    effect: { type: 'directToStar', autoTrigger: true },
    shopChance: 0.02,
    shopTypes: ['rare']
  },
  {
    id: 'poison_mushroom',
    name: 'Poison Mushroom',
    description: 'Make another player only roll 1-3 next turn!',
    price: 12,
    rarity: 'common',
    icon: '🍄',
    effect: { type: 'debuff', target: 'choice', debuffType: 'limitDice', maxRoll: 3 },
    shopChance: 0.15,
    shopTypes: ['item']
  },
  {
    id: 'warp_block',
    name: 'Warp Block',
    description: 'All players randomly swap positions!',
    price: 25,
    rarity: 'uncommon',
    icon: '🌀',
    effect: { type: 'shuffleAll' },
    shopChance: 0.1,
    shopTypes: ['item', 'rare']
  },
  {
    id: 'dueling_glove',
    name: 'Dueling Glove',
    description: 'Challenge another player to a 1v1 minigame for coins!',
    price: 20,
    rarity: 'uncommon',
    icon: '🥊',
    effect: { type: 'duel', coinsAtStake: 20 },
    shopChance: 0.1,
    shopTypes: ['item']
  },
  // New items for expanded Koopa Shops
  {
    id: 'super_star',
    name: 'Super Star',
    description: 'Become invincible for one turn - ignore all negative effects!',
    price: 35,
    rarity: 'rare',
    icon: '⭐',
    effect: { type: 'invincible', duration: 1 },
    shopChance: 0.08,
    shopTypes: ['rare', 'lucky']
  },
  {
    id: 'star_steal',
    name: 'Star Snatcher',
    description: 'Steal a star from another player!',
    price: 60,
    rarity: 'legendary',
    icon: '💫',
    effect: { type: 'stealStar', targetType: 'choice' },
    shopChance: 0.02,
    shopTypes: ['rare']
  },
  {
    id: 'mega_mushroom',
    name: 'Mega Mushroom',
    description: 'Grow huge and steal 10 coins from everyone you pass!',
    price: 25,
    rarity: 'uncommon',
    icon: '🍄',
    effect: { type: 'mega', coinsPerPlayer: 10 },
    shopChance: 0.12,
    shopTypes: ['item', 'lucky']
  },
  {
    id: 'mini_mushroom',
    name: 'Mini Mushroom',
    description: 'Shrink to access hidden shortcut paths!',
    price: 10,
    rarity: 'common',
    icon: '🔬',
    effect: { type: 'mini', accessHidden: true },
    shopChance: 0.2,
    shopTypes: ['item']
  },
  {
    id: 'gold_bar',
    name: 'Gold Bar',
    description: 'Instantly gain 20 coins!',
    price: 15,
    rarity: 'common',
    icon: '🪙',
    effect: { type: 'gainCoins', amount: 20 },
    shopChance: 0.25,
    shopTypes: ['lucky']
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Your next space landing will be lucky regardless of type!',
    price: 20,
    rarity: 'uncommon',
    icon: '🍀',
    effect: { type: 'luckyLanding' },
    shopChance: 0.15,
    shopTypes: ['lucky']
  },
  {
    id: 'double_star',
    name: 'Double Star Card',
    description: 'Buy two stars at once on your next star space!',
    price: 45,
    rarity: 'rare',
    icon: '🌟',
    effect: { type: 'doubleStar' },
    shopChance: 0.05,
    shopTypes: ['rare']
  },
  {
    id: 'cursed_dice',
    name: 'Cursed Dice',
    description: 'Give to opponent - they can only roll 1-5 next turn!',
    price: 15,
    rarity: 'common',
    icon: '💀',
    effect: { type: 'curse', target: 'choice', maxRoll: 5 },
    shopChance: 0.18,
    shopTypes: ['item']
  },
  {
    id: 'boo_bell',
    name: 'Boo Bell',
    description: 'Summon Boo to steal coins or a star from another player!',
    price: 35,
    rarity: 'rare',
    icon: '👻',
    effect: { type: 'booSteal', canStealStar: true },
    shopChance: 0.08,
    shopTypes: ['rare']
  },
  {
    id: 'plunder_chest',
    name: 'Plunder Chest',
    description: 'Steal a random item from another player!',
    price: 12,
    rarity: 'common',
    icon: '📦',
    effect: { type: 'stealItem' },
    shopChance: 0.2,
    shopTypes: ['item']
  },
  {
    id: 'bowser_phone',
    name: 'Bowser Phone',
    description: 'Call Bowser to cause chaos for all other players!',
    price: 30,
    rarity: 'rare',
    icon: '📱',
    effect: { type: 'bowserEvent', targetOthers: true },
    shopChance: 0.06,
    shopTypes: ['rare']
  }
];

// Shop types with their characteristics
export const SHOP_TYPES = {
  item: {
    name: 'Item Shop',
    icon: '🏪',
    description: 'A standard shop with common items',
    priceModifier: 1.0,
    itemCount: 3
  },
  rare: {
    name: 'Rare Item Shop',
    icon: '💎',
    description: 'Sells rare and powerful items at premium prices',
    priceModifier: 1.2,
    itemCount: 3
  },
  lucky: {
    name: 'Lucky Shop',
    icon: '🍀',
    description: 'Items that boost your luck and coin gains',
    priceModifier: 0.9,
    itemCount: 4
  }
};

// Get item by ID
export function getItemById(itemId) {
  return ITEMS.find(i => i.id === itemId);
}

// Get items by rarity
export function getItemsByRarity(rarity) {
  return ITEMS.filter(i => i.rarity === rarity);
}

// Get items for specific shop type
export function getItemsForShopType(shopType, playerCoins = 999) {
  const shopConfig = SHOP_TYPES[shopType] || SHOP_TYPES.item;
  const availableItems = ITEMS.filter(i => 
    i.shopTypes?.includes(shopType) && 
    (i.price * shopConfig.priceModifier) <= playerCoins
  );
  
  return selectRandomItems(availableItems, shopConfig.itemCount, shopConfig.priceModifier);
}

// Get random shop items (legacy support + shop type)
export function getRandomShopItems(count = 3, playerCoins = 999, shopType = 'item') {
  if (shopType && SHOP_TYPES[shopType]) {
    return getItemsForShopType(shopType, playerCoins);
  }
  
  const affordable = ITEMS.filter(i => i.price <= playerCoins);
  return selectRandomItems(affordable, count);
}

// Select random items with weighted probability
function selectRandomItems(items, count, priceModifier = 1.0) {
  const selected = [];
  const available = [...items];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, item) => sum + item.shopChance, 0);
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < available.length; j++) {
      random -= available[j].shopChance;
      if (random <= 0) {
        const item = { 
          ...available[j], 
          price: Math.round(available[j].price * priceModifier) 
        };
        selected.push(item);
        available.splice(j, 1);
        break;
      }
    }
  }
  
  return selected;
}

// Item rarities with colors for display
export const ITEM_RARITIES = {
  common: { name: 'Common', color: '#AAAAAA' },
  uncommon: { name: 'Uncommon', color: '#55AA55' },
  rare: { name: 'Rare', color: '#5555FF' },
  legendary: { name: 'Legendary', color: '#FFAA00' }
};
