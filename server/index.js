import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import modules
import { initDatabase, closeDatabase } from './database/index.js';
import { setupAuthRoutes } from './routes/auth.js';
import { setupApiRoutes } from './routes/api.js';
import { setupSocketHandlers } from './socket/index.js';
import { LobbyManager } from './game/LobbyManager.js';
import { GameManager } from './game/GameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "data:", "blob:"],
      workerSrc: ["'self'", "blob:"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(join(__dirname, '../client')));
app.use('/assets', express.static(join(__dirname, '../assets')));

// Initialize and start server
async function startServer() {
  // Initialize database (async for sql.js)
  const db = await initDatabase();

  // Initialize managers
  const lobbyManager = new LobbyManager(io, db);
  const gameManager = new GameManager(io, db, lobbyManager);

  // Setup routes
  setupAuthRoutes(app, db);
  setupApiRoutes(app, db, lobbyManager, gameManager);

  // Setup socket handlers
  setupSocketHandlers(io, db, lobbyManager, gameManager);

  // Serve the main app
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🎲 SUPER JOJO PARTY SERVER 🌟                         ║
║                                                           ║
║     Server running on port ${PORT}                          ║
║     Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      closeDatabase();
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
