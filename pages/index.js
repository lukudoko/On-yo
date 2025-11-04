import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Button,
  Tooltip,
  Link,
  Modal,
  useDisclosure,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useStats } from "@/contexts/stats";

const apiHeaders = {
  "Content-Type": "application/json",
  "X-API-Token": process.env.NEXT_PUBLIC_API_TOKEN,
};

export default function Home() {
  const { data: session, status } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [changingTrack, setChangingTrack] = useState(false);
  const { stats: dashboardData, error, refreshStats } = useStats();

  const changeTrack = async (newTrack) => {
    setChangingTrack(true);
    try {
      const response = await fetch("/api/user/track", {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify({ track: newTrack }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshStats();

        onOpenChange(false);
      } else {
        console.error("Error updating track:", data.error);
      }
    } catch (error) {
      console.error("Error updating track:", error);
    } finally {
      setChangingTrack(false);
    }
  };

  if (
    status === "loading" ||
    (status === "authenticated" && !dashboardData && !error)
  ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          <div className="text-5xl font-bold animate-pulse font-jp text-center py-10">
            <p>On&apos;yo!</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p className="text-red-600 mb-4">
            {error || "Unable to load dashboard data."}
          </p>
          <Button color="primary" onPress={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { progress, nextGroup, weeklyStats, track } = dashboardData;
  const completionPercentage = Math.round(
    (progress.mastered / Math.max(progress.total, 1)) * 100
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        {session?.user?.name && (
          <p className="text-2xl font-bold">
            Hi {session.user.name.replace(/\s*\([^)]*\)$/, "").trim()}!
          </p>
        )}
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex px-6 py-8 gap-6 h-full col-span-1 row-span-1  shadow-sm justify-center items-center bg-white rounded-3xl"
        >
          <div className="flex flex-1 items-center max-h-60 h-full gap-4 flex-col justify-around">
            <p className="text-[5rem] font-bold font-jp-round ">
              {nextGroup.reading}
            </p>
            <div className="flex gap-6 ">
              <Button
                as={Link}
                href={
                  track === "jlpt"
                    ? `/groups/${nextGroup.reading}?jlpt=N${dashboardData.jlptLevel}`
                    : `/groups/${nextGroup.reading}`
                }
                size="md"
                className="font-medium text-white bg-[#6A7FDB]"
              >
                Continue!
              </Button>
              <Button
                as={Link}
                href="/groups"
                className="font-medium text-white bg-[#6A7FDB]"
              >
                All Groups
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex p-6 flex-col col-span-1 shadow-sm row-span-2 bg-white rounded-3xl"
        >
          <p className="text-3xl font-bold mb-8">Your Progress</p>

          <div className="flex mx-auto items-baseline mb-6">
            <span className="text-5xl font-extrabold">
              {completionPercentage}%
            </span>
            <span className="text-sm text-gray-500 ml-2">of joyou kanji</span>
          </div>

          <div className="flex overflow-hidden w-10/12 mx-auto rounded-full h-6 mb-4">
              <div
                className="bg-[#26A682] flex items-center justify-center"
                style={{
                  width: `${(progress.mastered / progress.total) * 100}%`,
                }}
              >
                {progress.mastered > 0 && (
                  <span className="text-white text-xs font-bold">
                    {progress.mastered}
                  </span>
                )}
              </div>
              <div
                className="bg-[#FE9D0B] flex items-center justify-center"
                style={{
                  width: `${(progress.learning / progress.total) * 100}%`,
                }}
              >
                {progress.learning > 0 && (
                  <span className="text-white text-xs font-bold">
                    {progress.learning}
                  </span>
                )}
              </div>
              <div
                className="bg-[#EB4752] flex items-center justify-center"
                style={{
                  width: `${(progress.unlearned / progress.total) * 100}%`,
                }}
              >
                {progress.unlearned > 0 && (
                  <span className="text-white text-xs font-bold">
                    {progress.unlearned}
                  </span>
                )}
              </div>
           
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
              <div className="text-2xl font-bold text-[#26A682]">10</div>
              <div className="text-xs text-gray-500">this week</div>
            </div>
            <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
              <div className="text-2xl font-bold text-[#FE9D0B]">5</div>
              <div className="text-xs text-gray-500">day streak</div>
            </div>
            <div className="text-center p-3 bg-[#6A7FDB15] rounded-xl">
              <div className="text-xs text-gray-500">JLPT level</div>
              <div className="text-2xl font-bold">
                N{dashboardData.jlptLevel}
              </div>
            </div>
          </div>

          {track === "jlpt" && (
            <div className="mt-auto">
              <h4 className="font-semibold mb-2">JLPT Progress</h4>
              <div className="space-y-2"></div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
            <span className="text-sm text-gray-500">
              Learning: {track === "jlpt" ? "JLPT Order" : "Frequency Order"}
            </span>
            <Button
              onPress={onOpen}
              size="sm"
              className="ml-7 font-medium text-white bg-[#6A7FDB]"
            >
              Change Track
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex p-6 flex-col justify-between shadow-sm bg-white rounded-3xl"
        >
          <p className="text-xl font-bold mb-4">Test Yourself!</p>
          <div className="flex items-end py-3 justify-around">
            <Button
              as={Link}
              href="/review"
              size="sm"
              className="font-medium text-white bg-[#6A7FDB]"
            >
              Review Kanji
            </Button>
            <Button size="sm" className="font-medium text-white bg-[#6A7FDB]">
              Learn (Coming soon)
            </Button>
          </div>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        classNames={{
          base: "rounded-3xl border-0",
          header: "border-b-0 pb-2",
          body: "pt-0",
          closeButton: "text-2xl text-black hover:bg-default-100",
          backdrop: "bg-white/40",
        }}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Change Learning Track
              </ModalHeader>
              <ModalBody>
                <p>
                  Switch between following a more statistically oriented track,
                  or one which more closely follows the JLPT
                </p>
                <p>Stats explainer</p>
                <p>JLPT explainer</p>
                <div className="mt-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={track === "stat" ? "solid" : "bordered"}
                      onPress={() => changeTrack("stat")}
                      isLoading={changingTrack && track !== "stat"}
                      isDisabled={changingTrack || track === "stat"}
                      className="font-semibold text-indigo-800 "
                    >
                      Statistics-Based Track
                    </Button>
                    <Button
                      color="primary"
                      variant={track === "jlpt" ? "solid" : "bordered"}
                      onPress={() => changeTrack("jlpt")}
                      isLoading={changingTrack && track !== "jlpt"}
                      isDisabled={changingTrack || track === "jlpt"}
                      className="font-semibold text-indigo-800 bg-indigo-100"
                    >
                      JLPT Track
                    </Button>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
