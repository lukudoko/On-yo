import { motion } from 'framer-motion';
import Link from 'next/link';
import { HiBookOpen, HiLightBulb, HiMiniLanguage } from 'react-icons/hi2';

const testCards = [
  {
    slug: 'review',
    label: 'Review',
    description: "Reinforce kanji you've learned",
    icon: HiBookOpen,
    bg: 'bg-[#8DDCDC]',
  },
  {
    slug: 'discovery',
    label: 'Discovery',
    description: 'Learn new kanji in context',
    icon: HiLightBulb,
    bg: 'bg-[#A9C9F2]',
  },
  {
    slug: 'vocab',
    label: 'Vocab',
    description: 'Build vocabulary through examples',
    icon: HiMiniLanguage,
    bg: 'bg-[#F19EC8]',
  },
];

export default function TestsCard({ itemVariants, data }) {
  const { streak, kanjiThisWeek, track, jlptLevel, trackSpecificStats } = data;

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/90 rounded-xl">
          <div className="text-2xl font-bold text-[#6A7FDB]">{kanjiThisWeek} 字</div>
          <div className="text-xs text-gray-600">this week</div>
        </div>
        <div className="text-center p-3 bg-white/90 rounded-xl">
          <div className="text-2xl font-bold text-orange-600">{streak}</div>
          <div className="text-xs text-gray-600">day streak</div>
        </div>
        <div className="text-center p-3 bg-white/90 rounded-xl">
          {track === 'jlpt' ? (
            <>
              <div className="text-2xl font-bold">N{jlptLevel}</div>
              <div className="text-xs text-gray-600">JLPT level</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {trackSpecificStats.completedGroups}
              </div>
              <div className="text-xs text-gray-600">Groups completed</div>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {testCards.map((test) => (
          <Link
            key={test.slug}
            href={`/${test.slug}`}
            className="block group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <div className="relative flex items-center gap-4 px-4 py-4 rounded-2xl shadow-sm transition-all duration-200 [@media(hover:hover)]:group-hover:shadow-md group-active:scale-[0.98]">
              <div
                className={`absolute inset-0 rounded-2xl ${test.bg} transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-80`}
              />
              <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white/60">
                <test.icon className="w-6 h-6 text-gray-900" />
              </div>

              <div className="relative flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-tight">
                  {test.label}
                </p>
                <p className="text-sm text-gray-800 mt-0.5 leading-snug">
                  {test.description}
                </p>
              </div>

              <svg
                className="relative flex-shrink-0 w-5 h-5 text-gray-900 transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}