import { prisma } from '@/lib/prisma';
import { REVIEW_COOLDOWN_MS, VOCAB_COOLDOWN_MS } from '@/lib/testOptions';

async function getDueProgress(userId, cooldownMs) {
  const cutoff = new Date(Date.now() - cooldownMs);

  return prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] },
      testStreak: { lt: 7 },
      lastStudied: { lte: cutoff },
    },
    include: { kanji: true },
    orderBy: [{ masteryLevel: 'asc' }, { lastStudied: 'asc' }],
  });
}

function selectKanjiWithRatio(allTestable, limit) {
  const learningKanji = allTestable.filter(k => k.masteryLevel === 1);
  const knownKanji = allTestable.filter(k => k.masteryLevel === 2);

  let selected = [];

  if (learningKanji.length > 0) {
    const maxLearning = Math.min(limit, learningKanji.length);
    const targetLearning = Math.min(
      maxLearning,
      Math.max(1, Math.ceil(limit * 0.4))
    );
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
  const now = new Date();

  const masteredToDecay = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: 2,
      testStreak: 7,
      lastStudied: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  for (const progress of masteredToDecay) {
    await prisma.userProgress.update({
      where: { userId_kanjiId: { userId, kanjiId: progress.kanjiId } },
      data: { testStreak: 6 },
    });
  }

  const allTestable = await getDueProgress(userId, REVIEW_COOLDOWN_MS);

  if (allTestable.length === 0) return [];
  if (allTestable.length <= limit) return allTestable;

  return selectKanjiWithRatio(allTestable, limit);
}

export async function getTestableKanjiForVocab(userId, limit = 30) {
  const allTestable = await getDueProgress(userId, VOCAB_COOLDOWN_MS);

  if (allTestable.length === 0) return [];
  if (allTestable.length <= limit) return allTestable;

  return selectKanjiWithRatio(allTestable, limit);
}

export async function handleTestResult(userId, kanjiId, isCorrect) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId_kanjiId: { userId, kanjiId } },
  });

  if (!progress) throw new Error('Progress not found');

  const daysSinceLastStudy =
    (Date.now() - progress.lastStudied.getTime()) / (1000 * 60 * 60 * 24);
  let baseStreak = progress.testStreak;

  if (daysSinceLastStudy > 30 && progress.testStreak > 0) {
    const decay = Math.min(progress.testStreak, Math.floor(daysSinceLastStudy / 30));
    baseStreak = Math.max(0, progress.testStreak - decay);
  }

  let newStreak = isCorrect ? Math.min(7, baseStreak + 1) : Math.max(-3, baseStreak - 1);
  let newMastery = progress.masteryLevel;

  if (progress.masteryLevel === 1 && newStreak >= 7) {
    newMastery = 2;
    newStreak = 0;
  } else if (progress.masteryLevel === 1 && newStreak <= -3) {
    newMastery = 0;
    newStreak = 0;
  } else if (progress.masteryLevel === 2 && newStreak >= 7) {
    newMastery = 2;
    newStreak = 7;
  } else if (progress.masteryLevel === 2 && newStreak <= -3) {
    newMastery = 1;
    newStreak = 0;
  }

  return prisma.userProgress.update({
    where: { userId_kanjiId: { userId, kanjiId } },
    data: { testStreak: newStreak, masteryLevel: newMastery, lastStudied: new Date() },
  });
}

