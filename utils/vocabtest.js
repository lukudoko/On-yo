// utils/vocabtest.js
import { prisma } from '@/lib/prisma';

// Reuse your existing getTestableKanji logic
async function getTestableKanjiForVocab(userId, limit = 15) {
  const now = new Date();
  const learningCooldown = 12 * 60 * 60 * 1000; // 12 hours

  // Get testable kanji (same as review test)
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
    select: { kanjiId: true, masteryLevel: true },
    orderBy: [
      { masteryLevel: 'asc' },
      { lastStudied: 'asc' }
    ]
  });

  if (allTestable.length === 0) return [];

  // Apply same mixing logic: ~40% learning, rest mastered
  const learningKanji = allTestable.filter(k => k.masteryLevel === 1);
  const knownKanji = allTestable.filter(k => k.masteryLevel === 2);

  let selected = [];
  const targetLearning = Math.max(1, Math.min(limit, Math.ceil(limit * 0.4)));

  if (learningKanji.length > 0) {
    const shuffled = [...learningKanji].sort(() => 0.5 - Math.random());
    selected.push(...shuffled.slice(0, targetLearning));
  }

  const remaining = limit - selected.length;
  if (remaining > 0 && knownKanji.length > 0) {
    const shuffled = [...knownKanji].sort(() => 0.5 - Math.random());
    selected.push(...shuffled.slice(0, Math.min(remaining, knownKanji.length)));
  }

  // Fill if needed
  if (selected.length < limit) {
    const allShuffled = [...allTestable].sort(() => 0.5 - Math.random());
    const usedIds = new Set(selected.map(k => k.kanjiId));
    const remainingKanji = allShuffled.filter(k => !usedIds.has(k.kanjiId));
    selected.push(...remainingKanji.slice(0, limit - selected.length));
  }

  return selected.slice(0, limit);
}

export async function getVocabTestItems(userId, limit = 15) {
  const testableKanji = await getTestableKanjiForVocab(userId, limit);
  if (testableKanji.length === 0) return [];

  const vocabItems = [];

  for (const { kanjiId } of testableKanji) {
    // Get ONE example word for this kanji
    const word = await prisma.exampleWord.findFirst({
      where: { kanjiId: kanjiId },
      select: { id: true, word: true, reading: true, meaning: true }
    });

    if (!word) continue; // skip if no example word

    const kanjiChar = await prisma.kanji.findUnique({
      where: { id: kanjiId },
      select: { character: true }
    });

    if (kanjiChar) {
      const blankedWord = word.word.replace(kanjiChar.character, '[？]');
      vocabItems.push({
        wordId: word.id,
        kanjiId: kanjiId, // ← needed for streak update
        prompt: word.reading,
        blankedWord: blankedWord,
        correctAnswer: kanjiChar.character,
        meaning: word.meaning
      });
    }

    if (vocabItems.length >= limit) break;
  }

  return vocabItems;
}