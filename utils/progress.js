import { prisma } from '@/lib/prisma';

export class ProgressService {

  static async updateKanjiMastery(userId, kanjiCharacter, masteryLevel) {
    if (!userId) return null;

    try {

      const result = await prisma.$transaction(async (tx) => {
        const kanji = await tx.kanji.findUnique({
          where: { character: kanjiCharacter },
          select: { id: true }
        });

        if (!kanji) {
          throw new Error(`Kanji ${kanjiCharacter} not found`);
        }

        return await tx.userProgress.upsert({
          where: {
            userId_kanjiId: {
              userId: userId,
              kanjiId: kanji.id
            }
          },
          update: {
            masteryLevel: masteryLevel,
            lastStudied: new Date()
          },
          create: {
            userId: userId,
            kanjiId: kanji.id,
            masteryLevel: masteryLevel,
            lastStudied: new Date()
          }
        });
      });

      return result;
    } catch (error) {
      console.error('Error updating kanji mastery:', error);
      throw error;
    }
  }

  static async getBatchKanjiMastery(userId, kanjiCharacters) {
    if (!userId) {
      return kanjiCharacters.reduce((acc, char) => ({ ...acc, [char]: 0 }), {});
    }

    try {

      const results = await prisma.kanji.findMany({
        where: { 
          character: { in: kanjiCharacters } 
        },
        select: {
          character: true,
          progress: {
            where: { userId: userId },
            select: { masteryLevel: true }
          }
        }
      });

      const masteryLevels = {};

      kanjiCharacters.forEach(char => {
        masteryLevels[char] = 0;
      });

      results.forEach(kanji => {
        masteryLevels[kanji.character] = kanji.progress[0]?.masteryLevel || 0;
      });

      return masteryLevels;
    } catch (error) {
      console.error('Error getting batch kanji mastery:', error);
      return kanjiCharacters.reduce((acc, char) => ({ ...acc, [char]: 0 }), {});
    }
  }

  static async getAllOnyomiGroupsProgress(userId) {
    if (!userId) return new Map();

    try {

      const results = await prisma.userProgress.findMany({
        where: { userId: userId },
        select: {
          masteryLevel: true,
          kanji: {
            select: { primary_onyomi: true }
          }
        }
      });

      const progressByOnyomi = new Map();

      results.forEach(({ masteryLevel, kanji }) => {
        if (!kanji?.primary_onyomi) return;

        const onyomi = kanji.primary_onyomi;
        if (!progressByOnyomi.has(onyomi)) {
          progressByOnyomi.set(onyomi, { mastered: 0, learning: 0, unlearned: 0 });
        }

        const counts = progressByOnyomi.get(onyomi);
        if (masteryLevel === 2) counts.mastered++;
        else if (masteryLevel === 1) counts.learning++;
      });

      return progressByOnyomi;
    } catch (error) {
      console.error('Error getting onyomi groups progress:', error);
      return new Map();
    }
  }

  static async getOnyomiGroupProgress(userId, onyomiReading) {
    const defaultResult = { mastered: 0, learning: 0, unlearned: 0, total: 0 };

    if (!userId) return defaultResult;

    try {

      const results = await prisma.kanji.findMany({
        where: { primary_onyomi: onyomiReading },
        select: {
          id: true,
          progress: {
            where: { userId: userId },
            select: { masteryLevel: true }
          }
        }
      });

      if (results.length === 0) return defaultResult;

      let mastered = 0;
      let learning = 0;
      let unlearned = 0;

      results.forEach(kanji => {
        const masteryLevel = kanji.progress[0]?.masteryLevel || 0;
        if (masteryLevel === 2) mastered++;
        else if (masteryLevel === 1) learning++;
        else unlearned++;
      });

      return {
        mastered,
        learning,
        unlearned,
        total: results.length
      };
    } catch (error) {
      console.error('Error getting onyomi group progress:', error);
      return defaultResult;
    }
  }

  static async getOverallProgress(userId) {
    try {
      const totalKanji = await prisma.kanji.count();

      if (!userId) {
        return { mastered: 0, learning: 0, unlearned: totalKanji, total: totalKanji };
      }

      const progressStats = await prisma.userProgress.groupBy({
        by: ['masteryLevel'],
        where: { userId: userId },
        _count: true
      });

      const stats = {
        mastered: 0,
        learning: 0,
        unlearned: totalKanji,
        total: totalKanji
      };

      let totalStudied = 0;
      progressStats.forEach(stat => {
        const count = stat._count;
        totalStudied += count;

        if (stat.masteryLevel === 2) stats.mastered = count;
        else if (stat.masteryLevel === 1) stats.learning = count;
      });

      stats.unlearned = totalKanji - totalStudied;
      return stats;
    } catch (error) {
      console.error('Error getting overall progress:', error);
      const totalKanji = await prisma.kanji.count() || 0;
      return { mastered: 0, learning: 0, unlearned: totalKanji, total: totalKanji };
    }
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getUserId(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting user ID from session:', error);
    return null;
  }
}