import { prisma } from '@/lib/prisma';
import { updateStreak } from '@/utils/streak';

export class ProgressUpdateService {
  constructor() {
    this.strategies = {
      discovery: this.discoveryStrategy.bind(this),
      review: this.reviewStrategy.bind(this),
      vocab: this.vocabStrategy.bind(this)
    };
  }

  async updateProgress(userId, kanjiId, isCorrect, testType = 'review', clientLocalDate = null) {
    if (!kanjiId || typeof isCorrect !== 'boolean') {
      throw new Error('Missing kanjiId or isCorrect');
    }

    const progress = await prisma.userProgress.findUnique({
      where: { userId_kanjiId: { userId, kanjiId } }
    });

    if (!progress) {
      throw new Error('Progress record not found');
    }

    const strategy = this.strategies[testType];
    if (!strategy) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const { newMasteryLevel, newStreak, additionalData = {} } = await strategy(
      progress,
      isCorrect,
      userId,
      clientLocalDate
    );

    // Update the correct timestamp based on test type
    const timestampField = testType === 'vocab' ? 'lastStudiedVocab' : 'lastStudiedKanji';

    const updated = await prisma.userProgress.update({
      where: { userId_kanjiId: { userId, kanjiId } },
      data: {
        testStreak: newStreak,
        masteryLevel: newMasteryLevel,
        [timestampField]: new Date()
      }
    });

    return {
      success: true,
      updatedProgress: {
        ...updated,
        [timestampField]: updated[timestampField].toISOString()
      },
      ...additionalData
    };
  }

  async discoveryStrategy(progress, isCorrect, userId) {
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

  async reviewStrategy(progress, isCorrect, userId, clientLocalDate) {
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

    await updateStreak(userId, clientLocalDate);

    return { newMasteryLevel, newStreak, additionalData: {} };
  }

  async vocabStrategy(progress, isCorrect, userId, clientLocalDate) {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    // Now checks the VOCAB timestamp specifically
    const wasTestedRecently = progress.lastStudiedVocab && progress.lastStudiedVocab > twelveHoursAgo;

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

      await updateStreak(userId, clientLocalDate);
    }

    return {
      newMasteryLevel,
      newStreak,
      additionalData: { wasTestedRecently }
    };
  }
}