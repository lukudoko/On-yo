import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { jlptLevel } = req.query;
    const jlptNum = jlptLevel ? parseInt(jlptLevel) : 5; // Default to N5

    // Get onyomi groups that contain kanji of this JLPT level, ordered by usefulness
    const onyomiGroups = await prisma.onyomiGroup.findMany({
      where: {
        kanji: {
          some: {
            jlpt_new: jlptNum
          }
        }
      },
      select: {
        reading: true,
        usefulness_score: true,
        _count: {
          select: {
            kanji: {
              where: {
                jlpt_new: jlptNum
              }
            }
          }
        }
      },
      orderBy: {
        usefulness_score: 'desc'  // Most useful groups first
      }
    });

    // Transform the data for easier consumption
    const formattedGroups = onyomiGroups.map(group => ({
      reading: group.reading,
      usefulness_score: group.usefulness_score,
      kanjiCount: group._count.kanji,
      jlptLevel: jlptNum
    }));

    res.status(200).json({
      success: true,
       data:{
        groups: formattedGroups,
        currentJlptLevel: jlptNum,
        totalGroups: formattedGroups.length
      }
    });

  } catch (error) {
    console.error('API Error in JLPT:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}