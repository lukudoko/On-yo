import { prisma } from '@/lib/prisma';
import { updateStreak } from '@/utils/streak';

export class ProgressUpdateService {
  constructor() {
    // Define the different update strategies for each test type
    this.strategies = {
      discovery: this.discoveryStrategy.bind(this),
      review: this.reviewStrategy.bind(this),
      vocab: this.vocabStrategy.bind(this)
    };
  }

  async updateProgress(userId, kanjiId, isCorrect, testType = 'review') {
    // Validate inputs
    if (!kanjiId || typeof isCorrect !== 'boolean') {
      throw new Error('Missing kanjiId or isCorrect');
    }

    // Find existing progress
    const progress = await prisma.userProgress.findUnique({
      where: { userId_kanjiId: { userId, kanjiId } }
    });

    if (!progress) {
      throw new Error('Progress record not found');
    }

    // Get the strategy for this test type
    const strategy = this.strategies[testType];
    if (!strategy) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    // Apply the specific strategy
    const { newMasteryLevel, newStreak, additionalData = {} } = await strategy(
      progress, 
      isCorrect, 
      userId
    );

    // Update the database
    const updated = await prisma.userProgress.update({
      where: { userId_kanjiId: { userId, kanjiId } },
      data: {
        testStreak: newStreak,
        masteryLevel: newMasteryLevel,
        lastStudied: new Date()
      }
    });

    // Format response
    return {
      success: true,
      updatedProgress: {
        ...updated,
        lastStudied: updated.lastStudied.toISOString()
      },
      ...additionalData
    };
  }

  // Discovery test strategy: Simple promotion from 0 to 1
  async discoveryStrategy(progress, isCorrect, userId) {
    // Discovery only updates if mastery is 0 (unseen)
    if (progress.masteryLevel !== 0) {
      return {
        newMasteryLevel: progress.masteryLevel,
        newStreak: progress.testStreak,
        additionalData: {}
      };
    }

    let newMasteryLevel = 0;
    let newStreak = 0;

    if (isCorrect) {
      newMasteryLevel = 1;
      newStreak = 1;
    }

    return { newMasteryLevel, newStreak, additionalData: {} };
  }

  // Review test strategy: Complex streak/mastery system
  async reviewStrategy(progress, isCorrect, userId) {
    let newStreak = isCorrect
      ? Math.min(7, progress.testStreak + 1)
      : Math.max(-3, progress.testStreak - 1);

    let newMasteryLevel = progress.masteryLevel;

    if (progress.masteryLevel === 1 && newStreak >= 7) {
      newMasteryLevel = 2;
      newStreak = 0;
    } else if (progress.masteryLevel === 1 && newStreak <= -3) {
      newMasteryLevel = 0;
      newStreak = 0;
    } else if (progress.masteryLevel === 2 && newStreak >= 7) {
      newMasteryLevel = 2;
      newStreak = 7;
    } else if (progress.masteryLevel === 2 && newStreak <= -3) {
      newMasteryLevel = 1;
      newStreak = 0;
    }

    // Update user streak after successful update
    await updateStreak(userId);

    return { newMasteryLevel, newStreak, additionalData: {} };
  }

  // Vocab test strategy: With cooldown protection
  async vocabStrategy(progress, isCorrect, userId) {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const wasTestedRecently = progress.lastStudied > twelveHoursAgo;

    let newStreak = progress.testStreak;
    let newMasteryLevel = progress.masteryLevel;

    if (!wasTestedRecently) {
      newStreak = isCorrect
        ? Math.min(7, progress.testStreak + 1)
        : Math.max(-3, progress.testStreak - 1);

      if (progress.masteryLevel === 1 && newStreak >= 7) {
        newMasteryLevel = 2;
        newStreak = 0;
      } else if (progress.masteryLevel === 1 && newStreak <= -3) {
        newMasteryLevel = 0;
        newStreak = 0;
      } else if (progress.masteryLevel === 2 && newStreak >= 7) {
        newMasteryLevel = 2;
        newStreak = 7;
      } else if (progress.masteryLevel === 2 && newStreak <= -3) {
        newMasteryLevel = 1;
        newStreak = 0;
      }

      await updateStreak(userId);
    }

    return { 
      newMasteryLevel, 
      newStreak, 
      additionalData: { wasTestedRecently } 
    };
  }
}