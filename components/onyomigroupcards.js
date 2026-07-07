import Link from 'next/link';
import { motion } from 'framer-motion';
import { SegmentedProgressBar } from '@/components/progressDisplays';

export default function OnyomiGroupCard({
  onyomi,
  mastered = 0,
  learning = 0,
  unlearned = 0,
  showProgress = false,
  kanjiCount = null, // For JLPT page
  jlptLevel = null
}) {
  const totalKanji = mastered + learning + unlearned;
  const hasProgressData = totalKanji > 0;

  return (
    <Link
      href={jlptLevel ? `/groups/${onyomi}?jlpt=${jlptLevel}` : `/groups/${onyomi}`}
      scroll={false}
    >
      <motion.div
        whileHover={{
          y: -4
        }}
        whileTap={{
          y: 1, // Move down less than before
          scale: 0.99 // Subtle scale
        }}
        transition={{
          y: { duration: 0.2, ease: "easeOut" },
          scale: { duration: 0.2, ease: "easeOut" }
        }}
        className="group flex flex-col aspect-square justify-between p-5 h-full rounded-3xl bg-white cursor-pointer transition-shadow duration-200 ease-out hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.6)] shadow-sm relative"      >
        {kanjiCount !== null && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center justify-center font-black bg-gray-800  text-white w-7 aspect-square text-xs rounded-full">
              {kanjiCount}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="font-jp-round text-[2rem] md:text-5xl  text-center font-black mb-2">{onyomi}</span>
        </div>

        <div className="w-full">
          <SegmentedProgressBar
            mastered={mastered}
            learning={learning}
            unlearned={unlearned}
            totalKanji={totalKanji}
            showProgress={showProgress}
            hasProgressData={hasProgressData}
          />

        </div>
      </motion.div>
    </Link>
  );
}