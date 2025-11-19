import { useEffect, useState } from 'react';
import KanjiCard from '@/components/card';
import { Chip } from '@heroui/react';
import { HiBookOpen, HiMiniCheckCircle } from "react-icons/hi2";
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  })
};

export async function getServerSideProps({ params, query }) {
  return {
    props: {
      onyomi: params.kanji,
      initialJlptFilter: query.jlpt || null,
    },
  };
}

const LoadingSkeleton = () => (
  <div className="py-6 max-w-5xl mx-auto">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6  items-center">
      <div className="h-7 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="order-3 justify-self-center col-span-2 sm:order-none sm:col-span-1">
        <div className="flex items-center gap-4">
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
    
    {/* Grid skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full aspect-square rounded-3xl bg-gray-200 animate-pulse p-6" // Match card padding
        />
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="px-8 md:px-4 pb-24 max-w-5xl mx-auto">
    <div className="text-center py-10">
      <p className="text-red-500">
        Error loading group: {error || 'Not found'}
      </p>
    </div>
  </div>
);

const KanjiGroupHeader = ({ onyomi, totalKanji, progressPercentage, masteredCount, learningCount }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6 items-center">
    <div>
      <span className="text-xl md:text-5xl font-black">{onyomi}</span>
    </div>
    
    <div className="order-3 justify-self-center col-span-2 sm:order-none sm:col-span-1">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <Chip
          classNames={{ content: "text-white font-semibold" }}
          className="bg-[#6A7FDB]"
        >
          {totalKanji} 字
        </Chip>
        <Chip
          classNames={{ content: "text-white font-semibold" }}
          className="bg-[#F56A83]"
        >
          {progressPercentage}%
        </Chip>
        <Chip
          classNames={{
            base: "pl-2",
            content: "text-white font-semibold",
          }}
          startContent={<HiMiniCheckCircle className="fill-white" />}
          className="bg-[#26A682]"
        >
          {masteredCount}
        </Chip>
        <Chip
          classNames={{
            base: "pl-2",
            content: "text-white font-semibold",
          }}
          startContent={<HiBookOpen className="fill-white" />}
          className="bg-[#FE9D0B]"
        >
          {learningCount}
        </Chip>
      </div>
    </div>
  </div>
);

export default function KanjiGroupPage({ onyomi, initialJlptFilter }) {
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (initialJlptFilter) {
          params.append('jlpt', initialJlptFilter);
        }

        const url = `/api/progress/${onyomi}${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();

        if (json.success) {
          setGroupData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError('Failed to load group data');
        console.error('Error fetching group:', err);
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

  if (loading) return <LoadingSkeleton />;

  if (error || !groupData) return <ErrorDisplay error={error} />;

  const { groupKanji, masteryLevels } = groupData;
  const totalKanji = groupKanji.length;
  const masteredCount = Object.values(masteryLevels).filter(level => level === 2).length;
  const learningCount = Object.values(masteryLevels).filter(level => level === 1).length;
  const progressPercentage = totalKanji > 0
    ? Math.round((masteredCount / totalKanji) * 100)
    : 0;

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      <KanjiGroupHeader
        onyomi={onyomi}
        totalKanji={totalKanji}
        progressPercentage={progressPercentage}
        masteredCount={masteredCount}
        learningCount={learningCount}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {groupKanji.map((kanji, i) => (
          <motion.div
            key={kanji.reading}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            layout="position"
          >
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}