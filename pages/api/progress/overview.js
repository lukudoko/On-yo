import { ProgressService, getUserId } from '@/utils/progress';
import { getGroupStats } from '@/utils/groupstats';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = await getUserId(req, res);
    const { type, onyomi } = req.query;

    let data;
    
    switch (type) {
      case 'overall': 
        const kanjiData = await ProgressService.getOverallProgress(userId);
        const totalGroups = await prisma.onyomiGroup.count();
        const groupStats = await getGroupStats(userId);

        data = {
          ...kanjiData, // learning, mastered, total, unlearned
          totalGroups,
          completedGroups: groupStats.completedGroups,
          inProgressGroups: groupStats.inProgressGroups
        };
        break;

      case 'all-onyomi':
        data = Object.fromEntries(await ProgressService.getAllOnyomiGroupsProgress(userId));
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Must be: overall, onyomi-group, or all-onyomi'
        });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Error in progress overview:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}