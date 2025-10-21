import { prisma } from '@/lib/prisma';

export async function getTestableKanji(userId, limit = 15) {
  const COOLDOWN_HOURS = 12; // 12-hour cooldown for all kanji
  
  const now = new Date();
  
  // Get ALL testable kanji (no limit here - let selection logic handle it)
  const allTestable = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] }, // Learning and known
      testStreak: { lt: 7 }, // Exclude "trusted" kanji
      lastStudied: { lte: new Date(now.getTime() - COOLDOWN_HOURS * 60 * 60 * 1000) }
    },
    include: {
      kanji: true
    },
    orderBy: [
      { masteryLevel: 'asc' }, // Learning first
      { lastStudied: 'asc' }   // Least recently tested first
    ]
    // Remove the take: limit here - we want all available
  });

  return allTestable;
}

// Handle test result
export async function handleTestResult(userId, kanjiId, isCorrect) {
  const progress = await prisma.userProgress.findUnique({
    where: { 
      userId_kanjiId: { userId, kanjiId } 
    }
  });

  if (!progress) throw new Error('Progress not found');

  let newStreak = isCorrect ? Math.min(7, progress.testStreak + 1) : Math.max(-3, progress.testStreak - 1);
  let newMasteryLevel = progress.masteryLevel;

  // Promotion/demotion logic
  if (progress.masteryLevel === 1 && newStreak >= 7) { // Learning -> Known
    newMasteryLevel = 2;
    newStreak = 0; // Reset streak after promotion
  } else if (progress.masteryLevel === 1 && newStreak <= -3) { // Learning -> Not studied
    newMasteryLevel = 0;
    newStreak = 0; // Reset streak after demotion
  } else if (progress.masteryLevel === 2 && newStreak >= 7) { // Known -> Trusted
    // Keep as level 2 but they won't appear in getTestableKanji anymore
    newMasteryLevel = 2;
    newStreak = 7; // Cap at 7 to mark as trusted
  } else if (progress.masteryLevel === 2 && newStreak <= -3) { // Known -> Learning
    newMasteryLevel = 1;
    newStreak = 0; // Reset streak after demotion
  }

  const updated = await prisma.userProgress.update({
    where: { 
      userId_kanjiId: { userId, kanjiId } 
    },
    data: {
      testStreak: newStreak,
      masteryLevel: newMasteryLevel,
      lastStudied: new Date() // This updates the cooldown timer
    }
  });

  return updated;
}