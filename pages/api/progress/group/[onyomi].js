import { ProgressService, getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { onyomi } = req.query;
    
    if (!onyomi) {
      return res.status(400).json({ 
        success: false, 
        error: 'Onyomi parameter required' 
      });
    }

    const userId = await getUserId(req, res);

    // Get group kanji data
    const groupKanji = await prisma.kanji.findMany({
      where: {
        primary_onyomi: onyomi
      },
      orderBy: {
        freq: 'asc'
      },
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
          take: 5
        }
      }
    });

    if (groupKanji.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Onyomi group not found' 
      });
    }

    // Get mastery levels if user is authenticated
    let masteryLevels = {};
    if (userId) {
      const kanjiCharacters = groupKanji.map(k => k.character);
      masteryLevels = await ProgressService.getBatchKanjiMastery(userId, kanjiCharacters);
    }

    const transformedKanji = groupKanji.map(kanji => ({
      kanji: kanji.character,
      meanings: kanji.meanings,
      readings_on: kanji.readings_on,
      readings_kun: kanji.readings_kun,
      freq_score: kanji.freq,
      jlpt_new: kanji.jlpt_new,
      exampleWords: kanji.exampleWords || []
    }));

    res.status(200).json({
      success: true,
      data: {
        groupKanji: transformedKanji,
        onyomi: onyomi,
        masteryLevels: masteryLevels
      }
    });

  } catch (error) {
    console.error('API Error in onyomi group:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}