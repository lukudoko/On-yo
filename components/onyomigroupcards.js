// components/OnyomiGroupCard.js
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OnyomiGroupCard({ 
  onyomi, 
  usefulness_score, 
  mastered = 0, 
  learning = 0, 
  unlearned = 0,
  showProgress = false 
}) {
  const totalKanji = mastered + learning + unlearned;
  const hasProgressData = totalKanji > 0;

  return (
    <Link 
      href={`/groups/${onyomi}`} 
      scroll={false}
      onClick={(e) => {
        // Optional: Log usefulness score on click for debugging
        console.log(`Onyomi: ${onyomi}, Usefulness: ${usefulness_score}`);
      }}
    >
      <motion.div
        initial="initial"
        whileHover="hover"
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.02 }
        }}
        className="flex flex-col aspect-square justify-between p-5 h-full border-4 rounded-3xl bg-white cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="font-jp-round text-6xl font-black text-gray-800 mb-2">{onyomi}</span>
        </div>

        <div className="w-full">
          {hasProgressData && showProgress ? (
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
                  className="bg-green-500 flex items-center justify-center"
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
                  className="bg-yellow-500 flex items-center justify-center"
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
                  className="bg-red-500 flex items-center justify-center"
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
            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
              {hasProgressData ? (
                <div className="flex h-full w-full">
                  <div 
                    className="bg-green-500"
                    style={{ width: `${(mastered / totalKanji) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-yellow-500"
                    style={{ width: `${(learning / totalKanji) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-500"
                    style={{ width: `${(unlearned / totalKanji) * 100}%` }}
                  ></div>
                </div>
              ) : (
                <div className="bg-gray-200 w-full h-full"></div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}