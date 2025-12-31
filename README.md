# Super JoJo Party 🎲🌟

A multiplayer 3D party board game built for the web, featuring real-time gameplay, responsive design, and accessibility-first features.

## ✨ Key Features

- **3D Boards** with unique mechanics: Tropical Paradise (tide), Crystal Caves (gems), Haunted Manor (ghosts), Sky Kingdom (wind)
- **11+ Minigames** with physics-based movement and 3D rendering
- **Real-time Multiplayer** via Socket.io with server-authoritative gameplay
- **Voting System** with ARIA accessibility and animated 3D board previews
- **Mobile Support** with on-screen D-pad controls
- **Responsive Design** that works on desktop, tablet, and mobile
- **Accessibility-First**: ARIA labels, keyboard navigation, screen reader support
- **Audio System** with positional sound, SFX preloading, and music ducking
- **Security**: Rate limiting, input validation, HTML sanitization

## Quick Start

```bash
# Install
npm install

# Run dev server
npm start

# Opens http://localhost:3000
```

### First Run

1. Open http://localhost:3000 in modern browser
2. Create lobby or join with code
3. Select character and board
4. Vote on board (use arrows or mouse)
5. Play! (Use WASD or arrows for movement)

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+, Three.js r128 |
| **Multiplayer** | Socket.io, WebSockets |
| **Backend** | Node.js 18+, Express.js |
| **Database** | SQLite with sql.js |
| **Security** | JWT auth, rate limiting, input validation, CSP |

## Architecture

```
Frontend (Client)
├── 3D Board Rendering (Three.js)
├── Real-time Socket.io
├── Audio System (Web Audio API)
├── Touch Controls (Mobile)
└── Accessibility (ARIA, keyboard nav)

Backend (Server)
├── Game Logic & State
├── Socket.io Event Handlers
├── Authentication & JWT
├── Input Validation & Rate Limiting
└── Database (SQLite)
```

## Core Systems

### 3D Board Engine
- Per-board themes with unique colors and mechanics
- Dynamic camera framing for previews
- Particle effects for board events
- Texture caching with fallbacks

### Minigames (11 Total)
- Physics-based movement (WASD)
- 3D and 2D rendering
- Practice mode with AI bots
- Server-authoritative scoring

### Accessibility
- ✅ ARIA radiogroup for voting
- ✅ Live regions for announcements
- ✅ Keyboard navigation (arrows, Enter/Space)
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Semantic HTML

### Mobile
- Touch D-pad controls
- Responsive grid layout
- Adaptive UI sizing
- Portrait/landscape support

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Server won't start** | Check port 3000 is free: `lsof -i :3000` |
| **WebGL error** | Update GPU drivers or use fallback 2D board |
| **CSP violations** | Check browser console, all should use `addEventListener` |
| **Touch controls missing** | Only shows on mobile (pointer: coarse) |
| **Audio not playing** | User interaction required to init audio context |
| **Voting off-camera** | Responsive CSS handles all sizes, try refreshing |

## Performance Tips

- Board textures preload automatically
- Critical SFX (click, coin, diceRoll) preload on init
- Three.js assets disposed properly on cleanup
- Socket.io rate limiting prevents abuse
- Can enable low-quality mode for slower devices

## Environment

Create `.env` (optional):
```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile: iOS Safari 14+, Chrome Android

## Development

```bash
# Start server only
npm run server

# Common Issues in DevTools
# Console: Check for WebGL errors, CSP violations, socket errors
# Network: Monitor texture loading, audio files
# Accessibility: Run Axe or WAVE extension
```

## Production Deployment (Render.com)

1. Push to GitHub
2. Connect repo to Render
3. Set NODE_ENV=production
4. Deploy!

## Contributing

1. Follow existing code style
2. Test on mobile
3. Check accessibility with DevTools
4. Add JSDoc comments
5. Run `npm audit` before committing

## License

Built with ❤️ for party game lovers!

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
