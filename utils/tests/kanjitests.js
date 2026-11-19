import { prisma } from '@/lib/prisma';
import { REVIEW_COOLDOWN_MS, VOCAB_COOLDOWN_MS } from '@/lib/testOptions';

async function getDueProgress(userId, cooldownMs, type = 'kanji') {
  const cutoff = new Date(Date.now() - cooldownMs);
  const lastStudiedField = type === 'vocab' ? 'lastStudiedVocab' : 'lastStudiedKanji';

  return prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] },
      testStreak: { lt: 7 },
      OR: [
        { [lastStudiedField]: { lte: cutoff } },
        { [lastStudiedField]: null }, 
      ],
    },
    include: { kanji: true },
    orderBy: [{ masteryLevel: 'asc' }, { [lastStudiedField]: 'asc' }],
  });
}

function selectKanjiWithRatio(allTestable, limit) {
  const learningKanji = allTestable.filter(k => k.masteryLevel === 1);
  const knownKanji = allTestable.filter(k => k.masteryLevel === 2);

  let selected = [];

  if (learningKanji.length > 0) {
    const maxLearning = Math.min(limit, learningKanji.length);
    const targetLearning = Math.min(maxLearning, Math.max(1, Math.ceil(limit * 0.4)));
    const shuffled = [...learningKanji].sort(() => 0.5 - Math.random());
    selected.push(...shuffled.slice(0, targetLearning));
  }

  const remainingSlots = limit - selected.length;
  if (remainingSlots > 0 && knownKanji.length > 0) {
    const shuffled = [...knownKanji].sort(() => 0.5 - Math.random());
    selected.push(...shuffled.slice(0, Math.min(remainingSlots, knownKanji.length)));
  }

  if (selected.length < limit) {
    const usedIds = new Set(selected.map(k => k.kanjiId));
    const remainingLearning = learningKanji.filter(k => !usedIds.has(k.kanjiId));
    if (remainingLearning.length > 0) {
      const shuffled = [...remainingLearning].sort(() => 0.5 - Math.random());
      const needed = limit - selected.length;
      selected.push(...shuffled.slice(0, Math.min(needed, remainingLearning.length)));
    }
  }

  return [...selected].sort(() => 0.5 - Math.random());
}

export async function getTestableKanji(userId, limit = 15) {
  const allTestable = await getDueProgress(userId, REVIEW_COOLDOWN_MS, 'kanji');
  if (allTestable.length === 0) return [];
  if (allTestable.length <= limit) return allTestable;
  return selectKanjiWithRatio(allTestable, limit);
}

export async function getTestableKanjiForVocab(userId, limit = 30) {
  const allTestable = await getDueProgress(userId, VOCAB_COOLDOWN_MS, 'vocab');
  if (allTestable.length === 0) return [];
  if (allTestable.length <= limit) return allTestable;
  return selectKanjiWithRatio(allTestable, limit);
}

export async function handleTestResult(userId, kanjiId, isCorrect, testType = 'kanji') {
  const progress = await prisma.userProgress.findUnique({
    where: { userId_kanjiId: { userId, kanjiId } },
  });

  if (!progress) throw new Error('Progress not found');

  const lastStudiedDate = testType === 'vocab' ? progress.lastStudiedVocab : progress.lastStudiedKanji;
  const daysSinceLastStudy = lastStudiedDate 
    ? (Date.now() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24) 
    : 999;

  let baseStreak = progress.testStreak;

  if (daysSinceLastStudy > 30 && progress.testStreak > 0) {
    const decay = Math.min(progress.testStreak, Math.floor(daysSinceLastStudy / 30));
    baseStreak = Math.max(0, progress.testStreak - decay);
  }

  let newStreak = isCorrect ? Math.min(7, baseStreak + 1) : Math.max(-3, baseStreak - 1);
  let newMastery = progress.masteryLevel;

  if (progress.masteryLevel === 1 && newStreak >= 7) {
    newMastery = 2; newStreak = 0;
  } else if (progress.masteryLevel === 1 && newStreak <= -3) {
    newMastery = 0; newStreak = 0;
  } else if (progress.masteryLevel === 2 && newStreak >= 7) {
    newMastery = 2; newStreak = 7;
  } else if (progress.masteryLevel === 2 && newStreak <= -3) {
    newMastery = 1; newStreak = 0;
  }

  const now = new Date();
  const updateData = { 
    testStreak: newStreak, 
    masteryLevel: newMastery,
    // 🌟 THE FIX: Update BOTH timestamps to enforce a global cooldown
    lastStudiedKanji: now,
    lastStudiedVocab: now,
  };

  return prisma.userProgress.update({
    where: { userId_kanjiId: { userId, kanjiId } },
    data: updateData,
  });
}

