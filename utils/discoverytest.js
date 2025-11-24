// utils/discoverytest.js
import { prisma } from '@/lib/prisma';

export async function getDiscoveryKanji(userId, track, jlptLevel, limit = 20) {
  // Build kanji filter
  let kanjiWhere = {
    progress: {
      every: {
        userId: userId,
        masteryLevel: 0
      }
    }
  };

  if (track === 'jlpt') {
    kanjiWhere.jlpt_new = jlptLevel;
  }

  const unlearnedKanji = await prisma.kanji.findMany({
    where: kanjiWhere,
    select: {
      id: true,
      character: true,
      primary_onyomi: true,
      jlpt_new: true
    }
  });

  if (unlearnedKanji.length === 0) return [];

  // Group by onyomi
  const onyomiGroups = {};
  unlearnedKanji.forEach(k => {
    if (!onyomiGroups[k.primary_onyomi]) {
      onyomiGroups[k.primary_onyomi] = [];
    }
    onyomiGroups[k.primary_onyomi].push(k);
  });

  // Get usefulness scores
  const allGroups = await prisma.onyomiGroup.findMany({
    select: { reading: true, usefulness_score: true }
  });
  const usefulnessMap = {};
  allGroups.forEach(g => {
    usefulnessMap[g.reading] = g.usefulness_score;
  });

  const testableKanji = [];

  for (const [onyomi, kanjiList] of Object.entries(onyomiGroups)) {
    const knownInGroup = await prisma.userProgress.findMany({
      where: {
        userId: userId,
        masteryLevel: { gte: 1 },
        kanji: { primary_onyomi: onyomi }
      },
      include: {
        kanji: { select: { character: true } }
      }
    });

    if (knownInGroup.length === 0) continue;

    const knownCharacters = knownInGroup.map(p => p.kanji.character);
    const usefulness = usefulnessMap[onyomi] || 0;

    kanjiList.forEach(kanji => {
      testableKanji.push({
        id: kanji.id,
        character: kanji.character,
        onyomi: onyomi,
        knownPeers: knownCharacters,
        usefulnessScore: usefulness,
        jlpt: kanji.jlpt_new
      });
    });
  }

  // ✅ NO SHUFFLE — just sort
  if (track === 'jlpt') {
    // Keep order as returned by DB (you can later sort by group usefulness if desired)
    // For now: stable order
  } else {
    // Stats track: sort by usefulness (descending)
    testableKanji.sort((a, b) => b.usefulnessScore - a.usefulnessScore);
  }

  return testableKanji.slice(0, limit);
}