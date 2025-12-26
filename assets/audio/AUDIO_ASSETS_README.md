# Audio Assets Guide

This document lists all the audio assets needed for Super JoJo Party.
Currently, the game uses **procedurally generated audio** for SFX, but you can replace them with real audio files.

## Directory Structure

```
assets/audio/
├── music/           # Background music tracks
├── sfx/             # Sound effects
└── voicelines/      # Character voice lines
    ├── jojo/
    ├── mimi/
    ├── sparks/
    ├── coral/
    ├── frost/
    ├── blaze/
    ├── luna/
    ├── rocky/
    ├── bongo/
    ├── pip/
    ├── nova/
    └── zippy/
```

---

## Music Tracks Needed

Place MP3 files in `assets/audio/music/`

| Filename | Description | Mood | Duration |
|----------|-------------|------|----------|
| `menu.mp3` | Main menu theme | Upbeat, welcoming | Loop 2-3 min | ES_Are You Happy Now_ - The Big Let Down
| `board.mp3` | Board gameplay theme | Adventurous, fun | Loop 2-3 min |
| `minigame.mp3` | Minigame theme | Energetic, fast | Loop 1-2 min |
| `results.mp3` | Results/victory screen | Triumphant | Loop 1 min |
| `shop.mp3` | Shop theme | Jazzy, relaxed | Loop 1-2 min |
| `overseer.mp3` | Overseer/boss encounter | Ominous, tense | Loop 1 min |
| `last5turns.mp3` | Last 5 turns theme | Intense, dramatic | Loop 2 min |
| `duel.mp3` | Duel minigame theme | Competitive, fast | Loop 1 min |
| `bowser.mp3` | Bowser space theme | Dark, menacing | 30 sec |
| `lucky.mp3` | Lucky space theme | Happy, cheerful | 30 sec |

---

## Sound Effects Needed

Place MP3 files in `assets/audio/sfx/`

| Filename | Description |
|----------|-------------|
| `click.mp3` | Button click |
| `success.mp3` | Success/confirm action |
| `error.mp3` | Error/invalid action |
| `back.mp3` | Back button |
| `modal_open.mp3` | Modal/popup opening |
| `player_join.mp3` | Player joins lobby |
| `dice_roll.mp3` | Dice rolling sound |
| `coin.mp3` | Coin collect |
| `star.mp3` | Star collect |
| `item_get.mp3` | Item obtained |
| `item_use.mp3` | Item used |
| `move_step.mp3` | Player movement step |
| `blue_space.mp3` | Landing on blue space |
| `red_space.mp3` | Landing on red space |
| `event_space.mp3` | Landing on event space |
| `vs_space.mp3` | Landing on VS space |
| `lucky_space.mp3` | Landing on lucky space |
| `bowser_space.mp3` | Landing on Bowser space |
| `shop_open.mp3` | Shop opening |
| `shop_rare.mp3` | Rare shop jingle |
| `shop_lucky.mp3` | Lucky shop jingle |
| `purchase.mp3` | Purchase complete |
| `minigame_win.mp3` | Minigame victory |
| `minigame_lose.mp3` | Minigame defeat |
| `countdown.mp3` | Countdown tick (3, 2, 1) |
| `countdown_go.mp3` | GO! sound |
| `overseer_appear.mp3` | Overseer appears |
| `wheel_spin.mp3` | Wheel spinning |
| `emote.mp3` | Emote used |
| `duel_start.mp3` | Duel begins |
| `duel_win.mp3` | Duel victory |
| `duel_lose.mp3` | Duel defeat |
| `bonus_star.mp3` | Bonus star awarded |
| `last5_turns.mp3` | Last 5 turns announcement |
| `coin_loss.mp3` | Coins lost |
| `star_gain.mp3` | Star gained |
| `star_loss.mp3` | Star lost |
| `turn_start.mp3` | Turn begins |
| `game_end.mp3` | Game over fanfare |

---

## Voice Lines Needed (Per Character)

Each character folder should contain MP3 files for the following voice lines.
Each category can have 1-3 variations (e.g., `select_1.mp3`, `select_2.mp3`, `select_3.mp3`).

### Voice Line Categories

