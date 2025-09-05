import { useState, useEffect } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { Select, SelectItem } from "@heroui/react";
import { Chip } from "@heroui/react";
import { HiBookOpen, HiCheckCircle } from "react-icons/hi2";

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, index) => (
      <div key={index} className="w-full bg-gray-100 aspect-square rounded-3xl animate-pulse" />
    ))}
  </div>
);

const EmptyState = ({ selectedLevel }) => (
  <div className="text-center py-12 text-gray-500">
    <p>No onyomi groups found for JLPT N{selectedLevel}.</p>
  </div>
);

const JLPTStats = ({ stats, groupCount, loading }) => {
  if (loading) return null;

  return (
    <div className="flex items-center justify-center flex-wrap gap-4 text-sm">
      <span className='font-black'>{groupCount} groups</span>

      <Chip
        classNames={{
          content: "text-white font-bold",
        }}
        className='bg-indigo-500'>
        {stats.totalKanji} 字
      </Chip>

      <Chip
        classNames={{
          base: "pl-2",
          content: "text-white font-bold",
        }}
        startContent={<HiCheckCircle color="white" />} 
        className='bg-green-500'>
        {stats.mastered}
      </Chip>

      <Chip
        classNames={{
          base: "pl-2",
          content: "text-white font-bold",
        }}
        startContent={<HiBookOpen color="white" />} 
        className='bg-yellow-500'>
        {stats.learning}
      </Chip>

      <Chip
        classNames={{
          content: "text-white font-bold",
        }}
        className='bg-cyan-500'>
        {stats.percentage}%
      </Chip>
    </div>
  );
};

const LevelSelector = ({ selectedLevel, onLevelChange, loading }) => {
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
      isDisabled={loading}
      size='sm'
      className="max-w-30"
      label="Level"
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

const GroupsGrid = ({ groups, selectedLevel }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {groups.map((group) => (
      <OnyomiGroupCard
        key={group.reading}
        onyomi={group.reading}
        usefulness_score={group.usefulness_score}
        kanjiCount={group.kanjiCount || group.total}
        jlptLevel={`N${selectedLevel}`}
        mastered={group.mastered}
        learning={group.learning}
        unlearned={group.unlearned}
        showProgress={true}
      />
    ))}
  </div>
);

export default function JLPTPage() {
  const [groups, setGroups] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('5');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroupsForLevel = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          jlptLevel: selectedLevel
        });

        const response = await fetch(`/api/groups/jlpt?${params.toString()}`);
        const json = await response.json();

        if (json.success) {
          setGroups(json.data.groups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsForLevel();
  }, [selectedLevel]);

  const calculateJLPTStats = () => {
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

  const jlptStats = calculateJLPTStats();

  const renderContent = () => {
    if (loading) return <LoadingSkeleton />;
    if (groups.length === 0) return <EmptyState selectedLevel={selectedLevel} />;
    return <GroupsGrid groups={groups} selectedLevel={selectedLevel} />;
  };

  return (
    <div className="px-4 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-4 justify-center md:justify-between mb-6">
        <LevelSelector 
          selectedLevel={selectedLevel} 
          onLevelChange={setSelectedLevel} 
          loading={loading} 
        />
        <JLPTStats 
          stats={jlptStats} 
          groupCount={groups.length} 
          loading={loading} 
        />
      </div>

      {renderContent()}
    </div>
  );
}