import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-jojo-party-secret-key';
const TOKEN_EXPIRY = '7d';

export function setupAuthRoutes(app, db) {
  const router = Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if username exists
      const existing = dbHelpers.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Create user with profile and settings
      dbHelpers.createUser(userId, username, null, passwordHash, false);

      // Generate token
      const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

      // Store session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      dbHelpers.createSession(token, userId, expiresAt);

      // Get full profile
      const profile = dbHelpers.getProfile(userId);
      const settings = dbHelpers.getSettings(userId);
      const inventory = dbHelpers.getInventory(userId);
      const credits = dbHelpers.getCredits(userId);

      res.json({
        success: true,
        token,
        user: {
          id: userId,
          username,
          credits,
          profile,
          settings,
          inventory
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user
      const user = dbHelpers.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Update last login
      dbHelpers.run('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id]);

      // Generate token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

      // Store session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      dbHelpers.createSession(token, user.id, expiresAt);

      // Get full profile
      const profile = dbHelpers.getProfile(user.id);
      const settings = dbHelpers.getSettings(user.id);
      const inventory = dbHelpers.getInventory(user.id);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          credits: user.credits,
          profile,
          settings,
          inventory
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Validate token
  router.post('/validate', (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ valid: false });
      }

      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check session exists and not expired
      const session = dbHelpers.get(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
        [token]
      );
      if (!session) {
        return res.status(401).json({ valid: false });
      }

      // Get user data
      const user = dbHelpers.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ valid: false });
      }

      const profile = dbHelpers.getProfile(user.id);
      const settings = dbHelpers.getSettings(user.id);
      const inventory = dbHelpers.getInventory(user.id);

      res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          credits: user.credits,
          isGuest: user.is_guest === 1 || decoded.isGuest === true,
          profile,
          settings,
          inventory
        }
      });
    } catch (error) {
      console.error('Validate error:', error);
      res.status(401).json({ valid: false });
    }
  });

  // Logout
  router.post('/logout', (req, res) => {
    try {
      const { token } = req.body;
      if (token) {
        dbHelpers.deleteSession(token);
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  // Guest login (creates temporary account)
  router.post('/guest', (req, res) => {
    try {
      const guestId = uuidv4();
      const guestUsername = `Guest_${guestId.slice(0, 8)}`;
      const guestPassword = uuidv4();
      const passwordHash = bcrypt.hashSync(guestPassword, 10);

      // Create guest user
      dbHelpers.createUser(guestId, guestUsername, null, passwordHash, true);

      const token = jwt.sign({ userId: guestId, username: guestUsername, isGuest: true }, JWT_SECRET, { expiresIn: '24h' });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      dbHelpers.createSession(token, guestId, expiresAt);

      const profile = dbHelpers.getProfile(guestId);
      const settings = dbHelpers.getSettings(guestId);
      const inventory = dbHelpers.getInventory(guestId);
      const credits = dbHelpers.getCredits(guestId);

      res.json({
        success: true,
        token,
        isGuest: true,
        user: {
          id: guestId,
          username: guestUsername,
          credits,
          profile,
          settings,
          inventory
        }
      });
    } catch (error) {
      console.error('Guest login error:', error);
      res.status(500).json({ error: 'Guest login failed' });
    }
  });

  // Mount at /api/auth
  app.use('/api/auth', router);
}

// Middleware to verify authentication
export function authMiddleware() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const session = dbHelpers.get(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
        [token]
      );
      
      if (!session) {
        return res.status(401).json({ error: 'Session expired' });
      }

      req.user = decoded;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Verify socket authentication
export function verifySocketToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = dbHelpers.get(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );
    
    if (!session) {
      return null;
    }

    const user = dbHelpers.getUserById(decoded.userId);
    return user ? { ...decoded, credits: user.credits } : null;
  } catch {
    return null;
  }
}
