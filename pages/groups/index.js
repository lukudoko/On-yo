import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { Select, SelectItem, Chip } from "@heroui/react";
import { HiBookOpen, HiMiniCheckCircle } from "react-icons/hi2";
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  })
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div 
        key={i} 
        className="w-full aspect-square rounded-3xl bg-gray-200 animate-pulse p-6" // Match your card's padding
      >
      </div>
    ))}
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="text-center py-10">
    <p className="text-red-500">Error loading groups: {error}</p>
  </div>
);

const EmptyState = ({ mode, selectedLevel }) => (
  <div className="text-center py-12 text-gray-500">
    <p>{mode === 'jlpt'
      ? `No onyomi groups found for JLPT N${selectedLevel}.`
      : 'No onyomi groups found.'}
    </p>
  </div>
);

const GroupsGrid = ({ groups, mode, selectedLevel }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {groups.map((g, i) => (
      <motion.div
        key={g.reading}
        custom={i}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        layout="position"
      >
        <OnyomiGroupCard
          onyomi={g.reading}
          usefulness_score={g.usefulness_score}
          kanjiCount={g.kanjiCount || g.total}
          jlptLevel={mode === 'jlpt' ? `N${selectedLevel}` : undefined}
          mastered={g.mastered}
          learning={g.learning}
          unlearned={g.unlearned}
          showProgress
        />
      </motion.div>
    ))}
  </div>
);

const LevelSelector = ({ selectedLevel, onChange }) => {
  const levels = ['5', '4', '3', '2', '1'];
  return (
    <Select
      selectedKeys={[selectedLevel]}
      onSelectionChange={(keys) => onChange([...keys][0])}
      size="sm"
      className="w-24"
    >
      {levels.map(l => (
        <SelectItem key={l}>{`N${l}`}</SelectItem>
      ))}
    </Select>
  );
};

export default function LearnPage() {
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jlptLevel') || '5';
    }
    return '5';
  });

  useEffect(() => {
    localStorage.setItem('jlptLevel', selectedLevel);
  }, [selectedLevel]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trackRes = await fetch("/api/user/track", {
        headers: { 'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN }
      });
      const trackJson = await trackRes.json();

      const isJlpt = trackRes.ok && trackJson.data?.track === "jlpt";
      setMode(isJlpt ? "jlpt" : "stats");

      const groupsUrl = isJlpt
        ? `/api/groups/jlpt?jlptLevel=${selectedLevel}`
        : "/api/groups/stat";

      const groupsRes = await fetch(groupsUrl);
      const groupsJson = await groupsRes.json();

      if (groupsJson.success) {
        setGroups(isJlpt ? groupsJson.data.groups : groupsJson.data);
      } else {
        setError(groupsJson.error || "Failed to load groups");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = groups.reduce(
    (acc, g) => {
      const total = g.total ?? g.kanjiCount ?? 0;
      acc.totalKanji += total;
      acc.mastered += g.mastered || 0;
      acc.learning += g.learning || 0;
      return acc;
    },
    { totalKanji: 0, mastered: 0, learning: 0 }
  );

  const percentage = stats.totalKanji
    ? Math.round(((stats.mastered + stats.learning * 0.5) / stats.totalKanji) * 100)
    : 0;

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6 items-center">

        <div>
          {loading
            ? <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
            : <span className="text-xl font-black">{groups.length} groups</span>}
        </div>

        <div className="order-3 justify-self-center col-span-2 sm:order-none sm:col-span-1">
          {loading ? (
            <div className="h-6 bg-gray-200 rounded w-52 animate-pulse" />
          ) : (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Chip
                classNames={{
                  content: "text-white font-semibold",
                }}
                className='bg-[#6A7FDB]'>
                {stats.totalKanji} 字
              </Chip>
              <Chip
                classNames={{
                  content: "text-white font-semibold",
                }}
                className='bg-[#F56A83]'>
                {percentage}%
              </Chip>

              <Chip
                classNames={{
                  base: "pl-2",
                  content: "text-white font-semibold",
                }}
                startContent={<HiMiniCheckCircle className='fill-white' />}
                className='bg-[#26A682]'>
                {stats.mastered}
              </Chip>

              <Chip
                classNames={{
                  base: "pl-2",
                  content: "text-white font-semibold",
                }}
                startContent={<HiBookOpen className='fill-white' />}
                className='bg-[#FE9D0B]'>
                {stats.learning}
              </Chip>
            </div>
          )}
        </div>

        {mode === "jlpt" && (
          <div className="flex justify-end">
            {loading
              ? <div className="order-2 sm:order-none sm:col-span-1 w-24 h-8 bg-gray-200 rounded animate-pulse" />
              : <LevelSelector selectedLevel={selectedLevel} onChange={setSelectedLevel} />}
          </div>
        )}
      </div>

      {loading
        ? <LoadingSkeleton />
        : error
          ? <ErrorDisplay error={error} />
          : groups.length === 0
            ? <EmptyState mode={mode} selectedLevel={selectedLevel} />
            : <GroupsGrid groups={groups} mode={mode} selectedLevel={selectedLevel} />}
    </div>
  );
}