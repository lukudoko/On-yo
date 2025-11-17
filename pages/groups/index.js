import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { Select, SelectItem, Chip } from "@heroui/react";
import { HiBookOpen, HiMiniCheckCircle  } from "react-icons/hi2";

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, index) => (
      <div key={index} className="w-full bg-gray-100 aspect-square rounded-3xl animate-pulse" />
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
    <p>
      {mode === 'jlpt'
        ? `No onyomi groups found for JLPT N${selectedLevel}.`
        : 'No onyomi groups found.'}
    </p>
  </div>
);

const StatsLoadingSkeleton = () => (
  <>
    <div className="h-7 bg-gray-200 rounded w-32 animate-pulse"></div>
    <div className="h-7 bg-gray-200 rounded w-68 animate-pulse"></div>
  </>
);

const StatsDisplay = ({ stats, groupCount }) => (
  <>
    <span className='text-xl font-black'>{groupCount} groups</span>
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
        {stats.percentage}%
      </Chip>

      <Chip
        classNames={{
          base: "pl-2",
          content: "text-white font-semibold",
        }}
        startContent={<HiMiniCheckCircle  className='fill-white' />}
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

  </>
);

const LevelSelectorSkeleton = () => (
  <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
);

const LevelSelector = ({ selectedLevel, onLevelChange }) => {
  const jlptLevels = [
    { value: '5', label: 'N5' },
    { value: '4', label: 'N4' },
    { value: '3', label: 'N3' },
    { value: '2', label: 'N2' },
    { value: '1', label: 'N1' }
  ];

  return (
    <Select
      selectedKeys={selectedLevel ? [selectedLevel] : []}
      onSelectionChange={(keys) => onLevelChange(Array.from(keys)[0])}
      size='sm'
      className="w-24"
      labelPlacement="outside-left"
    >
      {jlptLevels.map(level => (
        <SelectItem key={level.value} value={level.value}>
          {level.label}
        </SelectItem>
      ))}
    </Select>
  );
};

const GroupsGrid = ({ groups, mode, selectedLevel }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {groups.map((group) => (
      <OnyomiGroupCard
        key={group.reading}
        onyomi={group.reading}
        usefulness_score={group.usefulness_score}
        kanjiCount={group.kanjiCount || group.total}
        jlptLevel={mode === 'jlpt' ? `N${selectedLevel}` : undefined}
        mastered={group.mastered}
        learning={group.learning}
        unlearned={group.unlearned}
        showProgress={true}
      />
    ))}
  </div>
);

export default function LearnPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jlptLevel') || '5';
    }
    return '5';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [userTrack, setUserTrack] = useState('stat');
  const scrollPosRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('jlptLevel', selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const trackResponse = await fetch("/api/user/track", {
          headers: {
            'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
          }
        });
        const trackData = await trackResponse.json();
        console.log(trackData)

        let currentMode = 'stats';
        if (trackResponse.ok && trackData.data.track === 'jlpt') {
          setUserTrack(trackData.track);
          currentMode = 'jlpt';
        } else {
          setUserTrack('stat');
        }
        setMode(currentMode);

        let groupsResponse, groupsJson;
        if (currentMode === 'jlpt') {
          const params = new URLSearchParams({
            jlptLevel: selectedLevel
          });
          groupsResponse = await fetch(`/api/groups/jlpt?${params.toString()}`);
        } else {
          groupsResponse = await fetch('/api/groups/stat');
        }

        groupsJson = await groupsResponse.json();

        if (groupsJson.success) {
          if (currentMode === 'jlpt') {
            setGroups(groupsJson.data.groups || []);
          } else {
            setGroups(groupsJson.data || []);
          }
        } else {
          setError(groupsJson.error || 'Failed to load groups');
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
        setMode('stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLevel]);

  // Handle scroll restoration with Next.js router
  useEffect(() => {
    // Save scroll position before navigating away
    const handleRouteChangeStart = () => {
      scrollPosRef.current = window.scrollY;
      sessionStorage.setItem('learnPageScrollY', window.scrollY.toString());
    };

    // Restore scroll after coming back
    const handleRouteChangeComplete = () => {
      if (!loading && groups.length > 0) {
        const savedScroll = sessionStorage.getItem('learnPageScrollY');
        if (savedScroll) {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll));
          }, 0);
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Restore on initial mount (when coming back via browser back button)
    if (!loading && groups.length > 0) {
      const savedScroll = sessionStorage.getItem('learnPageScrollY');
      if (savedScroll && window.scrollY === 0) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll));
        }, 100);
      }
    }

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events, loading, groups]);

  const calculateStats = () => {
    if (groups.length === 0) return { totalKanji: 0, mastered: 0, learning: 0, percentage: 0 };

    const stats = groups.reduce((acc, group) => {
      acc.totalKanji += group.total || group.kanjiCount || 0;
      acc.mastered += group.mastered || 0;
      acc.learning += group.learning || 0;
      return acc;
    }, { totalKanji: 0, mastered: 0, learning: 0 });

    const percentage = stats.totalKanji > 0
      ? Math.round(((stats.mastered + stats.learning * 0.5) / stats.totalKanji) * 100)
      : 0;

    return { ...stats, percentage };
  };

  const stats = calculateStats();

  const renderContent = () => {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} />;
    if (groups.length === 0) return <EmptyState mode={mode} selectedLevel={selectedLevel} />;
    return <GroupsGrid groups={groups} mode={mode} selectedLevel={selectedLevel} />;
  };

  return (
    <div className="px-8 md:px-4 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-4 pt-6 justify-start md:justify-between mb-8">
        {loading ? (
          <StatsLoadingSkeleton />
        ) : (
          <StatsDisplay
            stats={stats}
            groupCount={groups.length}
          />
        )}

        {mode === 'jlpt' && (
          loading ? (
            <LevelSelectorSkeleton />
          ) : (
            <LevelSelector
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
            />
          )
        )}
      </div>

      {renderContent()}
    </div>
  );
}