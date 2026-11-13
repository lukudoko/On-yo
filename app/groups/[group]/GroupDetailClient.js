"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import KanjiCard from "@/components/card";
import { Chip } from "@heroui/react";
import { HiBookOpen, HiMiniCheckCircle } from "react-icons/hi2";
import { updateMastery } from "@/app/actions/kanji";

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  }),
};

export default function GroupDetailClient({
  onyomi,
  groupKanji,
  masteryLevels: initialMasteryLevels,
  jlptFilter,
}) {
  const [masteryLevels, setMasteryLevels] = useState(initialMasteryLevels);

  const totalKanji = groupKanji.length;
  const masteredCount = Object.values(masteryLevels).filter((l) => l === 2).length;
  const learningCount = Object.values(masteryLevels).filter((l) => l === 1).length;
  
  const progressPercentage = totalKanji
    ? Math.round(((masteredCount + learningCount * 0.5) / totalKanji) * 100)
    : 0;

  const handleMasteryUpdate = async (kanjiId, newLevel) => {
    const kanji = groupKanji.find((k) => k.id === kanjiId);
    if (!kanji) return;

    const previousLevel = masteryLevels[kanji.kanji] || 0;
    setMasteryLevels((prev) => ({
      ...prev,
      [kanji.kanji]: newLevel,
    }));

    try {
      await updateMastery(kanjiId, newLevel);
    } catch (error) {
      console.error("Failed to update mastery:", error);
      setMasteryLevels((prev) => ({
        ...prev,
        [kanji.kanji]: previousLevel,
      }));
    }
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-4xl md:text-5xl font-jp-round font-black leading-none">
          {onyomi}
        </span>
      </div>

      <div className="flex gap-2 justify-evenly md:justify-start">
        <Chip
          variant="flat"
          radius="sm"
          className="bg-[#6A7FDB]/10 text-[#6A7FDB] text-xs font-semibold whitespace-nowrap flex-shrink-0"
        >
          <span className="font-bold">{totalKanji}</span> 字
        </Chip>
        <Chip
          variant="flat"
          radius="sm"
          className="bg-[#F56A83]/10 text-[#F56A83] text-xs font-semibold whitespace-nowrap flex-shrink-0"
        >
          <span className="font-bold">{progressPercentage}%</span>
        </Chip>
        <Chip
          variant="flat"
          radius="sm"
          className="bg-[#26A682]/10 text-[#26A682] text-xs font-semibold whitespace-nowrap flex-shrink-0"
        >
          <HiMiniCheckCircle className="w-3.5 h-3.5 inline-block mr-1" />
          <span className="font-bold">{masteredCount}</span>
        </Chip>
        <Chip
          variant="flat"
          radius="sm"
          className="bg-[#FE9D0B]/10 text-[#FE9D0B] text-xs font-semibold whitespace-nowrap flex-shrink-0"
        >
          <HiBookOpen className="w-3.5 h-3.5 inline-block mr-1" />
          <span className="font-bold">{learningCount}</span>
        </Chip>
      </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {groupKanji.map((k, i) => (
          <motion.div
            key={k.kanji}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            layout="position"
          >
            <KanjiCard
              kanji={k.kanji}
              meanings={k.meanings}
              readings_on={k.readings_on}
              readings_kun={k.readings_kun}
              freq_score={k.freq_score}
              jlpt_new={k.jlpt_new}
              initialMasteryLevel={masteryLevels[k.kanji] || 0}
              onMasteryUpdate={handleMasteryUpdate}
              exampleWords={k.exampleWords || []}
              kanjiId={k.id}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}