import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button, CircularProgress, Modal, useDisclosure, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { HiBookOpen, HiMiniCheckCircle, HiMiniQuestionMarkCircle } from "react-icons/hi2";
import { startOfWeek, isWithinInterval, subWeeks } from 'date-fns';

const apiHeaders = {
  'Content-Type': 'application/json',
  'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [changingTrack, setChangingTrack] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/stats', { headers: apiHeaders });
        const json = await response.json();

        if (json.success) {
          setDashboardData(json.data);
        } else {
          if (response.status === 401) {
            router.push('/auth/signin');
          } else {
            setError('Failed to load dashboard data');
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to connect to server');
      }
    };

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const changeTrack = async (newTrack) => {
    setChangingTrack(true);
    try {
      const response = await fetch('/api/user/track', {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ track: newTrack })
      });

      const data = await response.json();

      if (data.success) {
        const fetchResponse = await fetch('/api/stats', { headers: apiHeaders });
        const fetchJson = await fetchResponse.json();
        if (fetchJson.success) {
          setDashboardData(fetchJson.data);
        } else {
          setDashboardData(prev => ({ ...prev, track: data.track }));
        }

        onOpenChange(false);
      } else {
        console.error('Error updating track:', data.error);
        setError('Failed to update track');
      }
    } catch (error) {
      console.error('Error updating track:', error);
      setError('Failed to update track');
    } finally {
      setChangingTrack(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && !dashboardData && !error)) {
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
          <p className="text-red-600 mb-4">{error || 'Unable to load dashboard data.'}</p>
          <Button
            color="primary"
            onPress={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { progress, nextGroup, stats, weeklyStats, track } = dashboardData;
  const completionPercentage = Math.round((progress.mastered / Math.max(progress.total, 1)) * 100);
  const groupsPercentage = Math.round((stats.completedGroups / Math.max(stats.totalGroups, 1)) * 100);

  function calculateWeeklyStats(timestamps) {
    if (!timestamps || timestamps.length === 0) {
      return { thisWeek: 0, lastWeek: 0 };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    let last7Days = 0;
    let previous7Days = 0;

    timestamps.forEach(timestamp => {
      const date = new Date(timestamp);

      if (date >= sevenDaysAgo) {
        last7Days++;
      } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
        previous7Days++;
      }
    });

    return { thisWeek: last7Days, lastWeek: previous7Days };
  }

  const weeklyStatsCalculated = calculateWeeklyStats(weeklyStats);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
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
            Hi {session.user.name.replace(/\s*\([^)]*\)$/, '').trim()}!
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
          className="flex px-6 py-8 gap-6 h-full col-span-1 row-span-2  shadow-sm justify-center items-center bg-white rounded-3xl"
        >
          <div className='flex flex-1 items-center max-h-60 h-full gap-4 flex-col justify-around'>
            <p className="text-[5.25rem] font-bold font-jp-round ">{nextGroup.reading}</p>
            <div className='flex gap-6 '>
              <Button
                as="a"
                href={track === 'jlpt'
                  ? `/groups/${nextGroup.reading}?jlpt=N${dashboardData.jlptLevel}`
                  : `/groups/${nextGroup.reading}`
                }
                size="md"
                className="font-medium text-white bg-[#3B4790]"
              >
                Continue!
              </Button>
              <Button
                as="a"
                href="/groups"
                className="font-medium text-white bg-[#3B4790]"
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
          <p className="text-xl font-bold mb-4">Stats</p>
          <div className="flex flex-1 items-center justify-around">

            <div className="flex flex-col items-center justify-center">
              <CircularProgress
                aria-label="Kanji progress"
                size="lg"
                value={completionPercentage}
                showValueLabel={true}
                classNames={{
                  svg: "w-28 h-28",
                  indicator: "stroke-[#3B4790]",
                  track: "stroke-[#3B479010]",
                  value: "text-xl font-bold text-[#3B4790]",
                  base: "mb-2"
                }}
                strokeWidth={4}
              />
              <div className="mb-2">
                <span className="text-xl font-bold text-[#3B4790]">{progress.mastered}</span>
                <span className="text-xs"> / {progress.total} kanji</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <CircularProgress
                aria-label="Groups progress"
                size="lg"
                value={groupsPercentage}
                color="success"
                showValueLabel={true}
                classNames={{
                  svg: "w-28 h-28",
                  indicator: "stroke-[#F56A83]",
                  track: "stroke-[#F56A8310]",
                  value: "text-lg font-bold text-[#F56A83]",
                  base: "mb-2"
                }}
                strokeWidth={4}
              />
              <div className="mb-1">
                <span className="text-xl font-bold text-[#F56A83]">{stats.completedGroups}</span>
                <span className="text-xs"> / {stats.totalGroups} groups</span>
              </div>
              <span className="text-xs mb-2">{stats.inProgressGroups} in progress</span>
            </div>
          </div>

          <div className="flex justify-center py-4 gap-6">
            <div className="flex justify-center gap-x-1 items-center p-2">
              <HiMiniCheckCircle className="fill-[#1F8A6C]" />
              <span className="text-lg lg:text-xl font-black decoration-2 underline text-[#1F8A6C]">{progress.mastered}</span>
            </div>
            <div className="flex  justify-center gap-x-1 items-center p-2 rounded-2xl">
              <HiBookOpen className="fill-[#FF7C37]" />
              <span className="text-lg lg:text-xl font-black decoration-2 underline text-[#FF7C37]">{progress.learning}</span>
            </div>
            <div className="flex  justify-center gap-x-1 items-center p-2 rounded-2xl">
              <HiMiniQuestionMarkCircle className="fill-[#E72C3A]" />
              <span className="text-lg lg:text-xl font-black decoration-2 underline  text-[#E72C3A]">{progress.unlearned}</span>
            </div>
          </div>

          {weeklyStats && (
            <div className="flex justify-center flex-col p-4 bg-[#3B479010]  rounded-3xl text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Last 7 days:</span>
                <span className="font-semibold text-[#3B4790]">{weeklyStatsCalculated.thisWeek} kanji</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-bold text-gray-600">Previous 7 days:</span>
                <span className="font-semibold text-gray-600">{weeklyStatsCalculated.lastWeek} kanji</span>
              </div>
              {weeklyStatsCalculated.thisWeek > weeklyStatsCalculated.lastWeek && (
                <div className="mt-1 text-green-600 font-medium text-center">
                  {weeklyStats.lastWeek === 0 ? (
                    "Great start this week!"
                  ) : Math.round(((weeklyStatsCalculated.thisWeek - weeklyStatsCalculated.lastWeek) / weeklyStatsCalculated.lastWeek) * 100) > 500 ? (
                    "Keep it up!"
                  ) : (
                    `↑ ${Math.round(((weeklyStatsCalculated.thisWeek - weeklyStatsCalculated.lastWeek) / weeklyStatsCalculated.lastWeek) * 100)}% improvement!`
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex p-6 flex-col justify-between shadow-sm bg-white rounded-3xl"
        >
          <p className="text-xl font-bold mb-4">Test Yourself!</p>
          <div className="flex items-end py-3 justify-around">
            <Button
              as="a"
              href="/review"
              size="sm"
              className="font-medium text-white bg-[#F56A83]"
            >
              Review Kanji
            </Button>
            <Button
              size="sm"
              className="font-medium text-white bg-[#F56A83]"
            >
              Learn (Coming soon)
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex p-6 flex-col  shadow-sm bg-white rounded-3xl"
        >
          <p className="text-xl font-bold mb-4">{track === 'stat' ? 'Stats' : 'JLPT'} Track</p>
          <div className="flex items-end py-3  justify-around">

            <Button
              onPress={onOpen}
              size="sm"
              className="font-medium text-white bg-[#3B4790]"
            >
              Change Track
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
              <ModalHeader className="flex flex-col gap-1">Change Learning Track</ModalHeader>
              <ModalBody>
                <p>Switch between following a more statistically oriented track, or one which more closely follows the JLPT</p>
                <p>Stats explainer</p>
                <p>JLPT explainer</p>
                <div className="mt-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={track === 'stat' ? 'solid' : 'bordered'}
                      onPress={() => changeTrack('stat')}
                      isLoading={changingTrack && track !== 'stat'}
                      isDisabled={changingTrack || track === 'stat'}
                      className="font-semibold text-indigo-800 "

                    >
                      Statistics-Based Track
                    </Button>
                    <Button
                      color="primary"
                      variant={track === 'jlpt' ? 'solid' : 'bordered'}
                      onPress={() => changeTrack('jlpt')}
                      isLoading={changingTrack && track !== 'jlpt'}
                      isDisabled={changingTrack || track === 'jlpt'}
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