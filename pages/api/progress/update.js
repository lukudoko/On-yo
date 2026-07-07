import { getUserId } from '@/services/user';
import { updateKanjiProgress } from '@/services/progress/updateService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const referer = req.headers.referer || req.headers.origin;
  if (!referer || !referer.includes(req.headers.host)) {
    return res.redirect(307, '/404');
  }

  try {
    const { kanji, masteryLevel } = req.body;
    const userId = await getUserId(req, res);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await updateKanjiProgress(userId, kanji, masteryLevel);
    res.status(200).json({ success: true, result });

  } catch (error) {
    console.error('API Error in update progress:', error);
    if (error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}