| Category | When Played | Example Dialogue |
|----------|-------------|------------------|
| `select` | Character selected | "Let's go!", "Ready!" |
| `dice_roll` | Rolling dice | "Here we go!" |
| `good_roll` | High dice roll (4-6) | "Yes!", "Perfect!" |
| `bad_roll` | Low dice roll (1-2) | "Oh no...", "Hmm..." |
| `star_get` | Obtaining a star | "A star!", "Woohoo!" |
| `star_miss` | Missing a star | "So close!", "Next time!" |
| `minigame_win` | Winning minigame | "Victory!", "I did it!" |
| `minigame_lose` | Losing minigame | "Good game!", "Darn!" |
| `overseer` | Encountering Overseer | "Uh oh...", "Please be nice!" |
| `coin_gain` | Gaining coins | "Coins!", "Nice!" |
| `coin_lose` | Losing coins | "My coins!", "Ouch!" |
| `idle` | Waiting/idle | "Hmm...", "*whistles*" |

---

## Character Voice Line Details

### JoJo (Default Character)
**Voice Style:** Cheerful, energetic child
- select: "Let's go!", "JoJo time!", "Ready to party!"
- dice_roll: "Here we go!", "Lucky roll!", "Come on!"
- good_roll: "Yes!", "Awesome!", "Perfect!"
- bad_roll: "Oh no!", "Not great...", "Hmm..."
- star_get: "A star!", "Woohoo!", "Amazing!"
- star_miss: "So close!", "Next time!", "Aww..."
- minigame_win: "Victory!", "I did it!", "Champion!"
- minigame_lose: "Good game!", "I'll get you next time!", "Darn!"
- overseer: "Uh oh...", "Not the Overseer!", "Please be nice!"
- coin_gain: "Coins!", "Cha-ching!", "Nice!"
- coin_lose: "My coins!", "No way!", "Ouch!"
- idle: "Hmm...", "What should I do?", "*whistles*"

### Mimi
**Voice Style:** Smart, confident strategist
- select: "Mimi's here!", "Let's strategize!", "Time to win!"
- dice_roll: "Calculate...", "Here goes!", "Roll!"
- good_roll: "As planned!", "Excellent!", "Of course!"
- bad_roll: "Unexpected...", "Hmm, recalculating...", "Suboptimal."
- star_get: "Strategic victory!", "Star secured!", "Mine now!"
- star_miss: "A setback...", "Temporary.", "Plan B..."
- minigame_win: "Calculated!", "As expected!", "Too easy!"
- minigame_lose: "Interesting...", "I see...", "Noted."
- overseer: "This could be bad...", "The odds are...", "Stay calm."
- coin_gain: "Resources acquired!", "Efficient!", "Good!"
- coin_lose: "Unfortunate.", "Budget decreased.", "Hmm."
- idle: "Thinking...", "*taps foot*", "Any day now..."

### Sparks
**Voice Style:** Hyperactive, electric energy
- select: "Bzzt! Let's go!", "Sparks flying!", "I'm electrified!"
- dice_roll: "Shock time!", "Zap zap!", "Thunder roll!"
- good_roll: "Electrifying!", "Shocking good!", "Zap!"
- bad_roll: "Short circuit...", "Power down...", "Bzzt..."
- star_get: "Super charged!", "Electric star!", "Zapow!"
- star_miss: "Disconnected...", "Need recharge!", "Static..."
- minigame_win: "Overloaded!", "Maximum voltage!", "Shocking victory!"
- minigame_lose: "Fizzled out...", "Low battery...", "Grounded..."
- overseer: "High voltage alert!", "Surge incoming!", "Yikes!"
- coin_gain: "Coin surge!", "Charged up!", "Electric!"
- coin_lose: "Power drain!", "Zapped away!", "Discharged..."
- idle: "*buzzing*", "Bzzt bzzt...", "Charging..."

### Coral
**Voice Style:** Calm, serene ocean voice
- select: "Making waves!", "Coral's here~", "Flowing in!"
- dice_roll: "Tide's turning...", "Splash!", "Wave roll~"
- good_roll: "Smooth sailing!", "Wonderful~", "Like the ocean!"
- bad_roll: "Low tide...", "Ebbing away...", "Oh my~"
- star_get: "Pearl found!", "Treasure!", "Beautiful star~"
- star_miss: "Drifted away...", "The current...", "Sigh~"
- minigame_win: "Tidal victory!", "Splashing success!", "Wonderful~"
- minigame_lose: "Washed away...", "Next wave...", "The sea decides..."
- overseer: "Stormy waters...", "Danger ahead...", "Stay afloat!"
- coin_gain: "Sea treasure!", "Shiny~", "Lovely!"
- coin_lose: "Sinking...", "Lost at sea...", "Oh dear~"
- idle: "*humming*", "The waves call...", "So peaceful~"

