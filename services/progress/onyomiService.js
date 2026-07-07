import { prisma } from '@/lib/prisma';

export async function getOnyomiGroupProgress(onyomi, jlptFilter = null) {
  const whereClause = {
    primary_onyomi: onyomi
  };

  if (jlptFilter) {
    const jlptNum = parseInt(jlptFilter.replace('N', ''));
    if (!isNaN(jlptNum) && [1, 2, 3, 4, 5].includes(jlptNum)) {
      whereClause.jlpt_new = jlptNum;
    }
  }

  const groupKanji = await prisma.kanji.findMany({
    where: whereClause,
    orderBy: [
      { jlpt_new: 'desc' },
      { freq: 'asc' }
    ],
    select: {
      character: true,
      meanings: true,
      readings_on: true,
      readings_kun: true,
      freq: true,
      jlpt_new: true,
      exampleWords: {
        select: {
          word: true,
          reading: true,
          meaning: true
        },
        take: 6
      }
    }
  });

  if (groupKanji.length === 0) {
    throw new Error('Onyomi group not found');
  }

  return groupKanji.map(kanji => ({
    kanji: kanji.character,
    meanings: kanji.meanings,
    readings_on: kanji.readings_on,
    readings_kun: kanji.readings_kun,
    freq_score: kanji.freq,
    jlpt_new: kanji.jlpt_new,
    exampleWords: kanji.exampleWords || []
  }));
}