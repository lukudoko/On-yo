import { prisma } from '@/lib/prisma';

export async function getDiscoveryKanji(userId, track, jlptLevel, limit) {

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


  for (const kanji of unlearnedKanji) {
    await prisma.userProgress.upsert({
      where: { userId_kanjiId: { userId, kanjiId: kanji.id } },
      update: {}, // do nothing if exists
      create: { userId, kanjiId: kanji.id, masteryLevel: 0, testStreak: 0 }
    });
  }

  const onyomiGroups = {};
  unlearnedKanji.forEach(k => {
    if (!onyomiGroups[k.primary_onyomi]) {
      onyomiGroups[k.primary_onyomi] = [];
    }
    onyomiGroups[k.primary_onyomi].push(k);
  });

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

  testableKanji.sort((a, b) => b.usefulnessScore - a.usefulnessScore);

  return testableKanji.slice(0, limit);
}