### Frost
**Voice Style:** Cool, collected, slightly monotone
- select: "Ice to meet you!", "Frost here.", "Chilling out!"
- dice_roll: "Cool roll...", "Frozen fate.", "Ice dice!"
- good_roll: "Ice cold!", "Frozen perfection.", "Cool."
- bad_roll: "Melting...", "Thawing...", "Not cool."
- star_get: "Frozen star!", "Ice prize!", "Chilling!"
- star_miss: "Cold reality...", "Frosty fail.", "Brr..."
- minigame_win: "Iced it!", "Cold victory!", "Frozen champion!"
- minigame_lose: "Defrosted...", "Ice broken...", "Warmed up..."
- overseer: "Cold front coming...", "Freeze...", "Stay frosty."
- coin_gain: "Cool coins!", "Frozen gold!", "Nice."
- coin_lose: "Coins melted...", "Thawed away...", "Cold loss."
- idle: "*shivers*", "So cool...", "Chill..."

### Blaze
**Voice Style:** Hot-headed, passionate, fiery
- select: "Fired up!", "Blaze here!", "Let's burn it down!"
- dice_roll: "Hot roll!", "Burning!", "Fire away!"
- good_roll: "On fire!", "Blazing!", "HOT!"
- bad_roll: "Burned out...", "Smoldering...", "Ash..."
- star_get: "Fiery star!", "Burning bright!", "BLAZING!"
- star_miss: "Extinguished...", "Flame out...", "Smoke..."
- minigame_win: "INFERNO!", "Scorched 'em!", "Fire champion!"
- minigame_lose: "Doused...", "Put out...", "Ember..."
- overseer: "Heat wave!", "Fire alarm!", "Hot situation!"
- coin_gain: "Golden flames!", "Hot coins!", "Sizzling!"
- coin_lose: "Burnt away!", "Ashes...", "Scorched!"
- idle: "*crackling*", "So hot...", "Burning..."

### Luna
**Voice Style:** Mysterious, wise, ethereal
- select: "The moon rises...", "Luna awakens.", "Celestial!"
- dice_roll: "Fate decides...", "Stars align...", "Cosmic roll..."
- good_roll: "Written in stars!", "Destiny!", "Moonlit!"
- bad_roll: "Eclipse...", "Dark side...", "The cosmos disagree..."
- star_get: "Starbound!", "Cosmic gift!", "The universe provides!"
- star_miss: "Star crossed...", "Not aligned...", "The moon weeps..."
- minigame_win: "Lunar victory!", "Celestial triumph!", "Moonlit champion!"
- minigame_lose: "Nightfall...", "Eclipse...", "Stars dimming..."
- overseer: "Dark omens...", "The void watches...", "Cosmic danger..."
- coin_gain: "Stardust!", "Moonglow!", "Cosmic wealth!"
- coin_lose: "Fading light...", "Stars fall...", "Moonless..."
- idle: "*gazing at stars*", "The cosmos whisper...", "Night falls..."

### Rocky
**Voice Style:** Tough, dependable, gruff but friendly
- select: "Rock solid!", "Rocky here!", "Stone cold ready!"
- dice_roll: "Rolling stones!", "Rock and roll!", "Heavy throw!"
- good_roll: "Crushing it!", "Rock on!", "Boulder!"
- bad_roll: "Crumbling...", "Eroding...", "Pebbles..."
- star_get: "Gem found!", "Crystal star!", "ROCK ON!"
- star_miss: "Scattered...", "Gravel...", "Dust..."
- minigame_win: "Mountain victory!", "Rock champion!", "Unbreakable!"
- minigame_lose: "Landslide...", "Weathered...", "Cracked..."
- overseer: "Earthquake!", "Avalanche!", "Rumbling!"
- coin_gain: "Gold ore!", "Mining coins!", "Treasure!"
- coin_lose: "Caved in...", "Lost in rocks...", "Crushed..."
- idle: "*rumbling*", "Standing firm...", "Solid..."

### Bongo
**Voice Style:** Musical, playful, rhythmic
- select: "Bongo time!", "Let's jam!", "Beat drop!"
- dice_roll: "Drum roll!", "Rhythm roll!", "Beat it!"
- good_roll: "Sick beat!", "Groovy!", "In rhythm!"
- bad_roll: "Off beat...", "Missed the tempo...", "Discord..."
- star_get: "Star solo!", "Hit song!", "Encore!"
- star_miss: "Flat note...", "Out of tune...", "Silence..."
- minigame_win: "Standing ovation!", "Encore!", "Chart topper!"
- minigame_lose: "Stage fright...", "Wrong note...", "Booed off..."
- overseer: "Bad vibes!", "Dissonance!", "Off key!"
- coin_gain: "Cha-ching beat!", "Money music!", "Jackpot jam!"
- coin_lose: "Broke a string...", "Lost rhythm...", "Silent..."
- idle: "*drumming*", "Ba-dum-tss!", "Keeping beat..."

