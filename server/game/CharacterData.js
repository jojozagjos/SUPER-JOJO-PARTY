// Character data definitions - Only JoJo (free) and Mimi (100 credits)
export const CHARACTERS = [
  // Default Character (free for all players)
  {
    id: 'jojo',
    name: 'JoJo',
    description: 'A cheerful adventurer ready for any party challenge!',
    personality: 'Energetic and optimistic',
    color: '#FF6B6B',
    icon: '🎭',
    isDefault: true,
    model: '/assets/characters/jojo/model.glb',
    portrait: '/assets/characters/jojo/portrait.svg',
    voiceLines: {
      select: ['Let\'s go!', 'JoJo time!', 'Ready to party!'],
      diceRoll: ['Here we go!', 'Lucky roll!', 'Come on!'],
      goodRoll: ['Yes!', 'Awesome!', 'Perfect!'],
      badRoll: ['Oh no!', 'Not great...', 'Hmm...'],
      starGet: ['A star!', 'Woohoo!', 'Amazing!'],
      starMiss: ['So close!', 'Next time!', 'Aww...'],
      minigameWin: ['Victory!', 'I did it!', 'Champion!'],
      minigameLose: ['Good game!', 'I\'ll get you next time!', 'Darn!'],
      overseer: ['Uh oh...', 'Not the Overseer!', 'Please be nice!'],
      coinGain: ['Coins!', 'Cha-ching!', 'Nice!'],
      coinLose: ['My coins!', 'No way!', 'Ouch!'],
      idle: ['Hmm...', 'What should I do?', '*whistles*']
    }
  },
  // Unlockable Character (100 credits)
  {
    id: 'mimi',
    name: 'Mimi',
    description: 'A clever strategist who always has a plan!',
    personality: 'Smart and confident',
    color: '#4ECDC4',
    icon: '🦋',
    isDefault: false,
    price: 100,
    model: '/assets/characters/mimi/model.glb',
    portrait: '/assets/characters/mimi/portrait.svg',
    voiceLines: {
      select: ['Mimi\'s here!', 'Let\'s strategize!', 'Time to win!'],
      diceRoll: ['Calculate...', 'Here goes!', 'Roll!'],
      goodRoll: ['As planned!', 'Excellent!', 'Of course!'],
      badRoll: ['Unexpected...', 'Hmm, recalculating...', 'Suboptimal.'],
      starGet: ['Strategic victory!', 'Star secured!', 'Mine now!'],
      starMiss: ['A setback...', 'Temporary.', 'Plan B...'],
      minigameWin: ['Calculated!', 'As expected!', 'Too easy!'],
      minigameLose: ['Interesting...', 'I see...', 'Noted.'],
      overseer: ['This could be bad...', 'The odds are...', 'Stay calm.'],
      coinGain: ['Resources acquired!', 'Efficient!', 'Good!'],
      coinLose: ['Unfortunate.', 'Budget decreased.', 'Hmm.'],
      idle: ['Thinking...', '*taps foot*', 'Any day now...']
    }
  }
];

// Get character by ID
export function getCharacterById(characterId) {
  return CHARACTERS.find(c => c.id === characterId);
}

// Get default characters
export function getDefaultCharacters() {
  return CHARACTERS.filter(c => c.isDefault);
}

// Get unlockable characters
export function getUnlockableCharacters() {
  return CHARACTERS.filter(c => !c.isDefault);
}

// Get voice line for character and event
export function getVoiceLine(characterId, event) {
  const character = getCharacterById(characterId);
  if (!character || !character.voiceLines[event]) return null;
  
  const lines = character.voiceLines[event];
  return lines[Math.floor(Math.random() * lines.length)];
}
