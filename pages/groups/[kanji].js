import { useEffect, useState } from 'react';
import KanjiCard from '@/components/card';

export async function getServerSideProps({ params }) {
  try {
    const onyomi = params.kanji;
    
    // No direct imports needed - everything comes from API
    return {
      props: {
        onyomi: onyomi,
      },
    };
  } catch (error) {
    console.error('Error in kanji group getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
}

export default function KanjiGroupPage({ onyomi }) {
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/progress/group/${onyomi}`);
        const json = await response.json();
        
        if (json.success) {
          setGroupData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError('Failed to load group data');
        console.error('Error fetching group data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (onyomi) {
      fetchGroupData();
    }
  }, [onyomi]);

  const handleMasteryUpdate = (kanji, newLevel) => {
    setGroupData(prev => ({
      ...prev,
      masteryLevels: {
        ...prev.masteryLevels,
        [kanji]: newLevel
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid mx-auto max-w-md md:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col aspect-square justify-between p-5 h-full border-4 rounded-3xl bg-white animate-pulse">
              <div className="flex flex-1 justify-center items-center mb-4">
                <div className="h-28 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !groupData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p className="text-red-500">Error loading group data: {error || 'Not found'}</p>
        </div>
      </div>
    );
  }

  const { groupKanji, masteryLevels } = groupData;
  const totalKanji = groupKanji.length;
  const masteredCount = Object.values(masteryLevels).filter(level => level === 2).length;
  const learningCount = Object.values(masteryLevels).filter(level => level === 1).length;
  const progressPercentage = totalKanji > 0 ? Math.round((masteredCount / totalKanji) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
    </div>
  );
}