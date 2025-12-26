/**
 * Super JoJo Party - Database Module
 * Uses sql.js (pure JavaScript SQLite) - no native compilation required
 */

import initSqlJs from 'sql.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let dbPath = null;
let saveInterval = null;

// Save database to file periodically
function saveDatabase() {
  if (db && dbPath) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }
}

export async function initDatabase() {
  // Ensure data directory exists
  const dataDir = join(__dirname, '../../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  dbPath = process.env.DATABASE_PATH || join(dataDir, 'game.db');
  
  // Initialize sql.js
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (existsSync(dbPath)) {
    try {
      const fileBuffer = readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('📦 Loaded existing database');
    } catch (err) {
      console.log('📦 Creating new database (existing file corrupted)');
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('📦 Created new database');
  }

  // Create tables
  db.run(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      is_guest INTEGER DEFAULT 0,
      credits INTEGER DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    -- User profiles/statistics
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      total_stars INTEGER DEFAULT 0,
      total_coins INTEGER DEFAULT 0,
      minigames_won INTEGER DEFAULT 0,
      minigames_played INTEGER DEFAULT 0,
      overseer_encounters INTEGER DEFAULT 0,
      overseer_wins INTEGER DEFAULT 0,
      total_distance INTEGER DEFAULT 0,
      favorite_character TEXT DEFAULT 'jojo',
      selected_character TEXT DEFAULT 'jojo',
      selected_hat TEXT DEFAULT NULL,
      selected_trail TEXT DEFAULT NULL,
      selected_emote TEXT DEFAULT 'wave',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- User owned content
    CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_type, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- User settings
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      master_volume REAL DEFAULT 1.0,
      music_volume REAL DEFAULT 0.8,
      sfx_volume REAL DEFAULT 1.0,
      voice_volume REAL DEFAULT 1.0,
      graphics_quality TEXT DEFAULT 'high',
      reduced_motion INTEGER DEFAULT 0,
      ui_scale REAL DEFAULT 1.0,
      show_tutorial INTEGER DEFAULT 1,
      camera_sensitivity REAL DEFAULT 1.0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Match history
    CREATE TABLE IF NOT EXISTS match_history (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      turns INTEGER NOT NULL,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      winner_id TEXT,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Match participants
    CREATE TABLE IF NOT EXISTS match_participants (
      match_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      final_position INTEGER,
      final_stars INTEGER,
      final_coins INTEGER,
      credits_earned INTEGER DEFAULT 0,
      PRIMARY KEY (match_id, user_id),
      FOREIGN KEY (match_id) REFERENCES match_history(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Session tokens
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- User achievements
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      unlocked INTEGER DEFAULT 0,
      unlocked_at TEXT,
      notified INTEGER DEFAULT 0,
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_match_history_winner ON match_history(winner_id);`);

  // Save database immediately and set up periodic saving
  saveDatabase();
  saveInterval = setInterval(saveDatabase, 30000); // Save every 30 seconds

  console.log('📦 Database initialized successfully');
  return db;
}

// Get the database instance
export function getDB() {
  return db;
}

// Close database and save
export function closeDatabase() {
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  saveDatabase();
  if (db) {
    db.close();
  }
}

// Helper functions for database operations
export const dbHelpers = {
  // Run a query and return all results
  all: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error('DB all error:', err);
      return [];
    }
  },

  // Run a query and return first result
  get: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    } catch (err) {
      console.error('DB get error:', err);
      return null;
    }
  },

  // Run a query (INSERT, UPDATE, DELETE)
  run: (sql, params = []) => {
    try {
      db.run(sql, params);
      return { changes: db.getRowsModified(), lastInsertRowid: null };
    } catch (err) {
      console.error('DB run error:', err);
      return { changes: 0, lastInsertRowid: null };
    }
  },

  // User operations
  getUserById: (id) => dbHelpers.get('SELECT * FROM users WHERE id = ?', [id]),
  getUserByUsername: (username) => dbHelpers.get('SELECT * FROM users WHERE username = ?', [username]),
  
  createUser: (id, username, email, passwordHash, isGuest = false) => {
    dbHelpers.run(
      'INSERT INTO users (id, username, email, password_hash, is_guest) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, passwordHash, isGuest ? 1 : 0]
    );
    // Create profile and settings
    dbHelpers.run('INSERT INTO profiles (user_id) VALUES (?)', [id]);
    dbHelpers.run('INSERT INTO user_settings (user_id) VALUES (?)', [id]);
    // Give default items (only jojo is free, mimi must be purchased)
    const defaultItems = [
      ['character', 'jojo'],
      ['emote', 'wave'], ['emote', 'dance']
    ];
    defaultItems.forEach(([type, itemId]) => {
      dbHelpers.run('INSERT OR IGNORE INTO user_inventory (user_id, item_type, item_id) VALUES (?, ?, ?)', [id, type, itemId]);
    });
    saveDatabase();
  },

  // Profile operations
  getProfile: (userId) => dbHelpers.get('SELECT * FROM profiles WHERE user_id = ?', [userId]),
  
  getStats: (userId) => {
    const profile = dbHelpers.get('SELECT games_played, games_won, total_stars, total_coins, minigames_won, minigames_played FROM profiles WHERE user_id = ?', [userId]);
    return profile || {
      games_played: 0,
      games_won: 0,
      total_stars: 0,
      total_coins: 0,
      minigames_won: 0,
      minigames_played: 0
    };
  },
  
  updateProfile: (userId, updates) => {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), userId];
    dbHelpers.run(`UPDATE profiles SET ${fields} WHERE user_id = ?`, values);
    saveDatabase();
  },

  // Settings operations
  getSettings: (userId) => dbHelpers.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]),
  
  updateSettings: (userId, settings) => {
    const fields = Object.keys(settings).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(settings), userId];
    dbHelpers.run(`UPDATE user_settings SET ${fields} WHERE user_id = ?`, values);
    saveDatabase();
  },

  // Inventory operations
  getInventory: (userId) => dbHelpers.all('SELECT * FROM user_inventory WHERE user_id = ?', [userId]),
  
  hasItem: (userId, itemType, itemId) => {
    return dbHelpers.get(
      'SELECT 1 as has FROM user_inventory WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [userId, itemType, itemId]
    );
  },
  
  addItem: (userId, itemType, itemId) => {
    dbHelpers.run(
      'INSERT OR IGNORE INTO user_inventory (user_id, item_type, item_id) VALUES (?, ?, ?)',
      [userId, itemType, itemId]
    );
    saveDatabase();
  },

  // Credits operations
  getCredits: (userId) => {
    const user = dbHelpers.get('SELECT credits FROM users WHERE id = ?', [userId]);
    return user ? user.credits : 0;
  },
  
  addCredits: (userId, amount) => {
    dbHelpers.run('UPDATE users SET credits = credits + ? WHERE id = ?', [amount, userId]);
    saveDatabase();
  },
  
  spendCredits: (userId, amount) => {
    const user = dbHelpers.get('SELECT credits FROM users WHERE id = ?', [userId]);
    if (user && user.credits >= amount) {
      dbHelpers.run('UPDATE users SET credits = credits - ? WHERE id = ?', [amount, userId]);
      saveDatabase();
      return true;
    }
    return false;
  },

  // Session operations
  createSession: (token, userId, expiresAt) => {
    dbHelpers.run(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, userId, expiresAt]
    );
    saveDatabase();
  },
  
  getSession: (token) => dbHelpers.get('SELECT * FROM sessions WHERE token = ?', [token]),
  
  deleteSession: (token) => {
    dbHelpers.run('DELETE FROM sessions WHERE token = ?', [token]);
    saveDatabase();
  },
  
  cleanExpiredSessions: () => {
    dbHelpers.run('DELETE FROM sessions WHERE expires_at < datetime("now")');
    saveDatabase();
  },

  // Statistics update
  updateStats: (userId, stats) => {
    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value === 'number' && value > 0) {
        updates.push(`${key} = ${key} + ?`);
        values.push(value);
      }
    }
    if (updates.length > 0) {
      values.push(userId);
      dbHelpers.run(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`, values);
      saveDatabase();
    }
  },

  // Match history
  createMatch: (matchId, boardId, turns) => {
    dbHelpers.run(
      'INSERT INTO match_history (id, board_id, turns) VALUES (?, ?, ?)',
      [matchId, boardId, turns]
    );
    saveDatabase();
  },
  
  endMatch: (matchId, winnerId) => {
    dbHelpers.run(
      'UPDATE match_history SET ended_at = datetime("now"), winner_id = ? WHERE id = ?',
      [winnerId, matchId]
    );
    saveDatabase();
  },
  
  addMatchParticipant: (matchId, userId, position, stars, coins, credits) => {
    dbHelpers.run(
      'INSERT INTO match_participants (match_id, user_id, final_position, final_stars, final_coins, credits_earned) VALUES (?, ?, ?, ?, ?, ?)',
      [matchId, userId, position, stars, coins, credits]
    );
    saveDatabase();
  },
  
  getMatchHistory: (userId, limit = 10) => {
    return dbHelpers.all(`
      SELECT mh.*, mp.final_position, mp.final_stars, mp.final_coins, mp.credits_earned
      FROM match_history mh
      JOIN match_participants mp ON mh.id = mp.match_id
      WHERE mp.user_id = ?
      ORDER BY mh.started_at DESC
      LIMIT ?
    `, [userId, limit]);
  },

  // Achievement operations
  getAchievements: (userId) => {
    return dbHelpers.all('SELECT * FROM user_achievements WHERE user_id = ?', [userId]);
  },

  getAchievement: (userId, achievementId) => {
    return dbHelpers.get(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );
  },

  updateAchievementProgress: (userId, achievementId, progress, target) => {
    // Check if achievement exists for user
    const existing = dbHelpers.get(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    if (!existing) {
      // Create new achievement progress
      const unlocked = progress >= target ? 1 : 0;
      dbHelpers.run(
        'INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at) VALUES (?, ?, ?, ?, ?)',
        [userId, achievementId, progress, unlocked, unlocked ? new Date().toISOString() : null]
      );
      saveDatabase();
      return { newlyUnlocked: unlocked === 1, progress, target };
    }

    // Already unlocked, no need to update
    if (existing.unlocked) {
      return { newlyUnlocked: false, progress: existing.progress, target };
    }

    // Update progress
    const newProgress = Math.min(progress, target);
    const unlocked = newProgress >= target ? 1 : 0;
    dbHelpers.run(
      'UPDATE user_achievements SET progress = ?, unlocked = ?, unlocked_at = ? WHERE user_id = ? AND achievement_id = ?',
      [newProgress, unlocked, unlocked ? new Date().toISOString() : null, userId, achievementId]
    );
    saveDatabase();
    return { newlyUnlocked: unlocked === 1 && !existing.unlocked, progress: newProgress, target };
  },

  incrementAchievementProgress: (userId, achievementId, amount, target) => {
    const existing = dbHelpers.get(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    const currentProgress = existing ? existing.progress : 0;
    const newProgress = Math.min(currentProgress + amount, target);
    
    return dbHelpers.updateAchievementProgress(userId, achievementId, newProgress, target);
  },

  getUnnotifiedAchievements: (userId) => {
    return dbHelpers.all(
      'SELECT * FROM user_achievements WHERE user_id = ? AND unlocked = 1 AND notified = 0',
      [userId]
    );
  },

  markAchievementNotified: (userId, achievementId) => {
    dbHelpers.run(
      'UPDATE user_achievements SET notified = 1 WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );
    saveDatabase();
  }
};
