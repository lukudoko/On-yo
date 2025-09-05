import { useState, useEffect } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards';
import { Select, SelectItem } from "@heroui/react";
import { Chip } from "@heroui/react";
import { HiBookOpen, HiCheckCircle } from "react-icons/hi2";

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

  // Calculate overall JLPT level stats
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

  const jlptLevels = [
    { value: '5', label: 'N5' },
    { value: '4', label: 'N4' },
    { value: '3', label: 'N3' },
    { value: '2', label: 'N2' },
    { value: '1', label: 'N1' }
  ];

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black mb-4 underline decoration-2">JLPT</h1>

        <div className="flex flex-wrap gap-4 justify-center md:justify-between mb-6">
          <Select
            selectedKeys={selectedLevel ? [selectedLevel] : []}
            onSelectionChange={(keys) => setSelectedLevel(Array.from(keys)[0])}
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
          <div className="flex items-center justify-center flex-wrap gap-4 text-sm">
            {!loading && (
              <>
                <span className='font-black'>{groups.length} groups</span>
               
                  <Chip
                    classNames={{
                      content: "text-white font-bold",
                    }}
                    className='bg-indigo-500 text-bold'>
                    {jlptStats.totalKanji} 字
                  </Chip>
                  <Chip
                    classNames={{
                      base: "pl-2",
                      content: "text-white font-bold",
                    }}
                    startContent={<HiCheckCircle color="white" />} className='bg-green-500 text-bold'>
                    {jlptStats.mastered}
                  </Chip>
                  <Chip
                    classNames={{
                      base: "pl-2",
                      content: "text-white font-bold",
                    }}
                    startContent={<HiBookOpen color="white" />} className='bg-yellow-500 text-bold'>
                    {jlptStats.learning}
                  </Chip>
                  <Chip
                    classNames={{
                      content: "text-white font-bold",
                    }}
                    className='bg-cyan-500 text-bold'>
                    {jlptStats.percentage}%
                  </Chip>
         
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-60 bg-gray-200 aspect-square rounded-3xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && groups.length > 0 && (
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
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No onyomi groups found for JLPT N{selectedLevel}.</p>
          </div>
        )}
      </div>
    </div>
  );
}