export async function getVocabTestItems(userId, limit = 30) {
  const testableKanji = await getTestableKanjiForVocab(userId, Math.ceil(limit * 2.5));
  if (testableKanji.length === 0) return [];

  const kanjiIds = testableKanji.map(p => p.kanjiId);
  const jlptLevels = [...new Set(testableKanji.map(p => p.kanji.jlpt_new))];

  const allWords = await prisma.exampleWord.findMany({
    where: { kanjiId: { in: kanjiIds } },
    select: { id: true, word: true, reading: true, meaning: true, kanjiId: true }
  });
  const wordsByKanji = new Map();
  allWords.forEach(w => {
    if (!wordsByKanji.has(w.kanjiId)) wordsByKanji.set(w.kanjiId, []);
    wordsByKanji.get(w.kanjiId).push(w);
  });

  const allJlptKanji = await prisma.kanji.findMany({
    where: { jlpt_new: { in: jlptLevels } },
    select: { character: true, jlpt_new: true }
  });
  const wrongKanjiByLevel = new Map();
  allJlptKanji.forEach(k => {
    if (!wrongKanjiByLevel.has(k.jlpt_new)) wrongKanjiByLevel.set(k.jlpt_new, []);
    wrongKanjiByLevel.get(k.jlpt_new).push(k.character);
  });

  const vocabItems = [];
  const shuffledKanji = [...testableKanji].sort(() => 0.5 - Math.random());

  for (const progress of shuffledKanji) {
    const words = wordsByKanji.get(progress.kanjiId) || [];
    if (words.length === 0) continue;

    const randomWord = words[Math.floor(Math.random() * words.length)];
    const kanjiChar = progress.kanji.character;
    const wordStr = randomWord.word;
    const kanjiIndex = wordStr.indexOf(kanjiChar);

    if (kanjiIndex === -1) continue;

    const isWriteIn = Math.random() < 0.5;
    let itemCreated = false;

    if (isWriteIn) {
      const primaryOnyomi = progress.kanji.readings_on?.[0];
      if (primaryOnyomi) {
        let prompt, correctAnswer;

        if (kanjiIndex === 0 && randomWord.reading.length >= primaryOnyomi.length) {
          prompt = '＿'.repeat(primaryOnyomi.length) + randomWord.reading.substring(primaryOnyomi.length);
          correctAnswer = primaryOnyomi;
          itemCreated = true;
        } else if (kanjiIndex === wordStr.length - 1 && randomWord.reading.length >= primaryOnyomi.length) {
          const visiblePart = randomWord.reading.substring(0, randomWord.reading.length - primaryOnyomi.length);
          prompt = visiblePart + '＿'.repeat(primaryOnyomi.length);
          correctAnswer = primaryOnyomi;
          itemCreated = true;
        }

        if (itemCreated) {
          vocabItems.push({
            wordId: randomWord.id, kanjiId: progress.kanjiId, testType: 'write-in',
            prompt, correctAnswer, word: randomWord.word, meaning: randomWord.meaning, fullreading: randomWord.reading
          });
        }
      }
    }

    if (!itemCreated) {
      const blankedWord = wordStr.substring(0, kanjiIndex) + '_' + wordStr.substring(kanjiIndex + 1);
      
      const levelWrongKanji = wrongKanjiByLevel.get(progress.kanji.jlpt_new) || [];
      const wrongOptions = levelWrongKanji
        .filter(char => char !== kanjiChar)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      vocabItems.push({
        wordId: randomWord.id, kanjiId: progress.kanjiId, testType: 'multiple-choice',
        reading: randomWord.reading, blankedWord, correctAnswer: kanjiChar,
        multipleChoiceOptions: [kanjiChar, ...wrongOptions].sort(() => 0.5 - Math.random()),
        meaning: randomWord.meaning, targetReadingPart: progress.kanji.readings_on?.[0] || '',
      });
    }

    if (vocabItems.length >= limit) break;
  }

  return vocabItems.slice(0, limit);
}


