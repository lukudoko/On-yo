import { getUserId } from '@/services/user';
import { getJLPTGroups } from '@/services/groups/jlptService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const referer = req.headers.referer || req.headers.origin;
  if (!referer || !referer.includes(req.headers.host)) {
    return res.redirect(307, '/404');
  }

  try {
    const { jlptLevel } = req.query;
    const userId = await getUserId(req, res);

    const result = await getJLPTGroups(userId, jlptLevel);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API Error in JLPT groups:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}