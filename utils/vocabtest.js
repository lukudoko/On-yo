import { prisma } from '@/lib/prisma';

export async function getTestableKanjiForVocab(userId, limit = 30) {
  const now = new Date();
  const vocabCooldown = 3 * 60 * 60 * 1000; 

  const allTestable = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] },
      OR: [
        {
          masteryLevel: 1,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - vocabCooldown) }
        },
        {
          masteryLevel: 2,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - vocabCooldown) }
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

  selected = [...selected].sort(() => 0.5 - Math.random());
  return selected;
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
        let prompt, correctAnswer;

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
          meaning: randomWord.meaning
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