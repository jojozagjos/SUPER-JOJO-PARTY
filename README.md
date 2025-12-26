# Super JoJo Party 🎲🌟

A multiplayer 3D party board game built for the web, capturing the full structure, pacing, and chaos of classic party games while remaining original in identity.

## Features

- **Full Multiplayer Support**: Up to 20 players per match with bot fill-in
- **Persistent Progression**: Player accounts, credits, unlockables, and statistics
- **Multiple Game Boards**: Each with unique themes and mechanics
- **Minigames**: Various 3D and 2D minigames with server-authoritative logic
- **Cinematics**: Full presentation with intro sequences, event animations, and celebrations
- **Shop System**: Cosmetic unlocks using earned credits
- **Cross-Platform**: Runs in any modern web browser

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6+, Three.js (WebGL)
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT-based sessions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/super-jojo-party.git
cd super-jojo-party

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### Production Deployment (Render.com)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy!

Build Command: `npm install`
Start Command: `npm start`

## Game Structure

### Screens
1. **Splash Screen**: Branding and asset loading
2. **Login/Register**: Account management
3. **Main Menu**: Play, Shop, Profile, Settings
4. **Play Hub**: Quick Match, Host Lobby, Join Lobby
5. **Lobby**: Pre-match configuration
6. **Board Game**: Main gameplay
7. **Minigames**: Various competitive games
8. **Results**: End-game standings and rewards

### Space Types
- 🔵 **Blue Space**: Gain 3 coins
- 🔴 **Red Space**: Lose 3 coins
- ❓ **Event Space**: Trigger board events
- 🛒 **Shop Space**: Purchase items
- ⚔️ **VS Space**: Special minigames
- ⭐ **Star Space**: Purchase stars
- 👁️ **Overseer Space**: Risk/reward wheel

## License

MIT License - See LICENSE file for details

## Credits

Developed with ❤️ for party game enthusiasts everywhere!
