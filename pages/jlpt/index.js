import { useState, useEffect } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards'; // Updated import
import { Select, SelectItem } from "@heroui/react";

export default function JLPTPage() {
  const [groups, setGroups] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('5');
  const [loading, setLoading] = useState(false);
  const [totalGroups, setTotalGroups] = useState(0);

  useEffect(() => {
    const fetchGroupsForLevel = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          jlptLevel: selectedLevel
        });

        const response = await fetch(`/api/jlpt?${params.toString()}`);
        const json = await response.json();

        if (json.success) {
          setGroups(json.data.groups);
          setTotalGroups(json.data.totalGroups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsForLevel();
  }, [selectedLevel]);

  const jlptLevels = [
    { value: '5', label: 'N5' },
    { value: '4', label: 'N4' },
    { value: '3', label: 'N3' },
    { value: '2', label: 'N2' },
    { value: '1', label: 'N1' }
  ];

  return (
    <div className="p-6">
      <div className="max-w-5xl  mx-auto">
        <h1 className="text-4xl font-bold mb-2">Study by JLPT</h1>
        <p className="text-gray-600 mb-8">
          Follow JLPT levels. Groups are ordered by their
          frequency of use in modern Japanese.
        </p>
        <div className="flex items-center justify-between mb-6">
          <Select
            id="jlpt-level"
            selectedKeys={selectedLevel ? [selectedLevel] : []}
            onSelectionChange={(keys) => setSelectedLevel(Array.from(keys)[0])}
            isDisabled={loading}
            size='lg'
            className="w-32"
            label="JLPT Level"
          >
            {jlptLevels.map(level => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </Select>
          <p className="mt-2 text-base">
            {!loading && (
              <>
                <span className='font-black'>{totalGroups} groups</span> in N{selectedLevel}
              </>
            )}
          </p>
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
                kanjiCount={group.kanjiCount} // Just the number, no progress
                jlptLevel={`N${selectedLevel}`}
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