import { prisma } from '@/lib/prisma';
import { getUserJlptLevel } from '@/utils/jlpt';

const USEFULNESS_WEIGHT = 0.001;

function calculateNormalizedScore(progress, totalKanji) {
  const totalPoints = (progress.mastered * 2) + (progress.learning * 1);
  const maxPossiblePoints = totalKanji * 2;
  return maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
}

function calculatePriorityScore(completion, usefulnessScore) {
  if (completion >= 100) return 0;

  return completion + (usefulnessScore * USEFULNESS_WEIGHT);
}

export async function findIntelligentNextGroup(userId, userTrack = 'stat') {
  if (!userId) {
    console.error("findIntelligentNextGroup called without userId");
    return null;
  }

  try {
    let targetJlptLevel = null;

    if (userTrack === 'jlpt') {
      targetJlptLevel = await getUserJlptLevel(userId);
      if (!targetJlptLevel) return null;
    }

    const groupsQuery = userTrack === 'jlpt'
      ? prisma.onyomiGroup.findMany({
          where: {
            kanji: { some: { jlpt_new: targetJlptLevel } },
          },
          select: {
            reading: true,
            usefulness_score: true,
            _count: {
              select: {
                kanji: { where: { jlpt_new: targetJlptLevel } },
              },
            },
          },
        })
      : prisma.onyomiGroup.findMany({
          select: {
            reading: true,
            usefulness_score: true,
            _count: { select: { kanji: true } },
          },
        });

    const progressQuery = prisma.userProgress.findMany({
      where: { userId },
      select: {
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true,
            jlpt_new: true,
          },
        },
      },
    });

    const [allGroups, userProgress] = await Promise.all([
      groupsQuery,
      progressQuery,
    ]);

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
      if (progress.masteryLevel >= 2) stats.mastered++;
      else if (progress.masteryLevel === 1) stats.learning++;
    });

    const groupRecommendations = [];

    for (const group of allGroups) {
      const totalKanji = group._count.kanji;
      if (totalKanji === 0) continue;

      const progress = progressByGroup.get(group.reading) || {
        mastered: 0,
        learning: 0,
      };

      const completion = calculateNormalizedScore(progress, totalKanji);
      const priorityScore = calculatePriorityScore(completion, group.usefulness_score);

      if (priorityScore > 0) {
        groupRecommendations.push({
          reading: group.reading,
          usefulness_score: group.usefulness_score,
          priority_score: priorityScore,
          completion,
          learningCount: progress.learning,
          unlearnedCount: Math.max(0, totalKanji - progress.mastered - progress.learning),
          ...(userTrack === 'jlpt' && { jlpt_level: targetJlptLevel }),
        });
      }
    }

    groupRecommendations.sort((a, b) =>
      b.priority_score - a.priority_score ||
      b.usefulness_score - a.usefulness_score ||
      a.reading.localeCompare(b.reading)
    );

    return groupRecommendations[0] || null;
  } catch (error) {
    console.error("Error in findIntelligentNextGroup:", error);
    return null;
  }
}