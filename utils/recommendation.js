import { prisma } from '@/lib/prisma';
import { getUserJlptLevel } from '@/utils/jlpt';

function calculateNormalizedScore(progress, totalKanji) {
  const totalPoints = (progress.mastered * 2) + (progress.learning * 1);
  const maxPossiblePoints = totalKanji * 2;

  return maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
}

function calculatePriorityScore(normalizedScore, usefulnessScore) {

  if (normalizedScore >= 95) return 0;

  return (normalizedScore * 10) + (usefulnessScore * 0.1);
}

export async function findIntelligentNextGroup(userId, userTrack = 'stat') {
  if (!userId) {
    console.error("findIntelligentNextGroup called without userId");
    return null;
  }

  try {
    let allGroups;
    let targetJlptLevel = null;

    if (userTrack === 'jlpt') {

      targetJlptLevel = await getUserJlptLevel(userId);

      allGroups = await prisma.onyomiGroup.findMany({
        where: {
          kanji: {
            some: {
              jlpt_new: targetJlptLevel
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
                  jlpt_new: targetJlptLevel
                }
              }
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

    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true,
            jlpt_new: true
          }
        }
      }
    });

    const progressByGroup = new Map();

    userProgress.forEach(progress => {
      const group = progress.kanji?.primary_onyomi;
      const kanjiJlptLevel = progress.kanji?.jlpt_new;

      if (!group) return;

      if (userTrack === 'jlpt' && kanjiJlptLevel !== targetJlptLevel) {
        return;
      }

      if (!progressByGroup.has(group)) {
        progressByGroup.set(group, { mastered: 0, learning: 0 });
      }

      const stats = progressByGroup.get(group);
      if (progress.masteryLevel === 2) stats.mastered++;
      else if (progress.masteryLevel === 1) stats.learning++;
    });

    const groupRecommendations = [];

    for (const group of allGroups) {
      const totalKanji = group._count.kanji;
      if (totalKanji === 0) continue;

      const progress = progressByGroup.get(group.reading) || {
        mastered: 0,
        learning: 0
      };

      const normalizedScore = calculateNormalizedScore(progress, totalKanji);
      const priorityScore = calculatePriorityScore(normalizedScore, group.usefulness_score);

      if (priorityScore > 0) {
        groupRecommendations.push({
          reading: group.reading,
          usefulness_score: group.usefulness_score,
          priority_score: priorityScore,
          completion: normalizedScore,
          ...(userTrack === 'jlpt' && { jlpt_level: targetJlptLevel })
        });
      }
    }

    groupRecommendations.sort((a, b) => b.priority_score - a.priority_score);

    if (userTrack === 'jlpt') {
      //console.log("All JLPT track groups sorted by priority:");
      groupRecommendations.forEach((group, index) => {
     //   console.log(`${index + 1}. ${group.reading}: Priority ${group.priority_score.toFixed(2)}, Completion ${group.completion.toFixed(2)}%`);
      });
    }

    const bestGroup = groupRecommendations[0] || null;

    if (bestGroup) {
     // console.log('Recommended group:', bestGroup);
    } else {
      //console.log('No suitable group found for recommendation');
    }

    return bestGroup;

  } catch (error) {
    console.error("Error in findIntelligentNextGroup:", error);
    return null;
  }
}