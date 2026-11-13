import { motion } from "framer-motion";
import {
  HiMiniBookOpen,
  HiMiniCheckCircle,
  HiMiniQuestionMarkCircle,
} from "react-icons/hi2";
import { CircularProgressChart, JLPTProgressChart } from "@/components/progressDisplays";
import { Progress } from "@heroui/react";

export default function StatsCard({ itemVariants, data }) {
  const { progress, trackSpecificStats, track } = data;
  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex p-6 flex-col col-span-1 md:col-span-2 bg-white rounded-3xl"
      >
        <p className="text-xl font-bold">Learning Stats</p>

        <div className="grid p-4 grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col mx-auto items-center">
            <CircularProgressChart
              mastered={progress.mastered}
              learning={progress.learning}
              unlearned={progress.unlearned}
              total={progress.total}
              goal={progress.goalName}
            />

            <div className="flex w-full justify-evenly py-5">
              <div className="flex bg-[#26A68210] rounded-xl justify-center gap-x-1 items-center p-2">
                <HiMiniCheckCircle className="fill-[#26A682]" />
                <span className="text-sm font-black text-[#26A682]">
                  {progress.mastered}
                </span>
              </div>

              <div className="flex bg-[#FE9D0B10] rounded-xl justify-center gap-x-1 items-center p-2">
                <HiMiniBookOpen className="fill-[#FE9D0B]" />
                <span className="text-sm font-black text-[#FE9D0B]">
                  {progress.learning}
                </span>
              </div>

              <div className="flex bg-[#EB475210] rounded-xl justify-center gap-x-1 items-center p-2">
                <HiMiniQuestionMarkCircle className="fill-[#EB4752]" />
                <span className="text-sm font-black text-[#EB4752]">
                  {progress.unlearned}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {track === "jlpt" ? (
              <div className="my-auto">
                <div className="font-semibold mb-2">JLPT Levels</div>
                <JLPTProgressChart trackSpecificStats={trackSpecificStats} />
              </div>
            ) : (
              <div className="my-auto">
                <h4 className="font-semibold mb-2">Group Progress</h4>
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Progress
                    classNames={{
                      base: "max-w-xs",
                      indicator: "bg-[#6A7FDB]",
                      value: "text-foreground/60",
                    }}
                    showValueLabel={true}
                    size="lg"
                    value={Math.round(
                      (trackSpecificStats.completedGroups /
                        trackSpecificStats.totalGroups) *
                      100
                    )}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {trackSpecificStats.inProgressGroups} groups in progress
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </>
  );
}