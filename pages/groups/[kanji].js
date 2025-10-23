import { useEffect, useState } from 'react';
import KanjiCard from '@/components/card';
import { Chip } from '@heroui/react';
import { HiBookOpen, HiMiniCheckCircle  } from "react-icons/hi2";
import { useRouter } from 'next/router';


export async function getServerSideProps({ params, query }) {
  try {
    const onyomi = params.kanji;
    const { jlpt } = query;

    return {
      props: {
        onyomi: onyomi,
        initialJlptFilter: jlpt || null,
      },
    };
  } catch (error) {
    console.error('Error in kanji group getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
}

export default function KanjiGroupPage({ onyomi, initialJlptFilter }) {
  const router = useRouter();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    // Scroll to top on initial load
    window.scrollTo(0, 0);

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (initialJlptFilter) {
          params.append('jlpt', initialJlptFilter);
        }

        const apiUrl = `/api/progress/${onyomi}${params.toString() ? `?${params.toString()}` : ''}`;

        const response = await fetch(apiUrl);
        const json = await response.json();

        if (json.success) {
          setGroupData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError('Failed to load group data');
        console.error('Error fetching group ', err);
      } finally {
        setLoading(false);
      }
    };

    if (onyomi) {
      fetchGroupData();
    }
  }, [onyomi, initialJlptFilter]);

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
        <div className="mb-8 flex justify-between items-center">
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
          <div className="h-7 bg-gray-200 rounded w-60 animate-pulse"></div>
        </div>
        <div className="grid mx-auto max-w-md md:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col aspect-square justify-between p-5 h-full rounded-3xl bg-gray-200 animate-pulse">
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
          <p className="text-red-500">Error loading group  {error || 'Not found'}</p>
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
      <div className="mb-8 flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <h1 className="text-5xl font-jp-round font-black mb-2">{onyomi}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Chip
            classNames={{
              content: "text-white font-semibold",
            }}
            className='bg-[#3B4790]'>
            {totalKanji} 字
          </Chip>
          <Chip
            classNames={{
              content: "text-white font-semibold",
            }}
            className='bg-[#F56A83]'>
            {progressPercentage}%
          </Chip>

          <Chip
            classNames={{
              base: "pl-2",
              content: "text-white font-semibold",
            }}
            startContent={<HiMiniCheckCircle  className='fill-white' />}
            className='bg-[#1F8A6C]'>
            {masteredCount}
          </Chip>

          <Chip
            classNames={{
              base: "pl-2",
              content: "text-white font-semibold",
            }}
            startContent={<HiBookOpen className='fill-white' />}
            className='bg-[#FF7C37]'>
            {learningCount}
          </Chip>
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