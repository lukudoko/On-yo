import { useState, useEffect } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { Select, SelectItem, Button, Chip } from "@heroui/react";
import { HiBookOpen, HiCheckCircle } from "react-icons/hi2";

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  <div className="flex items-center justify-center flex-wrap gap-4">
    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
  </div>
);

const StatsDisplay = ({ stats, groupCount }) => (
  <div className="flex items-center justify-center flex-wrap gap-4 text-sm">
    <span className='font-black'>{groupCount} groups</span>

    <Chip
      classNames={{
        content: "text-indigo-900 font-bold",
      }}
      className='bg-indigo-400'>
      {stats.totalKanji} 字
    </Chip>

    <Chip
      classNames={{
        base: "pl-2",
        content: "text-green-900 font-bold",
      }}
      startContent={<HiCheckCircle className='fill-green-900' />} 
      className='bg-green-400'>
      {stats.mastered}
    </Chip>

    <Chip
      classNames={{
        base: "pl-2",
        content: "text-yellow-900 font-bold",
      }}
      startContent={<HiBookOpen className='fill-yellow-900' />} 
      className='bg-yellow-400'>
      {stats.learning}
    </Chip>

    <Chip
      classNames={{
        content: "text-cyan-900 font-bold",
      }}
      className='bg-cyan-400'>
      {stats.percentage}%
    </Chip>
  </div>
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
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

  useEffect(() => {
    localStorage.setItem('jlptLevel', selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const trackResponse = await fetch("/api/stats?type=track", {
          headers: {
            'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
          }
        });   
        const trackData = await trackResponse.json();
        
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

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem('learnPageScrollY', window.scrollY.toString());
    };

    const restoreScroll = () => {
      const savedScrollY = sessionStorage.getItem('learnPageScrollY');
      if (savedScrollY && !loading) {
        window.scrollTo(0, parseInt(savedScrollY));
        sessionStorage.removeItem('learnPageScrollY');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    if (!loading) {
      restoreScroll();
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [loading]);

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
    <div className="px-4 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-4 pt-6 justify-center md:justify-between mb-6">
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