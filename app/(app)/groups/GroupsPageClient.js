"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import OnyomiGroupCard from "@/components/onyomigroupcards";
import { Select, SelectItem, Chip, Spinner } from "@heroui/react";
import { HiBookOpen, HiMiniCheckCircle } from "react-icons/hi2";
import { motion } from "framer-motion";
import { loadMoreGroups } from "@/app/actions/kanjigroupload";

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  }),
};

export default function GroupsPageClient({
  initialGroups,
  totalStats,
  allGroupsLength,
  track,
  jlptLevel,
  batchSize,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState(initialGroups);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingLevel, setIsChangingLevel] = useState(false);
  const observerRef = useRef(null);
  const prevLevelRef = useRef(jlptLevel);


  console.log(initialGroups);

  const hasMore = groups.length < allGroupsLength;

  const percentage = totalStats.totalKanji
    ? Math.round(
      ((totalStats.mastered + totalStats.learning * 0.5) /
        totalStats.totalKanji) *
      100
    )
    : 0;

  const handleLevelChange = (level) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("jlpt", level);
    router.push(`/groups?${params.toString()}`);
  };

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const newGroups = await loadMoreGroups(groups.length, batchSize, jlptLevel);
      setGroups((prev) => [...prev, ...newGroups]);
    } catch (error) {
      console.error("Failed to load more groups:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groups.length, batchSize, jlptLevel, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  useEffect(() => {
    if (prevLevelRef.current !== jlptLevel) {
      setIsChangingLevel(true);
      prevLevelRef.current = jlptLevel;
    }
  }, [jlptLevel]);

  useEffect(() => {
    if (isChangingLevel) {
      setIsChangingLevel(false);
      setGroups(initialGroups);
    }
  }, [initialGroups, isChangingLevel]);

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-black">{totalStats.totalGroups}</span>
            <span className="text-sm font-medium text-gray-500 ml-1.5">groups</span>
          </div>

          {track === "jlpt" && (
            <Select
              aria-label="Select JLPT level"
              selectedKeys={new Set([String(jlptLevel || "5")])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) handleLevelChange(String(selected));
              }}
              className="w-20"
              disallowEmptySelection
            >
              {["5", "4", "3", "2", "1"].map((l) => (
                <SelectItem key={l} textValue={`N${l}`}>
                  N{l}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>
        <div className="flex gap-2 justify-evenly md:justify-start">
          <Chip
            variant="flat"
            radius="sm"
            className="bg-[#6A7FDB]/10 text-[#6A7FDB] text-xs font-semibold whitespace-nowrap flex-shrink-0"
          >
            <span className="font-bold">{totalStats.totalKanji}</span> 字
          </Chip>
          <Chip
            variant="flat"
            radius="sm"
            className="bg-[#F56A83]/10 text-[#F56A83] text-xs font-semibold whitespace-nowrap flex-shrink-0"
          >
            <span className="font-bold">{percentage}%</span>
          </Chip>
          <Chip
            variant="flat"
            radius="sm"
            className="bg-[#26A682]/10 text-[#26A682] text-xs font-semibold whitespace-nowrap flex-shrink-0"
          >
            <HiMiniCheckCircle className="w-3.5 h-3.5 inline-block mr-1" />
            <span className="font-bold">{totalStats.mastered}</span>
          </Chip>
          <Chip
            variant="flat"
            radius="sm"
            className="bg-[#FE9D0B]/10 text-[#FE9D0B] text-xs font-semibold whitespace-nowrap flex-shrink-0"
          >
            <HiBookOpen className="w-3.5 h-3.5 inline-block mr-1" />
            <span className="font-bold">{totalStats.learning}</span>
          </Chip>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {track === "jlpt"
            ? `No onyomi groups found for JLPT N${jlptLevel || "5"}.`
            : "No onyomi groups found."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
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
                kanjiCount={g.total}
                jlptLevel={track === "jlpt" ? `N${jlptLevel || "5"}` : undefined}
                mastered={g.mastered}
                learning={g.learning}
                unlearned={g.unlearned}
                showProgress
              />
            </motion.div>
          ))}
        </div>
      )}

      <div ref={observerRef} className="h-12 flex flex-col justify-center items-center mt-4 gap-2">
        {isLoading ? (
          <>
            <Spinner />
            <span className="text-xs text-gray-600">Loading more groups...</span>
          </>
        ) : hasMore ? (
          <span className="text-xs text-gray-600">Scroll for more</span>
        ) : groups.length > 0 ? (
          <span className="text-xs font-bold">All groups loaded!</span>
        ) : null}
      </div>
    </div>
  );
}