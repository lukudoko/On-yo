import { ProgressService, getUserId } from '@/utils/progress';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { kanji, masteryLevel } = req.body;

    if (!kanji || masteryLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Kanji and masteryLevel are required'
      });
    }

    if (![0, 1, 2].includes(masteryLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mastery level. Must be 0, 1, or 2'
      });
    }

    const userId = await getUserId(req, res);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await ProgressService.updateKanjiMastery(userId, kanji, masteryLevel);

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('API Error in update progress:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}