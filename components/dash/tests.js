import { motion } from 'framer-motion';
import { Link, Button } from '@heroui/react';
import { HiBookOpen, HiFire, HiMiniQuestionMarkCircle } from "react-icons/hi2";
import { useStats } from "@/contexts/stats";

export default function TestsCard({itemVariants}) {
  const { stats: dashboardData } = useStats();
  const { streak, kanjiThisWeek, track } = dashboardData;

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex flex-col  justify-between "
      >
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
            <div className="text-2xl font-bold text-[#6A7FDB]">{kanjiThisWeek}</div>
            <div className="text-xs text-gray-500">this week</div>
          </div>
          <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
            <div className="text-2xl font-bold text-[#F56A83]">{streak}</div>
            <div className="text-xs text-gray-500">day streak</div>
          </div>
          <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
            {track === 'jlpt' ? (
              <>
                <div className="text-xs text-gray-500">JLPT level</div>
                <div className="text-2xl font-bold">N{dashboardData.jlptLevel}</div>
              </>
            ) : (
              <>
                <div className="text-xs text-gray-500">Groups completed</div>
                <div className="text-2xl font-bold">
                  {dashboardData.trackSpecificStats.completedGroups}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 "
        >
          <div className="flex p-6 flex-col justify-between  bg-white rounded-3xl"
          >
            <Button
              as={Link}
              href="/review"
              size="sm"
              className="font-medium text-white bg-[#6A7FDB]"
            >
              Review
            </Button>

          </div>


          <div className="flex p-6 flex-col justify-between  bg-white rounded-3xl"
          >

            <Button
              as={Link}
              href="/discovery"
              size="sm"
              className="font-medium text-white bg-[#6A7FDB]"
            >
              Discovery
            </Button>

          </div>

          <div className="flex p-6 flex-col justify-between  bg-white rounded-3xl" >

            <Button
              as={Link}
              href="/vocab"
              size="sm"
              className="font-medium text-white bg-[#6A7FDB]"
            >
              Vocab
            </Button>
          </div>
        </div>
      </motion.div>


    </>
  );
};