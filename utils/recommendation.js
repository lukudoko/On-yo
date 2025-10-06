import { prisma } from '@/lib/prisma';

// Helper functions for scoring
function calculateNormalizedScore(progress, totalKanji) {
  const totalPoints = (progress.mastered * 2) + (progress.learning * 1);
  const maxPossiblePoints = totalKanji * 2;
  
  return maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
}

function calculatePriorityScore(normalizedScore, usefulnessScore) {
  // If group is 95%+ complete, don't recommend it
  if (normalizedScore >= 95) return 0;
  
  // Combine completion status with usefulness
  return (normalizedScore * 10) + (usefulnessScore * 0.1);
}

export async function findIntelligentNextGroup(userId, trackType = 'all', jlptLevel = null) {
  if (!userId) {
    console.error("findIntelligentNextGroup called without userId");
    return null;
  }

  try {
    let allGroups;

    // Add track-specific filtering
    if (trackType === 'jlpt' && jlptLevel) {
      allGroups = await prisma.onyomiGroup.findMany({
        where: {
          kanji: {
            some: {
              jlpt_level: parseInt(jlptLevel)
            }
          }
        },
        select: {
          reading: true,
          usefulness_score: true,
          _count: {
            select: {
              kanji: true
            }
          }
        }
      });
    } else {
      // Get all groups
      allGroups = await prisma.onyomiGroup.findMany({
        select: {
          reading: true,
          usefulness_score: true,
          _count: {
            select: {
              kanji: true
            }
          }
        }
      });
    }

    const userProgress = await prisma.UserProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true
          }
        }
      }
    });

    const progressByGroup = new Map();
    userProgress.forEach(progress => {
      const group = progress.kanji?.primary_onyomi;
      if (!group) return;

      if (!progressByGroup.has(group)) {
        progressByGroup.set(group, { mastered: 0, learning: 0 });
      }

      const stats = progressByGroup.get(group);
      if (progress.masteryLevel === 2) stats.mastered++;
      else if (progress.masteryLevel === 1) stats.learning++;
    });

    let bestGroup = null;
    let bestPriorityScore = -1;

    for (const group of allGroups) {
      const totalKanji = group._count.kanji;
      if (totalKanji === 0) continue;

      const progress = progressByGroup.get(group.reading) || {
        mastered: 0,
        learning: 0
      };

      const normalizedScore = calculateNormalizedScore(progress, totalKanji);
      const priorityScore = calculatePriorityScore(normalizedScore, group.usefulness_score);

      if (priorityScore > bestPriorityScore) {
        bestPriorityScore = priorityScore;
        bestGroup = {
          reading: group.reading,
          usefulness_score: group.usefulness_score,
          priority_score: priorityScore,
          completion: normalizedScore
        };
      }
    }

    return bestGroup;

  } catch (error) {
    console.error("Error in findIntelligentNextGroup:", error);
    return null;
  }
}

// Get multiple recommendations instead of just one
export async function findIntelligentNextGroups(userId, count = 5, trackType = 'all', jlptLevel = null) {
  if (!userId) {
    console.error("findIntelligentNextGroups called without userId");
    return [];
  }

  try {
    let allGroups;

    if (trackType === 'jlpt' && jlptLevel) {
      allGroups = await prisma.onyomiGroup.findMany({
        where: {
          kanji: {
            some: {
              jlpt_level: parseInt(jlptLevel)
            }
          }
        },
        select: {
          reading: true,
          usefulness_score: true,
          _count: {
            select: {
              kanji: true
            }
          }
        }
      });
    } else {
      allGroups = await prisma.onyomiGroup.findMany({
        select: {
          reading: true,
          usefulness_score: true,
          _count: {
            select: {
              kanji: true
            }
          }
        }
      });
    }

    const userProgress = await prisma.UserProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true
          }
        }
      }
    });

    const progressByGroup = new Map();
    userProgress.forEach(progress => {
      const group = progress.kanji?.primary_onyomi;
      if (!group) return;

      if (!progressByGroup.has(group)) {
        progressByGroup.set(group, { mastered: 0, learning: 0 });
      }

      const stats = progressByGroup.get(group);
      if (progress.masteryLevel === 2) stats.mastered++;
      else if (progress.masteryLevel === 1) stats.learning++;
    });

    const scoredGroups = allGroups
      .map(group => {
        const totalKanji = group._count.kanji;
        if (totalKanji === 0) return null;

        const progress = progressByGroup.get(group.reading) || {
          mastered: 0,
          learning: 0
        };

        const normalizedScore = calculateNormalizedScore(progress, totalKanji);
        const priorityScore = calculatePriorityScore(normalizedScore, group.usefulness_score);

        return {
          reading: group.reading,
          usefulness_score: group.usefulness_score,
          priority_score: priorityScore,
          completion: normalizedScore
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, count);
      
    return scoredGroups;


  } catch (error) {
    console.error("Error in findIntelligentNextGroups:", error);
    return [];
  }
}