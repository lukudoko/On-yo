import { motion } from 'framer-motion';
import { Link, Button } from '@heroui/react';
import { HiMiniCheckCircle, HiMiniBookOpen, HiMiniQuestionMarkCircle } from "react-icons/hi2";

export default function HeroCard({ itemVariants, data }) {
  const { nextGroup, track, jlptLevel } = data;

  console.log(nextGroup);

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex gap-4 bg-white/90 rounded-3xl flex-col p-6  items-center "
      >
        <p className="text-[5.1rem] py-2 font-bold  font-jp-round ">
          {nextGroup.reading}
        </p>
        <div className="flex gap-2">
          <div className="flex bg-[#26A68210] rounded-xl justify-center gap-x-1 items-center p-2">
            <HiMiniCheckCircle className="fill-[#26A682]" />
            <span className="text-sm font-black text-[#26A682]">{Math.round(nextGroup.completion)}%</span>
          </div>
          {nextGroup.learningCount > 0 && (
            <div className="flex bg-[#FE9D0B10] rounded-xl justify-center gap-x-1 items-center p-2">
              <HiMiniBookOpen className="fill-[#FE9D0B]" />
              <span className="text-sm font-black text-[#FE9D0B]">
                {nextGroup.learningCount}
              </span>
            </div>
          )}
          {nextGroup.unlearnedCount > 0 && (
            <div className="flex bg-[#EB475210] rounded-xl justify-center gap-x-1 items-center p-2">
              <HiMiniQuestionMarkCircle className="fill-[#EB4752]" />
              <span className="text-sm font-black text-[#EB4752]">
                {nextGroup.unlearnedCount}
              </span>
            </div>
          )}
        </div>


        <div className="flex items-center flex-col  px-6 w-full gap-3 ">
          <Button
            as={Link}
            href={
              track === "jlpt"
                ? `/groups/${nextGroup.reading}?jlpt=N${jlptLevel}`
                : `/groups/${nextGroup.reading}`
            }
            size="lg"
            className="font-bold w-full text-white bg-[#6A7FDB]"
          >
            Continue!
          </Button>
          <Link
            href={
              track === "jlpt"
                ? `/groups?jlpt=${data.jlptLevel}`
                : `/groups`
            }
            size="sm"
            className=" text-[#6A7FDB] hover:opacity-80"
          >
            Explore Groups
          </Link>
        </div>
      </motion.div>
    </>
  );
};
