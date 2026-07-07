import { getUserId } from '@/services/user';
import { ProgressUpdateService } from '@/services/tests/progressupdateService';

const service = new ProgressUpdateService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const referer = req.headers.referer || req.headers.origin;
  if (!referer || !referer.includes(req.headers.host)) {
    return res.redirect(307, '/404');
  }

  try {
    const userId = await getUserId(req, res);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { kanjiId, isCorrect } = req.body;
    const result = await service.updateProgress(userId, kanjiId, isCorrect, 'review');
    
    res.status(200).json(result);

  } catch (error) {
    if (error.message === 'Progress record not found') {
      return res.status(404).json({ success: false, error: error.message });
    } else if (error.message.includes('Missing')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    console.error('Review update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}