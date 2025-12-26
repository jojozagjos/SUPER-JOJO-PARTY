/**
 * Super JoJo Party - Achievement Manager
 * Handles achievement tracking, unlocking, and notifications
 */

import { dbHelpers } from '../database/index.js';
import { Achievements, getAchievement, getAchievementsForStat } from './AchievementData.js';

class AchievementManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId
  }

  // Initialize with socket.io instance
  init(io) {
    this.io = io;
  }

  // Register a user's socket for achievement notifications
  registerUserSocket(userId, socketId) {
    this.userSockets.set(userId, socketId);
  }

  // Unregister a user's socket
  unregisterUserSocket(userId) {
    this.userSockets.delete(userId);
  }

  // Check and update achievements based on stat changes
  async checkStatAchievements(userId, statName, currentValue) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return []; // Guests don't earn achievements

    const achievementIds = getAchievementsForStat(statName);
    const unlockedAchievements = [];

    for (const achievementId of achievementIds) {
      const achievement = getAchievement(achievementId);
      if (!achievement) continue;

      const result = dbHelpers.updateAchievementProgress(
        userId,
        achievementId,
        currentValue,
        achievement.target
      );

      if (result.newlyUnlocked) {
        unlockedAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString()
        });

        // Award credits if the user isn't a guest
        if (achievement.reward?.credits) {
          dbHelpers.addCredits(userId, achievement.reward.credits);
        }
      }
    }

    // Send notifications for newly unlocked achievements
    if (unlockedAchievements.length > 0) {
      this.notifyAchievements(userId, unlockedAchievements);
    }

    return unlockedAchievements;
  }

  // Unlock a specific achievement directly
  async unlockAchievement(userId, achievementId) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return null;

    const achievement = getAchievement(achievementId);
    if (!achievement) return null;

    const result = dbHelpers.updateAchievementProgress(
      userId,
      achievementId,
      achievement.target,
      achievement.target
    );

    if (result.newlyUnlocked) {
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date().toISOString()
      };

      // Award credits
      if (achievement.reward?.credits) {
        dbHelpers.addCredits(userId, achievement.reward.credits);
      }

      // Send notification
      this.notifyAchievements(userId, [unlockedAchievement]);
      return unlockedAchievement;
    }

    return null;
  }

  // Update progress for a specific achievement
  async updateProgress(userId, achievementId, progress) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return null;

    const achievement = getAchievement(achievementId);
    if (!achievement) return null;

    const result = dbHelpers.updateAchievementProgress(
      userId,
      achievementId,
      progress,
      achievement.target
    );

    if (result.newlyUnlocked) {
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date().toISOString()
      };

      // Award credits
      if (achievement.reward?.credits) {
        dbHelpers.addCredits(userId, achievement.reward.credits);
      }

      // Send notification
      this.notifyAchievements(userId, [unlockedAchievement]);
      return unlockedAchievement;
    }

    return { progress: result.progress, target: result.target };
  }

  // Increment progress for a specific achievement
  async incrementProgress(userId, achievementId, amount = 1) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return null;

    const achievement = getAchievement(achievementId);
    if (!achievement) return null;

    const result = dbHelpers.incrementAchievementProgress(
      userId,
      achievementId,
      amount,
      achievement.target
    );

    if (result.newlyUnlocked) {
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date().toISOString()
      };

      // Award credits
      if (achievement.reward?.credits) {
        dbHelpers.addCredits(userId, achievement.reward.credits);
      }

      // Send notification
      this.notifyAchievements(userId, [unlockedAchievement]);
      return unlockedAchievement;
    }

    return { progress: result.progress, target: result.target };
  }

  // Send achievement notifications via socket
  notifyAchievements(userId, achievements) {
    if (!this.io) return;

    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('achievement:unlocked', {
        achievements: achievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          rarity: a.rarity,
          reward: a.reward,
          unlockedAt: a.unlockedAt
        }))
      });

      // Mark as notified in database
      achievements.forEach(a => {
        dbHelpers.markAchievementNotified(userId, a.id);
      });
    }
  }

  // Get all achievements with user progress
  getAchievementsWithProgress(userId) {
    const userAchievements = dbHelpers.getAchievements(userId);
    const progressMap = new Map(userAchievements.map(a => [a.achievement_id, a]));

    return Object.values(Achievements).map(achievement => {
      const userProgress = progressMap.get(achievement.id);
      return {
        ...achievement,
        progress: userProgress?.progress || 0,
        unlocked: userProgress?.unlocked === 1,
        unlockedAt: userProgress?.unlocked_at
      };
    });
  }

  // Get count of unlocked achievements
  getUnlockedCount(userId) {
    const achievements = dbHelpers.getAchievements(userId);
    return achievements.filter(a => a.unlocked === 1).length;
  }

  // Get total achievement count
  getTotalCount() {
    return Object.keys(Achievements).length;
  }

  // Check for any unnotified achievements and send them
  async sendPendingNotifications(userId) {
    const pending = dbHelpers.getUnnotifiedAchievements(userId);
    if (pending.length > 0) {
      const achievements = pending.map(p => ({
        ...getAchievement(p.achievement_id),
        unlockedAt: p.unlocked_at
      })).filter(a => a.id);

      this.notifyAchievements(userId, achievements);
    }
  }

  // Called after game ends - check various game-related achievements
  async processGameEnd(userId, gameStats) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return;

    const profile = dbHelpers.getProfile(userId);
    if (!profile) return;

    // Check game completion achievements
    await this.checkStatAchievements(userId, 'games_played', profile.games_played);

    // Check win achievements if player won
    if (gameStats.won) {
      await this.checkStatAchievements(userId, 'games_won', profile.games_won);
    }

    // Check star achievements
    await this.checkStatAchievements(userId, 'total_stars', profile.total_stars);

    // Check coin achievements
    await this.checkStatAchievements(userId, 'total_coins', profile.total_coins);

    // Check minigame achievements
    await this.checkStatAchievements(userId, 'minigames_won', profile.minigames_won);

    // Check overseer achievements
    if (gameStats.overseerEncounters > 0) {
      await this.checkStatAchievements(userId, 'overseer_encounters', profile.overseer_encounters);
    }
    if (gameStats.overseerWins > 0) {
      await this.checkStatAchievements(userId, 'overseer_wins', profile.overseer_wins);
    }

    // Check comeback king achievement
    if (gameStats.won && gameStats.wasLastOnFinalTurn) {
      await this.unlockAchievement(userId, 'comeback_king');
    }
  }

  // Called after minigame ends
  async processMinigameEnd(userId, minigameStats) {
    const user = dbHelpers.getUserById(userId);
    if (!user || user.is_guest) return;

    const profile = dbHelpers.getProfile(userId);
    if (!profile) return;

    // Check minigame achievements
    if (minigameStats.won) {
      await this.checkStatAchievements(userId, 'minigames_won', profile.minigames_won);
    }

    // Check perfect score
    if (minigameStats.perfectScore) {
      await this.unlockAchievement(userId, 'perfect_minigame');
    }
  }
}

// Singleton instance
export const achievementManager = new AchievementManager();
export default achievementManager;
