export async function getDiscoveryKanji(userId, track, jlptLevel, limit) {

  let baseKanjiWhere = {};
  if (track === 'jlpt') {
    baseKanjiWhere.jlpt_new = jlptLevel;
  }

  const allKanjiInScope = await prisma.kanji.findMany({
    where: baseKanjiWhere,
    select: { id: true, character: true, primary_onyomi: true, jlpt_new: true }
  });

  const kanjiIdsInScope = allKanjiInScope.map(k => k.id);

  const userProgressRecords = await prisma.userProgress.findMany({
    where: {
      userId: userId,
      kanjiId: { in: kanjiIdsInScope }
    },
    select: { kanjiId: true, masteryLevel: true }
  });

  const progressMap = {};
  userProgressRecords.forEach(p => {
    progressMap[p.kanjiId] = p.masteryLevel;
  });

  const unlearnedKanji = allKanjiInScope.filter(kanji => {
    const mastery = progressMap[kanji.id];
    return mastery === undefined || mastery === 0;
  });

  if (unlearnedKanji.length === 0) return [];

  await Promise.all(
    unlearnedKanji.map(kanji =>
      prisma.userProgress.upsert({
        where: { userId_kanjiId: { userId, kanjiId: kanji.id } },
        update: {},
        create: { userId, kanjiId: kanji.id, masteryLevel: 0, testStreak: 0 }
      })
    )
  );

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

  let knownInGroup = await prisma.userProgress.findMany({
    where: {
      userId: userId,
      masteryLevel: 2,
      kanji: { primary_onyomi: onyomi }
    },
    include: {
      kanji: { select: { character: true } }
    }
  });

  if (knownInGroup.length === 0) {
    knownInGroup = await prisma.userProgress.findMany({
      where: {
        userId: userId,
        masteryLevel: 1,
        kanji: { primary_onyomi: onyomi }
      },
      include: {
        kanji: { select: { character: true } }
      }
    });
  }

  if (knownInGroup.length === 0) {
    continue;
  }

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