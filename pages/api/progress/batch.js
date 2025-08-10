import { ProgressService, getUserId } from '@/utils/progress';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { kanji } = req.body;

    if (!kanji || !Array.isArray(kanji) || kanji.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid kanji array provided'
      });
    }

    const userId = await getUserId(req, res);
    const masteryLevels = await ProgressService.getBatchKanjiMastery(userId, kanji);
    
    res.status(200).json({ success: true, data: masteryLevels });
  } catch (error) {
    console.error('API Error in batch progress:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}