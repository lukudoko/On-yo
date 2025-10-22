import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OnyomiGroupCard({ 
  onyomi, 
  usefulness_score, 
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
        initial="initial"
        whileHover="hover"
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.02 }
        }}
        className="flex flex-col aspect-square justify-between p-5 h-full rounded-3xl bg-white cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 relative"
      >
        {kanjiCount !== null && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center justify-center font-black bg-gray-800  text-white w-7 aspect-square text-xs rounded-full">
              {kanjiCount}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="font-jp-round text-6xl md:5xl lg:6xl text-center font-black mb-2">{onyomi}</span>
        </div>

        <div className="w-full">
          {showProgress && hasProgressData ? (
            <motion.div 
              className="overflow-hidden rounded-full"
              variants={{
                initial: { height: 4 },
                hover: { height: 24 }
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex h-full w-full">
                <motion.div 
                  className="bg-[#1F8A6C] flex items-center justify-center"
                  style={{ width: `${(mastered / totalKanji) * 100}%` }}
                >
                  {mastered > 0 && (
                    <motion.span 
                      className="text-white text-xs font-bold"
                      variants={{
                        initial: { opacity: 0 },
                        hover: { opacity: 1 }
                      }}
                      transition={{ delay: 0.1 }}
                    >
                      {mastered}
                    </motion.span>
                  )}
                </motion.div>
                <motion.div 
                  className="bg-[#FF7C37] flex items-center justify-center"
                  style={{ width: `${(learning / totalKanji) * 100}%` }}
                >
                  {learning > 0 && (
                    <motion.span 
                      className="text-white text-xs font-bold"
                      variants={{
                        initial: { opacity: 0 },
                        hover: { opacity: 1 }
                      }}
                      transition={{ delay: 0.1 }}
                    >
                      {learning}
                    </motion.span>
                  )}
                </motion.div>
                <motion.div 
                  className="bg-[#E72C3A] flex items-center justify-center"
                  style={{ width: `${(unlearned / totalKanji) * 100}%` }}
                >
                  {unlearned > 0 && (
                    <motion.span 
                      className="text-white text-xs font-bold"
                      variants={{
                        initial: { opacity: 0 },
                        hover: { opacity: 1 }
                      }}
                      transition={{ delay: 0.1 }}
                    >
                      {unlearned}
                    </motion.span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            showProgress ? (
              <div className="h-1 rounded-full bg-gray-200"></div>
            ) : null
          )}
        </div>
      </motion.div>
    </Link>
  );
}