import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './auth.js';
import { dbHelpers } from '../database/index.js';
import { SHOP_ITEMS } from '../game/ShopData.js';
import { achievementManager } from '../game/AchievementManager.js';
import { Achievements, AchievementCategories, RarityColors } from '../game/AchievementData.js';
import { MINIGAMES } from '../game/MinigameData.js';

export function setupApiRoutes(app, db, lobbyManager, gameManager) {
  const router = Router();
  const auth = authMiddleware();

  // Get minigames list (public - no auth required for lobby selection)
  router.get('/minigames', (req, res) => {
    try {
      // Return simplified minigame info for selection
      const minigames = MINIGAMES.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        description: m.description,
        is3D: m.is3D,
        icon: m.type === 'ffa' ? '\u{1F3AE}' : m.type === 'team' ? '\u{1F465}' : m.type === 'duel' ? '\u{2694}' : '\u{1F3B2}'
      }));
      res.json({ minigames });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get minigames' });
    }
  });

  // Get all achievements (public - for displaying in profile)
  router.get('/achievements', (req, res) => {
    try {
      const achievementList = Object.values(Achievements).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        rarity: a.rarity,
        target: a.target,
        reward: a.reward
      }));
      res.json({ achievements: achievementList, categories: AchievementCategories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get achievements' });
    }
  });

  // Get player profile with full stats
  router.get('/profile', auth, (req, res) => {
    try {
      const user = dbHelpers.getUserById(req.user.userId);
      const profile = dbHelpers.getProfile(req.user.userId);
      const inventory = dbHelpers.getInventory(req.user.userId);
      const credits = dbHelpers.getCredits(req.user.userId);
      const stats = dbHelpers.getStats(req.user.userId);
      
      // Get user's achievement progress
      const userAchievements = achievementManager.getAchievementsWithProgress(req.user.userId);

      // Get unlocked characters (jojo is always unlocked, plus purchased ones)
      const ownedCharacters = ['jojo'];
      inventory.forEach(item => {
        if (item.item_type === 'character') {
          ownedCharacters.push(item.item_id);
        }
      });

      res.json({
        profile,
        inventory,
        credits,
        stats: stats || {
          games_played: 0,
          games_won: 0,
          total_stars: 0,
          total_coins: 0,
          minigames_won: 0
        },
        achievements: userAchievements,
        ownedCharacters,
        isGuest: user?.is_guest === 1,
        username: user?.username
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // Update profile settings
  router.put('/profile', auth, (req, res) => {
    try {
      // Check if user is a guest - guests can update character selection but it won't persist after logout
      const user = dbHelpers.getUserById(req.user.userId);
      
      const { selected_character, selected_hat, selected_trail, selected_emote, favorite_character } = req.body;
      const updates = {};

      // Validate owned items
      if (selected_character) {
        if (dbHelpers.hasItem(req.user.userId, 'character', selected_character)) {
          updates.selected_character = selected_character;
        }
      }
      if (selected_hat !== undefined) {
        if (selected_hat === null || dbHelpers.hasItem(req.user.userId, 'hat', selected_hat)) {
          updates.selected_hat = selected_hat;
        }
      }
      if (selected_trail !== undefined) {
        if (selected_trail === null || dbHelpers.hasItem(req.user.userId, 'trail', selected_trail)) {
          updates.selected_trail = selected_trail;
        }
      }
      if (selected_emote) {
        if (dbHelpers.hasItem(req.user.userId, 'emote', selected_emote)) {
          updates.selected_emote = selected_emote;
        }
      }
      if (favorite_character) {
        updates.favorite_character = favorite_character;
      }

      if (Object.keys(updates).length > 0) {
        dbHelpers.updateProfile(req.user.userId, updates);
      }

      res.json({ success: true, updates });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Get settings
  router.get('/settings', auth, (req, res) => {
    try {
      const settings = dbHelpers.getSettings(req.user.userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  // Update settings
  router.put('/settings', auth, (req, res) => {
    try {
      const allowedSettings = [
        'master_volume', 'music_volume', 'sfx_volume', 'voice_volume',
        'graphics_quality', 'reduced_motion', 'ui_scale', 'show_tutorial',
        'camera_sensitivity'
      ];

      const updates = {};
      for (const key of allowedSettings) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      if (Object.keys(updates).length > 0) {
        dbHelpers.updateSettings(req.user.userId, updates);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Get shop items (optional auth - guests can browse but not see owned status)
  router.get('/shop', (req, res) => {
    try {
      // Optional auth check
      const authHeader = req.headers.authorization;
      let ownedItems = new Set();
      let userCredits = 0;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-jojo-party-secret-key-2024');
          const inventory = dbHelpers.getInventory(decoded.userId);
          ownedItems = new Set(inventory.map(i => `${i.item_type}:${i.item_id}`));
          userCredits = dbHelpers.getCredits(decoded.userId);
        } catch (e) {
          // Invalid token - just show shop without owned status
        }
      }

      const shopItems = SHOP_ITEMS.map(item => ({
        ...item,
        owned: ownedItems.has(`${item.type}:${item.id}`)
      }));

      res.json({
        items: shopItems,
        credits: userCredits
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get shop' });
    }
  });

  // Purchase shop item
  router.post('/shop/purchase', auth, (req, res) => {
    try {
      // Check if user is a guest
      const user = dbHelpers.getUserById(req.user.userId);
      if (user?.is_guest) {
        return res.status(403).json({ error: 'Guests cannot make purchases. Please create an account!' });
      }

      const { itemId, itemType } = req.body;

      // Find item in shop
      const shopItem = SHOP_ITEMS.find(i => i.id === itemId && i.type === itemType);
      if (!shopItem) {
        return res.status(400).json({ error: 'Item not found' });
      }

      // Check if already owned
      if (dbHelpers.hasItem(req.user.userId, itemType, itemId)) {
        return res.status(400).json({ error: 'Item already owned' });
      }

      // Check credits
      const credits = dbHelpers.getCredits(req.user.userId);
      if (credits < shopItem.price) {
        return res.status(400).json({ error: 'Not enough credits' });
      }

      // Purchase
      if (dbHelpers.spendCredits(req.user.userId, shopItem.price)) {
        dbHelpers.addItem(req.user.userId, itemType, itemId);
        
        // Check character collection achievement
        if (itemType === 'character') {
          const inventory = dbHelpers.getInventory(req.user.userId);
          const characterCount = inventory.filter(i => i.item_type === 'character').length;
          if (characterCount >= 5) {
            achievementManager.updateProgress(req.user.userId, 'collect_5_characters', characterCount);
          }
          if (characterCount >= 12) {
            achievementManager.unlockAchievement(req.user.userId, 'collect_all_characters');
          }
        }
        
        res.json({
          success: true,
          newCredits: dbHelpers.getCredits(req.user.userId)
        });
      } else {
        res.status(400).json({ error: 'Purchase failed' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Purchase failed' });
    }
  });

  // Get public lobbies
  router.get('/lobbies', auth, (req, res) => {
    try {
      const lobbies = lobbyManager.getPublicLobbies();
      res.json({ lobbies });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get lobbies' });
    }
  });

  // Get leaderboard
  router.get('/leaderboard', (req, res) => {
    try {
      const type = req.query.type || 'stars';
      let query;

      switch (type) {
        case 'wins':
          query = `SELECT u.username, p.games_won as value FROM profiles p 
                   JOIN users u ON p.user_id = u.id 
                   ORDER BY p.games_won DESC LIMIT 100`;
          break;
        case 'minigames':
          query = `SELECT u.username, p.minigames_won as value FROM profiles p 
                   JOIN users u ON p.user_id = u.id 
                   ORDER BY p.minigames_won DESC LIMIT 100`;
          break;
        case 'stars':
        default:
          query = `SELECT u.username, p.total_stars as value FROM profiles p 
                   JOIN users u ON p.user_id = u.id 
                   ORDER BY p.total_stars DESC LIMIT 100`;
      }

      const leaderboard = dbHelpers.all(query);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  });

  // Get match history
  router.get('/history', auth, (req, res) => {
    try {
      const matches = dbHelpers.all(`
        SELECT mh.*, mp.final_position, mp.final_stars, mp.final_coins, mp.credits_earned
        FROM match_history mh
        JOIN match_participants mp ON mh.id = mp.match_id
        WHERE mp.user_id = ?
        ORDER BY mh.ended_at DESC
        LIMIT 50
      `, [req.user.userId]);

      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  });

  // Get boards data
  router.get('/boards', (req, res) => {
    res.json(gameManager.getBoardsData());
  });

  // Get minigames data
  router.get('/minigames', (req, res) => {
    res.json({ minigames: gameManager.getMinigamesData() });
  });

  // Get single minigame data (for practice mode)
  router.get('/minigames/:id', (req, res) => {
    const minigame = gameManager.getMinigameById(req.params.id);
    if (!minigame) {
      return res.status(404).json({ error: 'Minigame not found' });
    }
    res.json({ minigame });
  });

  // Get characters data
  router.get('/characters', (req, res) => {
    res.json(gameManager.getCharactersData());
  });

  // ============== Achievement Routes ==============

  // Get all achievements with user progress
  router.get('/achievements', auth, (req, res) => {
    try {
      const achievements = achievementManager.getAchievementsWithProgress(req.user.userId);
      const unlockedCount = achievements.filter(a => a.unlocked).length;
      const totalCount = achievements.length;

      res.json({
        achievements,
        categories: AchievementCategories,
        rarityColors: RarityColors,
        stats: {
          unlocked: unlockedCount,
          total: totalCount,
          percentage: Math.round((unlockedCount / totalCount) * 100)
        }
      });
    } catch (error) {
      console.error('Failed to get achievements:', error);
      res.status(500).json({ error: 'Failed to get achievements' });
    }
  });

  // Get achievement by ID
  router.get('/achievements/:id', auth, (req, res) => {
    try {
      const achievement = Achievements[req.params.id];
      if (!achievement) {
        return res.status(404).json({ error: 'Achievement not found' });
      }

      const userAchievement = dbHelpers.getAchievement(req.user.userId, req.params.id);
      
      res.json({
        ...achievement,
        progress: userAchievement?.progress || 0,
        unlocked: userAchievement?.unlocked === 1,
        unlockedAt: userAchievement?.unlocked_at
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get achievement' });
    }
  });

  // Get achievement stats summary
  router.get('/achievements/stats/summary', auth, (req, res) => {
    try {
      const achievements = achievementManager.getAchievementsWithProgress(req.user.userId);
      
      // Group by category
      const byCategory = {};
      for (const cat of Object.values(AchievementCategories)) {
        const categoryAchievements = achievements.filter(a => a.category === cat.id);
        byCategory[cat.id] = {
          name: cat.name,
          icon: cat.icon,
          unlocked: categoryAchievements.filter(a => a.unlocked).length,
          total: categoryAchievements.length
        };
      }

      // Group by rarity
      const byRarity = {};
      for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
        const rarityAchievements = achievements.filter(a => a.rarity === rarity);
        byRarity[rarity] = {
          color: RarityColors[rarity],
          unlocked: rarityAchievements.filter(a => a.unlocked).length,
          total: rarityAchievements.length
        };
      }

      // Recent unlocks
      const recentUnlocks = achievements
        .filter(a => a.unlocked && a.unlockedAt)
        .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
        .slice(0, 5);

      res.json({
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length,
        byCategory,
        byRarity,
        recentUnlocks
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get achievement stats' });
    }
  });

  app.use('/api', router);
}