export async function getVocabTestItems(userId, limit = 30) {
  const testableKanji = await getTestableKanjiForVocab(userId, Math.ceil(limit * 2.5));

  if (testableKanji.length === 0) return [];

  const vocabItems = [];
  const shuffledKanji = [...testableKanji].sort(() => 0.5 - Math.random());

  for (const progress of shuffledKanji) {

    const allWords = await prisma.exampleWord.findMany({
      where: { kanjiId: progress.kanjiId },
      select: { id: true, word: true, reading: true, meaning: true }
    });

    if (allWords.length === 0) continue;

    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];

    const kanjiChar = progress.kanji.character;
    const wordStr = randomWord.word;
    const kanjiIndex = wordStr.indexOf(kanjiChar);

    if (kanjiIndex === -1) continue;

    const isWriteIn = Math.random() < 0.5;

    if (isWriteIn) {
      const primaryOnyomi = progress.kanji.readings_on?.[0];

      if (primaryOnyomi) {
        let prompt, correctAnswer, fullreading;

        if (kanjiIndex === 0) {
          if (randomWord.reading.length >= primaryOnyomi.length) {
            prompt = '＿'.repeat(primaryOnyomi.length) + randomWord.reading.substring(primaryOnyomi.length);
            correctAnswer = primaryOnyomi;
          } else {
            continue;
          }
        }
        else if (kanjiIndex === wordStr.length - 1) {
          if (randomWord.reading.length >= primaryOnyomi.length) {
            const visiblePart = randomWord.reading.substring(0, randomWord.reading.length - primaryOnyomi.length);
            prompt = visiblePart + '＿'.repeat(primaryOnyomi.length);
            correctAnswer = primaryOnyomi;
          } else {
            continue;
          }
        }
        else {
          continue;
        }

        vocabItems.push({
          wordId: randomWord.id,
          kanjiId: progress.kanjiId,
          testType: 'write-in',
          prompt: prompt,
          correctAnswer: correctAnswer,
          word: randomWord.word,
          meaning: randomWord.meaning,
          fullreading: randomWord.reading
        });
      }
    }

    if (isWriteIn && vocabItems.length > 0 && vocabItems[vocabItems.length - 1].kanjiId === progress.kanjiId) {

    } else {
      const blankedWord =
        randomWord.word.substring(0, kanjiIndex) +
        '_' +
        randomWord.word.substring(kanjiIndex + 1);

      const wrongKanji = await prisma.kanji.findMany({
        where: {
          jlpt_new: progress.kanji.jlpt_new,
          character: { not: kanjiChar }
        },
        select: { character: true },
        take: 10
      });

      const wrongOptions = wrongKanji
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(k => k.character);

      const multipleChoiceOptions = [
        kanjiChar,
        ...wrongOptions
      ].sort(() => 0.5 - Math.random());

      vocabItems.push({
        wordId: randomWord.id,
        kanjiId: progress.kanjiId,
        testType: 'multiple-choice',
        reading: randomWord.reading,
        blankedWord: blankedWord,
        correctAnswer: kanjiChar,
        multipleChoiceOptions: multipleChoiceOptions,
        meaning: randomWord.meaning,
        targetReadingPart: progress.kanji.readings_on?.[0] || '',
      });
    }

    if (vocabItems.length >= limit) break;
  }

  return vocabItems.slice(0, limit);
}


export async function prepareReviewItems(selectedKanji, userId) {
  const allGroups = await prisma.onyomiGroup.findMany({ select: { reading: true } });
  const allReadings = allGroups.map(g => g.reading);

  const kanjiWithOptions = await Promise.all(selectedKanji.map(async (progress) => {
    const isWriteIn = Math.random() < 0.5;

    let multipleChoiceOptions = [];
    if (!isWriteIn) {
      const wrongReadings = allReadings
        .filter(r => r !== progress.kanji.primary_onyomi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      multipleChoiceOptions = [
        progress.kanji.primary_onyomi,
        ...wrongReadings
      ].sort(() => 0.5 - Math.random());
    }

    let hints = [];
    if (progress.masteryLevel === 1) {
      const sameGroupKanji = await prisma.kanji.findMany({
        where: { primary_onyomi: progress.kanji.primary_onyomi },
        include: { progress: { where: { userId } } }
      });
      const knownInGroup = sameGroupKanji
        .filter(k => k.progress.length > 0 && k.progress[0].masteryLevel === 2)
        .map(k => k.character);
      hints = knownInGroup.slice(0, 2);
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
      const wrongReadings = allReadings
        .filter(r => r !== writeIns[i].kanji.primary_onyomi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      writeIns[i].multipleChoiceOptions = [
        writeIns[i].kanji.primary_onyomi,
        ...wrongReadings
      ].sort(() => 0.5 - Math.random());
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