### Pip
**Voice Style:** Small but mighty, chirpy, optimistic
- select: "Pip pip!", "Tweet tweet!", "Flying in!"
- dice_roll: "Feather roll!", "Wing it!", "Chirp!"
- good_roll: "Soaring!", "High flying!", "Tweet!"
- bad_roll: "Grounded...", "Clipped wings...", "Peep..."
- star_get: "Shiny thing!", "Bird got star!", "Chirpy!"
- star_miss: "Flew away...", "Missed nest...", "Sad peep..."
- minigame_win: "Bird is word!", "Flock yeah!", "Tweet victory!"
- minigame_lose: "Ruffled feathers...", "Molting...", "Chirp..."
- overseer: "Predator!", "Take flight!", "Danger chirp!"
- coin_gain: "Shiny coins!", "Nest egg!", "Tweet!"
- coin_lose: "Dropped seeds...", "Empty nest...", "Sad chirp..."
- idle: "*chirping*", "Preening...", "Tweet tweet..."

### Nova
**Voice Style:** Glamorous, radiant, confident diva
- select: "Nova's here!", "Time to shine!", "Dazzling!"
- dice_roll: "Sparkling roll!", "Brilliant!", "Shine!"
- good_roll: "Radiant!", "Glowing!", "Fabulous!"
- bad_roll: "Dimming...", "Flickering...", "Less sparkle..."
- star_get: "Born star!", "Supernova!", "BRILLIANT!"
- star_miss: "Light fading...", "Dimmed...", "Sigh..."
- minigame_win: "Superstar!", "Dazzling victory!", "Shine on!"
- minigame_lose: "Outshined...", "Eclipsed...", "Fading..."
- overseer: "Dark energy!", "Blocking light!", "Not sparkly!"
- coin_gain: "Glittering gold!", "Sparkle coins!", "Dazzling!"
- coin_lose: "Lost luster...", "Tarnished...", "Dulled..."
- idle: "*sparkling*", "So glamorous...", "Shining bright..."

### Zippy
**Voice Style:** Fast-talking, energetic, speed demon
- select: "Gotta go fast!", "Zippy's here!", "Zoom zoom!"
- dice_roll: "Speed roll!", "Quick throw!", "Zooming!"
- good_roll: "Blazing!", "Sonic speed!", "Whoosh!"
- bad_roll: "Brakes...", "Slowing down...", "Stuck..."
- star_get: "Speed star!", "Quick grab!", "ZOOM!"
- star_miss: "Too fast...", "Missed it!", "Whoops!"
- minigame_win: "Speed victory!", "First place!", "Fastest!"
- minigame_lose: "Crashed...", "Pit stop...", "Ran out of gas..."
- overseer: "Speed trap!", "Slow zone!", "Watch out!"
- coin_gain: "Quick coins!", "Fast cash!", "Speedy!"
- coin_lose: "Dropped 'em!", "Too fast...", "Scattered!"
- idle: "*zooming in place*", "Gotta move...", "Zoom zoom..."

---

## File Naming Convention

### Voice Lines
```
voicelines/{character_id}/{category}_{number}.mp3
```

Example:
```
voicelines/jojo/select_1.mp3
voicelines/jojo/select_2.mp3
voicelines/jojo/select_3.mp3
voicelines/jojo/dice_roll_1.mp3
```

### Sound Effects
```
sfx/{effect_name}.mp3
```

### Music
```
music/{track_name}.mp3
```

---

## Audio Specifications

- **Format:** MP3 (preferred) or OGG
- **Sample Rate:** 44100 Hz
- **Bit Rate:** 128-192 kbps
- **Channels:** Stereo for music, Mono for SFX/voice

### Duration Guidelines
- Voice lines: 0.5-2 seconds
- SFX: 0.1-1 second
- Music: 1-3 minute loops

---

## Notes

1. The game currently generates all audio procedurally using the Web Audio API
2. Adding real audio files will automatically override the procedural generation
3. All paths in the game reference `/assets/audio/...`
4. Voice lines add personality - record them with character in mind!
