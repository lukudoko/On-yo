// utils/vocabtest.js
import { prisma } from '@/lib/prisma';
import { getTestableKanji } from '@/utils/reviewtest';

export async function getVocabTestItems(userId, limit = 15) {
  // Get testable kanji (same as review test)
  const testableKanji = await getTestableKanji(userId, limit * 2); // get extra for filtering
  
  if (testableKanji.length === 0) return [];

  const vocabItems = [];

  // Shuffle testable kanji
  const shuffledKanji = [...testableKanji].sort(() => 0.5 - Math.random());

  for (const progress of shuffledKanji) {
    const word = await prisma.exampleWord.findFirst({
      where: { kanjiId: progress.kanjiId },
      select: { id: true, word: true, reading: true, meaning: true }
    });

    if (!word) continue;

    const kanjiChar = progress.kanji.character;
    const jlptLevel = progress.kanji.jlpt_new;

    // ✅ Randomly choose test type (60% write-in, 40% MCQ)
    const isWriteIn = Math.random() < 0.6;

    if (isWriteIn) {
      // Write-in: "___ぶ" → user types "なん"
      // Only support if kanji is at START of word (simplest case)
      if (word.word.startsWith(kanjiChar)) {
        const kanjiReadingLength = getKanjiReadingLength(kanjiChar, word.reading);
        if (kanjiReadingLength > 0) {
          const visible = word.reading.slice(kanjiReadingLength);
          const prompt = '＿'.repeat(kanjiReadingLength) + visible;
          const correctAnswer = word.reading.slice(0, kanjiReadingLength);

          vocabItems.push({
            wordId: word.id,
            kanjiId: progress.kanjiId,
            testType: 'write-in',
            prompt: prompt,
            correctAnswer: correctAnswer,
            word: word.word,
            meaning: word.meaning
          });
        }
      }
    } else {
      // Multiple-choice: "___部" → user picks kanji
      const blankedWord = '___' + word.word.substring(1);

      // Get 2 wrong kanji (for 3 total options)
      const wrongKanji = await prisma.kanji.findMany({
        where: {
          jlpt_new: jlptLevel,
          character: { not: kanjiChar }
        },
        select: { character: true },
        take: 10
      });

      const wrongOptions = wrongKanji
        .sort(() => 0.5 - Math.random())
        .slice(0, 2) // ← only 2 wrong options
        .map(k => k.character);

      const multipleChoiceOptions = [
        kanjiChar,
        ...wrongOptions
      ].sort(() => 0.5 - Math.random());

      vocabItems.push({
        wordId: word.id,
        kanjiId: progress.kanjiId,
        testType: 'multiple-choice',
        reading: word.reading,
        blankedWord: blankedWord,
        correctAnswer: kanjiChar,
        multipleChoiceOptions: multipleChoiceOptions,
        meaning: word.meaning
      });
    }

    if (vocabItems.length >= limit) break;
  }

  // If we don't have enough, shuffle and take what we have
  return vocabItems.slice(0, limit);
}

// 🔤 Helper: Estimate kanji reading length (simple version)
function getKanjiReadingLength(kanjiChar, fullReading) {
  // This is imperfect but works for many cases
  // We'll use common onyomi lengths as a guess
  
  // Common onyomi patterns:
  const commonReadings = {
    '行': ['こう', 'ぎょう'],
    '南': ['なん'],
    '銀': ['ぎん'],
    '学': ['がく'],
    '生': ['せい', 'しょう'],
    // Add more as needed...
  };

  const readings = commonReadings[kanjiChar] || [];
  
  for (const reading of readings) {
    if (fullReading.startsWith(reading)) {
      return reading.length;
    }
  }

  // Fallback: assume 2-3 characters
  return Math.min(3, fullReading.length);
}