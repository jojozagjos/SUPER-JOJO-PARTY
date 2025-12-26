// Shop items data - Only Mimi as purchasable character (JoJo is free default)
// Using emoji code points for cross-platform compatibility
const E = {
  butterfly: '\u{1F98B}',
  crown: '\u{1F451}',
  tophat: '\u{1F3A9}',
  party: '\u{1F389}',
  wizard: '\u{1F9D9}',
  pirate: '\u{1F3F4}',
  halo: '\u{1F607}',
  devil: '\u{1F608}',
  alien: '\u{1F47D}',
  sparkles: '\u{2728}',
  rainbow: '\u{1F308}',
  fire: '\u{1F525}',
  snowflake: '\u{2744}',
  hearts: '\u{1F495}',
  music: '\u{1F3B5}',
  star: '\u{1F31F}',
  lightning: '\u{26A1}',
  wave: '\u{1F44B}',
  dance: '\u{1F483}',
  laugh: '\u{1F604}',
  cry: '\u{1F622}',
  angry: '\u{1F620}',
  celebrate: '\u{1F38A}',
  mindblown: '\u{1F92F}',
  flex: '\u{1F4AA}',
  cool: '\u{1F60E}',
  handshake: '\u{1F91D}'
};

export const SHOP_ITEMS = [
  // Characters - JoJo is free default, Mimi is purchasable
  {
    id: 'jojo',
    type: 'character',
    name: 'JoJo',
    description: 'The life of every party! Always ready for fun and adventure.',
    price: 0,
    icon: '\u{1F3AD}',
    rarity: 'common',
    portrait: '/assets/characters/jojo/portrait.svg',
    isDefault: true
  },
  {
    id: 'mimi',
    type: 'character',
    name: 'Mimi',
    description: 'A clever strategist who always has a plan!',
    price: 100,
    icon: E.butterfly,
    rarity: 'uncommon',
    portrait: '/assets/characters/mimi/portrait.svg'
  },

  // Hats
  {
    id: 'crown',
    type: 'hat',
    name: 'Royal Crown',
    description: 'A golden crown fit for party royalty!',
    price: 200,
    icon: E.crown,
    rarity: 'rare'
  },
  {
    id: 'tophat',
    type: 'hat',
    name: 'Top Hat',
    description: 'A classy hat for distinguished players!',
    price: 150,
    icon: E.tophat,
    rarity: 'uncommon'
  },
  {
    id: 'partyhat',
    type: 'hat',
    name: 'Party Hat',
    description: 'Celebrate every turn with festive style!',
    price: 100,
    icon: E.party,
    rarity: 'common'
  },
  {
    id: 'wizard',
    type: 'hat',
    name: 'Wizard Hat',
    description: 'Channel your inner magic master!',
    price: 250,
    icon: E.wizard,
    rarity: 'rare'
  },
  {
    id: 'pirate',
    type: 'hat',
    name: 'Pirate Hat',
    description: 'Arr! Plunder those coins!',
    price: 200,
    icon: E.pirate,
    rarity: 'uncommon'
  },
  {
    id: 'halo',
    type: 'hat',
    name: 'Halo',
    description: 'An angelic ring of light!',
    price: 300,
    icon: E.halo,
    rarity: 'rare'
  },
  {
    id: 'horns',
    type: 'hat',
    name: 'Devil Horns',
    description: 'Show your mischievous side!',
    price: 300,
    icon: E.devil,
    rarity: 'rare'
  },
  {
    id: 'antenna',
    type: 'hat',
    name: 'Alien Antenna',
    description: 'Out of this world style!',
    price: 350,
    icon: E.alien,
    rarity: 'epic'
  },

  // Trails
  {
    id: 'sparkle',
    type: 'trail',
    name: 'Sparkle Trail',
    description: 'Leave a trail of magical sparkles!',
    price: 300,
    icon: E.sparkles,
    rarity: 'uncommon'
  },
  {
    id: 'rainbow',
    type: 'trail',
    name: 'Rainbow Trail',
    description: 'A colorful rainbow follows you!',
    price: 400,
    icon: E.rainbow,
    rarity: 'rare'
  },
  {
    id: 'fire',
    type: 'trail',
    name: 'Fire Trail',
    description: 'Blaze through the board!',
    price: 350,
    icon: E.fire,
    rarity: 'rare'
  },
  {
    id: 'ice',
    type: 'trail',
    name: 'Ice Trail',
    description: 'Leave a frosty path behind!',
    price: 350,
    icon: E.snowflake,
    rarity: 'rare'
  },
  {
    id: 'hearts',
    type: 'trail',
    name: 'Heart Trail',
    description: 'Spread the love wherever you go!',
    price: 250,
    icon: E.hearts,
    rarity: 'uncommon'
  },
  {
    id: 'music',
    type: 'trail',
    name: 'Music Trail',
    description: 'Musical notes dance behind you!',
    price: 300,
    icon: E.music,
    rarity: 'uncommon'
  },
  {
    id: 'stars',
    type: 'trail',
    name: 'Star Trail',
    description: 'A constellation of stars follows you!',
    price: 450,
    icon: E.star,
    rarity: 'epic'
  },
  {
    id: 'lightning',
    type: 'trail',
    name: 'Lightning Trail',
    description: 'Electrify the competition!',
    price: 400,
    icon: E.lightning,
    rarity: 'rare'
  },

  // Emotes
  {
    id: 'wave',
    type: 'emote',
    name: 'Wave',
    description: 'Give a friendly wave!',
    price: 50,
    icon: E.wave,
    rarity: 'common'
  },
  {
    id: 'dance',
    type: 'emote',
    name: 'Dance',
    description: 'Show off your moves!',
    price: 100,
    icon: E.dance,
    rarity: 'common'
  },
  {
    id: 'laugh',
    type: 'emote',
    name: 'Laugh',
    description: 'Share some joy!',
    price: 75,
    icon: E.laugh,
    rarity: 'common'
  },
  {
    id: 'cry',
    type: 'emote',
    name: 'Cry',
    description: 'Express your sadness!',
    price: 75,
    icon: E.cry,
    rarity: 'common'
  },
  {
    id: 'angry',
    type: 'emote',
    name: 'Angry',
    description: 'Show your frustration!',
    price: 75,
    icon: E.angry,
    rarity: 'common'
  },
  {
    id: 'celebrate',
    type: 'emote',
    name: 'Celebrate',
    description: 'Party time!',
    price: 150,
    icon: E.celebrate,
    rarity: 'uncommon'
  },
  {
    id: 'mindblown',
    type: 'emote',
    name: 'Mind Blown',
    description: 'When things get crazy!',
    price: 200,
    icon: E.mindblown,
    rarity: 'uncommon'
  },
  {
    id: 'flex',
    type: 'emote',
    name: 'Flex',
    description: 'Show your strength!',
    price: 150,
    icon: E.flex,
    rarity: 'uncommon'
  },
  {
    id: 'cool',
    type: 'emote',
    name: 'Cool',
    description: 'Too cool for school!',
    price: 125,
    icon: E.cool,
    rarity: 'common'
  },
  {
    id: 'gg',
    type: 'emote',
    name: 'Good Game',
    description: 'Show good sportsmanship!',
    price: 100,
    icon: E.handshake,
    rarity: 'common'
  }
];

// Get shop item by id and type
export function getShopItem(itemId, itemType) {
  return SHOP_ITEMS.find(item => item.id === itemId && item.type === itemType);
}

// Get all items by type
export function getItemsByType(itemType) {
  return SHOP_ITEMS.filter(item => item.type === itemType);
}

// Get character by id (for shop)
export function getCharacterFromShop(characterId) {
  return SHOP_ITEMS.find(item => item.id === characterId && item.type === 'character');
}
