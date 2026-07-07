import { prisma } from '@/lib/prisma';

export async function getTestableKanji(userId, limit = 15) {
  const now = new Date();
  const learningCooldown = 12 * 60 * 60 * 1000;
  const masteredKanji = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: 2,
      testStreak: 7,
      lastStudied: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }
  });

  for (const progress of masteredKanji) {
    await prisma.userProgress.update({
      where: {
        userId_kanjiId: { userId, kanjiId: progress.kanjiId }
      },
      data: { testStreak: 6 }
    });
  }

  const allTestable = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] },
      OR: [

        {
          masteryLevel: 1,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - learningCooldown) }
        },

        {
          masteryLevel: 2,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - learningCooldown) }
        }
      ]
    },
    include: {
      kanji: true
    },
    orderBy: [
      { masteryLevel: 'asc' },
      { lastStudied: 'asc' }
    ]
  });

  if (allTestable.length === 0) {
    return [];
  }

  if (allTestable.length <= limit) {
    return allTestable;
  }

  const learningKanji = allTestable.filter(k => k.masteryLevel === 1);
  const knownKanji = allTestable.filter(k => k.masteryLevel === 2);

  let selected = [];

  if (learningKanji.length > 0) {

    const maxLearningToInclude = Math.min(limit, learningKanji.length);

    const targetLearningCount = Math.min(
      maxLearningToInclude,
      Math.max(1, Math.ceil(limit * 0.4))
    );

    const shuffledLearning = [...learningKanji].sort(() => 0.5 - Math.random());
    const selectedLearning = shuffledLearning.slice(0, targetLearningCount);
    selected.push(...selectedLearning);
  }

  const remainingSlots = limit - selected.length;
  if (remainingSlots > 0 && knownKanji.length > 0) {
    const shuffledKnown = [...knownKanji].sort(() => 0.5 - Math.random());
    const selectedKnown = shuffledKnown.slice(0, Math.min(remainingSlots, knownKanji.length));
    selected.push(...selectedKnown);
  }

  if (selected.length < limit) {
    const usedLearningIds = new Set(selected.filter(k => k.masteryLevel === 1).map(k => k.kanjiId));
    const remainingLearning = learningKanji.filter(k => !usedLearningIds.has(k.kanjiId));

    if (remainingLearning.length > 0) {
      const shuffledRemaining = [...remainingLearning].sort(() => 0.5 - Math.random());
      const needed = limit - selected.length;
      const toAdd = shuffledRemaining.slice(0, Math.min(needed, remainingLearning.length));
      selected.push(...toAdd);
    }
  }

  selected = [...selected].sort(() => 0.5 - Math.random());
  return selected;
}

export async function handleTestResult(userId, kanjiId, isCorrect) {
  const progress = await prisma.userProgress.findUnique({
    where: {
      userId_kanjiId: { userId, kanjiId }
    }
  });

  if (!progress) {
    console.error('Progress not found for user:', userId, 'kanji:', kanjiId);
    throw new Error('Progress not found');
  }

  const timeSinceLastStudy = Date.now() - progress.lastStudied.getTime();
  const daysSinceLastStudy = timeSinceLastStudy / (1000 * 60 * 60 * 24);

  let baseStreak = progress.testStreak;

  if (daysSinceLastStudy > 30 && progress.testStreak > 0) {
    const decayAmount = Math.min(progress.testStreak, Math.floor(daysSinceLastStudy / 30));
    baseStreak = Math.max(0, progress.testStreak - decayAmount);
  }

  let newStreak = isCorrect ? Math.min(7, baseStreak + 1) : Math.max(-3, baseStreak - 1);
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

  const updated = await prisma.userProgress.update({
    where: {
      userId_kanjiId: { userId, kanjiId }
    },
    data: {
      testStreak: newStreak,
      masteryLevel: newMasteryLevel,
      lastStudied: new Date()
    }
  });

  return updated;
}