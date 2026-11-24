import { prisma } from '@/lib/prisma';
import { DECAY_DAYS } from '@/lib/testOptions';
import { updateStreak } from '@/utils/streak';

function applyAnswer(progress, isCorrect) {
  let newStreak = isCorrect
    ? Math.min(7, progress.testStreak + 1)
    : Math.max(-3, progress.testStreak - 1);
  let newMasteryLevel = progress.masteryLevel;

  if (progress.masteryLevel === 1 && newStreak >= 7) { newMasteryLevel = 2; newStreak = 0; }
  else if (progress.masteryLevel === 1 && newStreak <= -3) { newMasteryLevel = 0; newStreak = 0; }
  else if (progress.masteryLevel === 2 && newStreak >= 7) { newMasteryLevel = 2; newStreak = 7; }
  else if (progress.masteryLevel === 2 && newStreak <= -3) { newMasteryLevel = 1; newStreak = 0; }

  return { newStreak, newMasteryLevel };
}

export class ProgressUpdateService {
  constructor() {
    this.strategies = {
      discovery: this.discoveryStrategy.bind(this),
      review: this.reviewStrategy.bind(this),
      vocab: this.vocabStrategy.bind(this),
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

    // ---- decay block goes here, after the strategy lookup ----
    const lastStudied = [progress.lastStudiedKanji, progress.lastStudiedVocab]
      .filter(Boolean)
      .sort((a, b) => b - a)[0];
    const daysSince = lastStudied ? (Date.now() - lastStudied.getTime()) / 86_400_000 : 0;

    let effectiveProgress = progress;
    if (daysSince > DECAY_DAYS && progress.testStreak > 0) {
      const decay = Math.min(progress.testStreak, Math.floor(daysSince / DECAY_DAYS));
      effectiveProgress = { ...progress, testStreak: progress.testStreak - decay };
    }

    const { newMasteryLevel, newStreak, additionalData = {} } = await strategy(
      effectiveProgress, isCorrect, userId, clientLocalDate
    );

    const now = new Date();

    const updated = await prisma.userProgress.update({
      where: { userId_kanjiId: { userId, kanjiId } },
      data: {
        testStreak: newStreak,
        masteryLevel: newMasteryLevel,
        lastStudiedKanji: now,
        lastStudiedVocab: now,
      },
    });

    return {
      success: true,
      updatedProgress: {
        ...updated,
        lastStudiedKanji: updated.lastStudiedKanji.toISOString(),
        lastStudiedVocab: updated.lastStudiedVocab.toISOString(),
      },
      ...additionalData,
    };
  }

  async discoveryStrategy(progress, isCorrect, userId, clientLocalDate) {
    if (progress.masteryLevel !== 0) {
      return {
        newMasteryLevel: progress.masteryLevel,
        newStreak: progress.testStreak,
        additionalData: {},
      };
    }

    let newMasteryLevel = 0;
    let newStreak = 0;

    if (isCorrect) {
      newMasteryLevel = 1;
      newStreak = 1;
      await updateStreak(userId, clientLocalDate); // <--- Add this
    }

    return { newMasteryLevel, newStreak, additionalData: {} };
  }

  async reviewStrategy(progress, isCorrect, userId, clientLocalDate) {
    const { newStreak, newMasteryLevel } = applyAnswer(progress, isCorrect);
    await updateStreak(userId, clientLocalDate);
    return { newMasteryLevel, newStreak, additionalData: {} };
  }

  async vocabStrategy(progress, isCorrect, userId, clientLocalDate) {
    const { newStreak, newMasteryLevel } = applyAnswer(progress, isCorrect);
    await updateStreak(userId, clientLocalDate);
    return { newMasteryLevel, newStreak, additionalData: {} };
  }
}