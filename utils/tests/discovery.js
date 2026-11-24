import { prisma } from '@/lib/prisma';

export async function getDiscoveryKanji(userId, track, jlptLevel, limit) {
  const unlearnedKanji = await prisma.kanji.findMany({
    where: {
      ...(track === 'jlpt' ? { jlpt_new: jlptLevel } : {}),
      progress: {
        none: {
          userId: userId,
          masteryLevel: { gt: 0 }
        }
      }
    },
    select: {
      id: true,
      character: true,
      primary_onyomi: true,
      jlpt_new: true,
    },
  });

  if (unlearnedKanji.length === 0) return [];

  const existingProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      kanjiId: { in: unlearnedKanji.map(k => k.id) },
    },
    select: { kanjiId: true },
  });
  const existingIds = new Set(existingProgress.map(p => p.kanjiId));
  const newRecords = unlearnedKanji
    .filter(k => !existingIds.has(k.id))
    .map(k => ({
      userId,
      kanjiId: k.id,
      masteryLevel: 0,
      testStreak: 0,
    }));

  if (newRecords.length > 0) {
    await prisma.userProgress.createMany({
      data: newRecords,
      skipDuplicates: true,
    });
  }

  const allGroups = await prisma.onyomiGroup.findMany({
    select: { reading: true, usefulness_score: true },
  });
  const usefulnessMap = {};
  allGroups.forEach(g => {
    usefulnessMap[g.reading] = g.usefulness_score;
  });

  const onyomiReadings = [...new Set(unlearnedKanji.map(k => k.primary_onyomi).filter(Boolean))];
  const knownPeersByOnyomi = {};
  if (onyomiReadings.length > 0) {
    const knownProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        masteryLevel: { gte: 1 },
        kanji: { primary_onyomi: { in: onyomiReadings } },
      },
      select: {
        kanji: { select: { character: true, primary_onyomi: true } },
      },
    });

    knownProgress.forEach(({ kanji }) => {
      const onyomi = kanji.primary_onyomi;
      if (!knownPeersByOnyomi[onyomi]) knownPeersByOnyomi[onyomi] = [];
      knownPeersByOnyomi[onyomi].push(kanji.character);
    });
  }

  const testableKanji = [];
  for (const kanji of unlearnedKanji) {
    const onyomi = kanji.primary_onyomi;
    const knownPeers = knownPeersByOnyomi[onyomi];
    if (!knownPeers || knownPeers.length === 0) continue;

    testableKanji.push({
      id: kanji.id,
      character: kanji.character,
      onyomi,
      knownPeers,
      usefulnessScore: usefulnessMap[onyomi] || 0,
      jlpt: kanji.jlpt_new,
    });
  }

  const byOnyomi = new Map();
  for (const k of testableKanji) {
    if (!byOnyomi.has(k.onyomi)) byOnyomi.set(k.onyomi, []);
    byOnyomi.get(k.onyomi).push(k);
  }

  const topGroups = [...byOnyomi.entries()]
    .sort((a, b) => b[1][0].usefulnessScore - a[1][0].usefulnessScore)
    .slice(0, 10);

  const queues = topGroups.map(([, ks]) => [...ks]);
  const picked = [];
  while (picked.length < limit) {
    let added = false;
    for (const q of queues) {
      if (picked.length >= limit) break;
      if (q.length) {
        picked.push(q.shift());
        added = true;
      }
    }
    if (!added) break;
  }

  return picked;
}