import { useEffect } from 'react';
import { prisma } from '@/lib/prisma';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { ProgressService, getUserId } from '@/utils/progress';

export async function getServerSideProps(context) {
  const { req, res } = context;

  try {

    const userId = await getUserId(req, res);

    const [onyomiGroupsData, progressByOnyomi] = await Promise.all([

      prisma.onyomiGroup.findMany({
        orderBy: {
          usefulness_score: 'desc'
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
      }),

      ProgressService.getAllOnyomiGroupsProgress(userId)
    ]);

    const onyomiGroupsWithProgress = onyomiGroupsData.map(group => {
      const totalKanji = group._count.kanji;
      const progress = progressByOnyomi.get(group.reading) || {
        mastered: 0,
        learning: 0,
        unlearned: 0
      };

      const calculatedUnlearned = totalKanji - progress.mastered - progress.learning;

      return {
        reading: group.reading,
        usefulness_score: group.usefulness_score,
        mastered: progress.mastered,
        learning: progress.learning,
        unlearned: Math.max(0, calculatedUnlearned),
        total: totalKanji
      };
    });

    return {
      props: {
        onyomiGroups: onyomiGroupsWithProgress,
      }
    };
  } catch (error) {
    console.error('Error in stats getServerSideProps:', error);

    return {
      props: {
        onyomiGroups: [],
      }
    };
  }
}

export default function StatisticsPage({ onyomiGroups }) {
  useEffect(() => {

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Study by Usefulness</h1>
        <p className="text-gray-600 mb-8">
          Follow the most statistically useful kanji groups first. Groups are ordered by their 
          frequency of use in modern Japanese.
        </p>

        {onyomiGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No onyomi groups found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {onyomiGroups.map((group) => (
              <OnyomiGroupCard
                key={group.reading}
                onyomi={group.reading}
                usefulness_score={group.usefulness_score}
                mastered={group.mastered}
                learning={group.learning}
                unlearned={group.unlearned}
                showProgress={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}