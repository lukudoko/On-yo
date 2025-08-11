import { useState, useEffect } from 'react';
import KanjiCard from '@/components/card';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default function Home({ initialKanji, onyomiGroups }) {
  // State to track the selected onyomi group
  const [selectedOnyomi, setSelectedOnyomi] = useState('All');

  // State to track the selected JLPT levels
  const [selectedJlptLevels, setSelectedJlptLevels] = useState([]);

  // Get the kanji list for the selected onyomi group
  const kanjiInGroup = selectedOnyomi === 'All'
    ? initialKanji // Show all kanji if "All" is selected
    : initialKanji.filter(k => k.primary_onyomi === selectedOnyomi);

  // Get unique JLPT levels in the selected onyomi group, ordered from N5 to N1
  const jlptLevelsInGroup = [...new Set(kanjiInGroup.map(k => `N${k.jlpt_new}`))]
    .filter(level => ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) // Ensure only valid levels
    .sort((a, b) => a.localeCompare(b)); // Sort from N5 to N1

  // Initialize selected JLPT levels with all available levels
  useEffect(() => {
    if (selectedJlptLevels.length === 0 && jlptLevelsInGroup.length > 0) {
      setSelectedJlptLevels(jlptLevelsInGroup);
    }
  }, [selectedOnyomi, jlptLevelsInGroup, selectedJlptLevels]);

  // Filter kanji by selected JLPT levels
  const filteredKanji = selectedJlptLevels.length === 0
    ? kanjiInGroup // Show all kanji if no JLPT levels are selected
    : kanjiInGroup.filter(k => selectedJlptLevels.includes(`N${k.jlpt_new}`));

  // Function to handle JLPT level toggles
  const toggleJlptLevel = (level) => {
    setSelectedJlptLevels((prev) =>
      prev.includes(level)
        ? prev.filter(l => l !== level) // Remove level if already selected
        : [...prev, level] // Add level if not selected
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-jp font-bold mb-4">On&apos;yo!</h1>

      {/* Dropdown for onyomi groups */}
      <div className="mb-4">
        <label htmlFor="onyomi-filter" className="mr-2">Filter by Onyomi:</label>
        <select
          id="onyomi-filter"
          value={selectedOnyomi}
          onChange={(e) => {
            setSelectedOnyomi(e.target.value);
            setSelectedJlptLevels([]); // Reset JLPT filters when onyomi group changes
          }}
          className="p-2 border rounded-sm"
        >
          <option value="All">All</option>
          {onyomiGroups.map(([onyomi, data]) => (
            <option key={onyomi} value={onyomi}>
              {onyomi} (Score: {data.usefulness_score.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* JLPT level buttons (only show if an onyomi group is selected) */}
      {selectedOnyomi !== 'All' && (
        <div className="mb-4">
          <p className="mb-2">Filter by JLPT Level:</p>
          <div className="flex flex-wrap gap-2">
            {jlptLevelsInGroup.reverse().map((level) => (
              <button
                key={level}
                onClick={() => toggleJlptLevel(level)}
                className={`p-2 border rounded ${
                  selectedJlptLevels.includes(level)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-black'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display filtered kanji */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredKanji.map((kanji) => (
          <KanjiCard
            key={kanji.character}
            kanji={kanji.character}
            meanings={kanji.meanings}
            readings_on={kanji.readings_on}
            readings_kun={kanji.readings_kun}
            usefulness_score={kanji.usefulness_score}
            jlpt_new={kanji.jlpt_new}
          />
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  // Fetch all kanji with their data
  const allKanji = await prisma.kanji.findMany({
    select: {
      character: true,
      meanings: true,
      readings_on: true,
      readings_kun: true,
      usefulness_score: true,
      jlpt_new: true,
      primary_onyomi: true
    }
  });

  // Get all unique onyomi groups and their scores (similar to your stats page)
  const onyomiGroupsMap = new Map();
  
  allKanji.forEach(kanji => {
    if (kanji.primary_onyomi) {
      if (!onyomiGroupsMap.has(kanji.primary_onyomi) || 
          kanji.usefulness_score > onyomiGroupsMap.get(kanji.primary_onyomi).usefulness_score) {
        onyomiGroupsMap.set(kanji.primary_onyomi, {
          usefulness_score: kanji.usefulness_score
        });
      }
    }
  });

  // Sort onyomi groups by usefulness_score in descending order
  const sortedOnyomiGroups = Array.from(onyomiGroupsMap.entries())
    .sort(([, a], [, b]) => b.usefulness_score - a.usefulness_score);

  return {
    props: {
      initialKanji: allKanji,
      onyomiGroups: sortedOnyomiGroups,
    },
  };
}