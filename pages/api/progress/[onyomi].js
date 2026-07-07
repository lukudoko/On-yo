import { getUserId } from '@/services/user';
import { ProgressService } from '@/services/progress';
import { getOnyomiGroupProgress } from '@/services/progress/onyomiService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { onyomi, jlpt } = req.query;

    if (!onyomi) {
      return res.status(400).json({
        success: false,
        error: 'Onyomi parameter required'
      });
    }

    const userId = await getUserId(req, res);
    const groupKanji = await getOnyomiGroupProgress(onyomi, jlpt);
    let masteryLevels = {};
    if (userId) {
      const kanjiCharacters = groupKanji.map(k => k.kanji);
      masteryLevels = await ProgressService.getBatchKanjiMastery(userId, kanjiCharacters);
    }

    res.status(200).json({
      success: true,
      data: {
        groupKanji,
        onyomi,
        masteryLevels,
        jlptFilter: jlpt || null
      }
    });

  } catch (error) {
    if (error.message === 'Onyomi group not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    console.error('API Error in onyomi group:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}