export async function prepareReviewItems(selectedKanji, userId) {
  const allGroups = await prisma.onyomiGroup.findMany({ select: { reading: true } });
  const allReadings = allGroups.map(g => g.reading);

  const learningKanji = selectedKanji.filter(p => p.masteryLevel === 1);
  const primaryOnyomis = learningKanji.map(p => p.kanji.primary_onyomi);
  
  let groupKanjiMap = new Map();
  if (primaryOnyomis.length > 0) {
    const groupKanji = await prisma.kanji.findMany({
      where: { primary_onyomi: { in: primaryOnyomis } },
      include: { progress: { where: { userId, masteryLevel: 2 } } }
    });
    
    groupKanji.forEach(k => {
      if (!groupKanjiMap.has(k.primary_onyomi)) groupKanjiMap.set(k.primary_onyomi, []);
      if (k.progress.length > 0) {
        groupKanjiMap.get(k.primary_onyomi).push(k.character);
      }
    });
  }

  const kanjiWithOptions = await Promise.all(selectedKanji.map(async (progress) => {
    const isWriteIn = Math.random() < 0.5;
    let multipleChoiceOptions = [];

    if (!isWriteIn) {
      const wrongReadings = allReadings
        .filter(r => r !== progress.kanji.primary_onyomi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      multipleChoiceOptions = [progress.kanji.primary_onyomi, ...wrongReadings].sort(() => 0.5 - Math.random());
    }

    let hints = [];
    if (progress.masteryLevel === 1) {
      hints = (groupKanjiMap.get(progress.kanji.primary_onyomi) || [])
        .filter(char => char !== progress.kanji.character)
        .slice(0, 2);
    }

    return {
      ...progress,
      testType: isWriteIn ? 'write-in' : 'multiple-choice',
      multipleChoiceOptions,
      correctAnswer: progress.kanji.primary_onyomi,
      hints,
    };
  }));

  let mcCount = kanjiWithOptions.filter(k => k.testType === 'multiple-choice').length;
  let wiCount = kanjiWithOptions.filter(k => k.testType === 'write-in').length;

  if (mcCount < 5) {
    const writeIns = kanjiWithOptions.filter(k => k.testType === 'write-in');
    const toConvert = Math.min(writeIns.length, 5 - mcCount);
    for (let i = 0; i < toConvert; i++) {
      writeIns[i].testType = 'multiple-choice';
      const wrongReadings = allReadings.filter(r => r !== writeIns[i].kanji.primary_onyomi).sort(() => 0.5 - Math.random()).slice(0, 2);
      writeIns[i].multipleChoiceOptions = [writeIns[i].kanji.primary_onyomi, ...wrongReadings].sort(() => 0.5 - Math.random());
    }
  }

  if (wiCount < 3) {
    const multipleChoices = kanjiWithOptions.filter(k => k.testType === 'multiple-choice');
    const toConvert = Math.min(multipleChoices.length, 3 - wiCount);
    for (let i = 0; i < toConvert; i++) {
      multipleChoices[i].testType = 'write-in';
      multipleChoices[i].multipleChoiceOptions = [];
    }
  }

  return kanjiWithOptions;
}

export async function debugTestableCounts(userId) {
  const kanjiDue = await getDueProgress(userId, REVIEW_COOLDOWN_MS, 'kanji');
  const vocabDue = await getDueProgress(userId, VOCAB_COOLDOWN_MS, 'vocab');
  
  const kanjiIds = kanjiDue.map(p => p.kanjiId);
  const vocabIds = vocabDue.map(p => p.kanjiId);
  const overlap = kanjiIds.filter(id => vocabIds.includes(id));

  console.log('=== 🀄 KANJI TEST DEBUG INFO ===');
  console.log(`Total Kanji Review Due: ${kanjiDue.length}`);
  console.log(`Total Vocab Review Due: ${vocabDue.length}`);
  console.log(`Overlap (Due for BOTH): ${overlap.length}`);
  console.log('===============================');

  return { 
    kanjiCount: kanjiDue.length, 
    vocabCount: vocabDue.length, 
    overlapCount: overlap.length,
    overlapIds: overlap
  };
}