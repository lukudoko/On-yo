import { useEffect, useState } from 'react';
import KanjiCard from '@/components/card';
import { prisma } from '@/lib/prisma';
import { ProgressService, getUserId } from '@/utils/progress';

export async function getServerSideProps({ params, req, res }) {
  try {
    const onyomi = params.kanji;
    const userId = await getUserId(req, res);

    const [groupKanji, masteryLevels] = await Promise.all([

      prisma.kanji.findMany({
        where: {
          primary_onyomi: onyomi
        },
        orderBy: {
          freq: 'asc'
        },
        select: {
          character: true,
          meanings: true,
          readings_on: true,
          readings_kun: true,
          freq: true,
          jlpt_new: true,

          exampleWords: {
            select: {
              word: true,
              reading: true,
              meaning: true
            },
            take: 5
          }
        }
      }),

      userId ? (async () => {
        const kanjiInGroup = await prisma.kanji.findMany({
          where: { primary_onyomi: onyomi },
          select: { character: true }
        });
        const kanjiCharacters = kanjiInGroup.map(k => k.character);
        return ProgressService.getBatchKanjiMastery(userId, kanjiCharacters);
      })() : null
    ]);

    if (!groupKanji || groupKanji.length === 0) {
      return {
        notFound: true,
      };
    }

    const transformedKanji = groupKanji.map(kanji => ({
      kanji: kanji.character,
      meanings: kanji.meanings,
      readings_on: kanji.readings_on,
      readings_kun: kanji.readings_kun,
      freq_score: kanji.freq,
      jlpt_new: kanji.jlpt_new,
      exampleWords: kanji.exampleWords || []
    }));

    return {
      props: {
        groupKanji: transformedKanji,
        onyomi: onyomi,
        initialMasteryLevels: masteryLevels || {}
      },
    };
  } catch (error) {
    console.error('Error in kanji group getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
}

export default function KanjiGroupPage({ groupKanji, onyomi, initialMasteryLevels }) {
  const [masteryLevels, setMasteryLevels] = useState(initialMasteryLevels);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const shouldFetchClientSide = Object.keys(initialMasteryLevels).length === 0;

    if (shouldFetchClientSide && groupKanji?.length) {
      setLoading(true);
      fetchAllMasteryLevels();
    }
  }, [groupKanji, initialMasteryLevels]);

  const fetchAllMasteryLevels = async () => {
    try {
      const kanjiCharacters = groupKanji.map(item => item.kanji);

      const response = await fetch('/api/progress/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kanji: kanjiCharacters
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMasteryLevels(result.data || {});
      } else {
        console.error('Failed to fetch mastery levels:', result.error);

        const defaultLevels = {};
        groupKanji.forEach(item => {
          defaultLevels[item.kanji] = 0;
        });
        setMasteryLevels(defaultLevels);
      }
    } catch (error) {
      console.error('Error fetching mastery levels:', error);

      const defaultLevels = {};
      groupKanji.forEach(item => {
        defaultLevels[item.kanji] = 0;
      });
      setMasteryLevels(defaultLevels);
    } finally {
      setLoading(false);
    }
  };

  const handleMasteryUpdate = (kanji, newLevel) => {
    setMasteryLevels(prev => ({
      ...prev,
      [kanji]: newLevel
    }));
  };

  const totalKanji = groupKanji.length;
  const masteredCount = Object.values(masteryLevels).filter(level => level === 2).length;
  const learningCount = Object.values(masteryLevels).filter(level => level === 1).length;
  const progressPercentage = totalKanji > 0 ? Math.round((masteredCount / totalKanji) * 100) : 0;

  console.log(groupKanji)
  return (
    <div className="p-6 max-w-5xl mx-auto">
      { }
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onyomi Group: {onyomi}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{totalKanji} kanji total</span>
          <span>•</span>
          <span className="text-green-600">{masteredCount} mastered</span>
          <span>•</span>
          <span className="text-yellow-600">{learningCount} learning</span>
          <span>•</span>
          <span className="font-medium">{progressPercentage}% complete</span>
        </div>
      </div>

      {loading ? (

        <div className="grid mx-auto max-w-md md:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupKanji.map((_, index) => (
            <div
              key={`loading-${index}`}
              className="flex flex-col aspect-square justify-between p-5 h-full border-4 rounded-3xl bg-white"
            >
              <div className="flex flex-1 justify-center items-center mb-4 animate-pulse">
                <div className="h-28 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="grid mx-auto max-w-md md:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupKanji.map((kanji) => (
            <KanjiCard
              key={kanji.kanji}
              kanji={kanji.kanji}
              meanings={kanji.meanings}
              readings_on={kanji.readings_on}
              readings_kun={kanji.readings_kun}
              freq_score={kanji.freq_score}
              jlpt_new={kanji.jlpt_new}
              initialMasteryLevel={masteryLevels[kanji.kanji] || 0}
              onMasteryUpdate={handleMasteryUpdate}
              exampleWords={kanji.exampleWords || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}