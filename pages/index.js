import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button, CircularProgress, Chip, Modal, useDisclosure, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { HiBookOpen, HiCheckCircle, HiQuestionMarkCircle } from "react-icons/hi2";
import { motion, AnimatePresence } from 'framer-motion';

const MASTERY_CONFIG = {
  2: { bg: 'bg-green-400', text: 'text-green-900', label: 'Mastered', icon: HiCheckCircle },
  1: { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Learning', icon: HiBookOpen },
  0: { bg: 'bg-red-400', text: 'text-red-900', label: 'Review', icon: HiQuestionMarkCircle }
};

const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
};

const getMasteryColors = (level) => MASTERY_CONFIG[level] ?? MASTERY_CONFIG[0];

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: enIE
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const calculatePercentage = (value, total) =>
  Math.round((value / Math.max(total, 1)) * 100);

const getImprovementPercentage = (current, previous) =>
  Math.round(((current - previous) / Math.max(previous, 1)) * 100);

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
      type: "spring",
      stiffness: 100
    }
  }
};

const LoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center p-6"
  >
    <div className="max-w-5xl w-full">
      <motion.div
        className="text-8xl font-jp-round text-center py-10"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <p>音読</p>
      </motion.div>
    </div>
  </motion.div>
);

const ErrorState = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 max-w-5xl mx-auto"
  >
    <div className="text-center py-10">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-600 mb-4"
      >
        {error || 'Unable to load dashboard data.'}
      </motion.p>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button color="primary" onPress={onRetry}>
          Retry
        </Button>
      </motion.div>
    </div>
  </motion.div>
);

const NextGroupCard = ({ nextGroup, track, jlptLevel }) => (
  <motion.div
    variants={itemVariants}
    className="flex px-6 py-8 col-span-1 row-span-1 flex-col shadow-sm justify-center items-center bg-white h-fit rounded-3xl"
  >
    <motion.p
      className="text-[5.25rem] font-bold font-jp-round mb-2"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {nextGroup.reading}
    </motion.p>
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Button
        as="a"
        href={track === 'jlpt'
          ? `/groups/${nextGroup.reading}?jlpt=N${jlptLevel}`
          : `/groups/${nextGroup.reading}`
        }
        size="sm"
        className="font-medium text-slate-900 bg-indigo-100"
      >
        Continue Learning
      </Button>
    </motion.div>
  </motion.div>
);

const ProgressCircle = ({ value, mastered, total, color, strokeColor, label }) => (
  <motion.div
    className="flex flex-col items-center justify-center"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <CircularProgress
      aria-label={`${label} progress`}
      size="lg"
      value={value}
      color={color}
      showValueLabel={true}
      classNames={{
        svg: "w-28 h-28",
        indicator: strokeColor,
        track: `${strokeColor}/10`,
        value: `text-xl font-bold ${color === 'primary' ? 'text-indigo-600' : 'text-cyan-600'}`,
        base: "mb-2"
      }}
      strokeWidth={4}
    />
    <div className="mb-2">
      <span className={`text-xl font-bold ${color === 'primary' ? 'text-indigo-600' : 'text-cyan-600'}`}>
        {mastered}
      </span>
      <span className="text-xs"> / {total} {label}</span>
    </div>
  </motion.div>
);

const StatsCard = ({ progress, stats }) => {
  const completionPercentage = calculatePercentage(progress.mastered, progress.total);
  const groupsPercentage = calculatePercentage(stats.completedGroups, stats.totalGroups);

  return (
    <motion.div
      variants={itemVariants}
      className="flex p-6 flex-col col-span-1 shadow-sm row-span-2 bg-white rounded-3xl"
    >
      <motion.p
        className="text-2xl font-bold mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Stats
      </motion.p>
      <div className="flex flex-1 items-center justify-around">
        <ProgressCircle
          value={completionPercentage}
          mastered={progress.mastered}
          total={progress.total}
          color="primary"
          strokeColor="stroke-indigo-400"
          label="kanji"
        />
        <div className="flex flex-col items-center justify-center">
          <ProgressCircle
            value={groupsPercentage}
            mastered={stats.completedGroups}
            total={stats.totalGroups}
            color="success"
            strokeColor="stroke-cyan-400"
            label="groups"
          />
          <span className="text-xs mb-2">{stats.inProgressGroups} in progress</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:gap-4 lg-gap-6 gap-2 mt-3">
        {Object.entries(MASTERY_CONFIG).reverse().map(([level, config]) => {
          const Icon = config.icon;
          const count = level === '2' ? progress.mastered :
            level === '1' ? progress.learning :
              progress.unlearned;
          return (
            <motion.div
              key={level}
              className={`flex ${config.bg} justify-center gap-x-1 items-center p-2 rounded-2xl`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className={`fill-${config.text.split('-')[1]}`} />
              <span className={`text-base lg:text-lg font-bold ${config.text}`}>{count}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

const TrackCard = ({ track, onChangeTrack }) => (
  <motion.div
    variants={itemVariants}
    className="flex p-6 flex-col col-span-1 shadow-sm bg-white row-span-1 rounded-3xl"
  >
    <motion.p
      className="text-2xl font-bold mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {track === 'stat' ? 'Stats' : 'JLPT'} Track
    </motion.p>
    <div className="flex justify-around">
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Button
          as="a"
          href="/study"
          size="sm"
          className="font-medium text-slate-900 bg-indigo-100"
        >
          View All Kanji Groups
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Button
          onPress={onChangeTrack}
          color="primary"
          size="sm"
          className="font-medium text-slate-900 bg-indigo-100"
        >
          Change Track
        </Button>
      </motion.div>
    </div>
  </motion.div>
);

const ActivityItem = ({ activity }) => {
  const colors = getMasteryColors(activity.masteryLevel);

  return (
    <motion.div
      className="flex bg-slate-100 rounded-xl items-center justify-between py-2 px-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl font-jp-round">{activity.kanji}</span>
        <div>
          <p className="text-xs">{activity.onyomi} group</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Chip
          size="sm"
          classNames={{
            base: colors.bg,
            content: `${colors.text} text-[0.675rem] font-bold`,
          }}
        >
          {colors.label}
        </Chip>
        <span className="text-[0.675rem] max-w-20 text-right font-semibold">
          {formatRelativeTime(activity.lastStudied)}
        </span>
      </div>
    </motion.div>
  );
};

const WeeklyStatsCard = ({ weeklyStats }) => {
  const hasImprovement = weeklyStats.thisWeek > weeklyStats.lastWeek;
  const improvement = hasImprovement ? getImprovementPercentage(weeklyStats.thisWeek, weeklyStats.lastWeek) : 0;

  return (
    <motion.div
      className="flex justify-center flex-col py-2 px-4 bg-slate-100 rounded-xl text-xs"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between">
        <span className="font-bold">This week:</span>
        <span className="font-semibold text-indigo-600">{weeklyStats.thisWeek} kanji</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-bold text-gray-600">Last week:</span>
        <span className="font-semibold text-gray-600">{weeklyStats.lastWeek} kanji</span>
      </div>
      {hasImprovement && (
        <motion.div
          className="mt-1 text-green-600 font-medium text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ↑ {improvement}% improvement!
        </motion.div>
      )}
    </motion.div>
  );
};

const RecentActivitySection = ({ recentActivity, weeklyStats }) => {
  if (!recentActivity?.length) return null;

  return (
    <motion.div
      variants={itemVariants}
      className="flex p-6 flex-col md:col-span-2 shadow-sm bg-white row-span-2 h-fit mb-8 rounded-3xl"
    >
      <motion.p
        className="text-2xl font-bold mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Recent Activity
      </motion.p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {recentActivity.map((activity, index) => (
          <ActivityItem
            key={`${activity.kanji}-${activity.lastStudied}`}
            activity={activity}
          />
        ))}
        {weeklyStats && <WeeklyStatsCard weeklyStats={weeklyStats} />}
      </div>
    </motion.div>
  );
};

const TrackModal = ({ isOpen, onOpenChange, track, changingTrack, onChangeTrack }) => (
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
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <ModalHeader className="flex flex-col gap-1">Change Learning Track</ModalHeader>
          <ModalBody>
            <p className="mb-2">
              Switch between following a more statistically oriented track, or one which more closely follows the JLPT
            </p>
            <div className="mt-4">
              <div className="flex flex-col gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={track === 'stat' ? 'solid' : 'bordered'}
                    onPress={() => onChangeTrack('stat')}
                    isLoading={changingTrack && track !== 'stat'}
                    isDisabled={changingTrack || track === 'stat'}
                    className="font-semibold text-indigo-800"
                  >
                    Statistics-Based Track
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    color="primary"
                    variant={track === 'jlpt' ? 'solid' : 'bordered'}
                    onPress={() => onChangeTrack('jlpt')}
                    isLoading={changingTrack && track !== 'jlpt'}
                    isDisabled={changingTrack || track === 'jlpt'}
                    className="font-semibold text-indigo-800 bg-indigo-100"
                  >
                    JLPT Track
                  </Button>
                </motion.div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </motion.div>
      )}
    </ModalContent>
  </Modal>
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [changingTrack, setChangingTrack] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/stats', { headers: API_HEADERS });
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
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, fetchDashboardData]);

  const handleChangeTrack = async (newTrack) => {
    setChangingTrack(true);
    try {
      const response = await fetch('/api/stats', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ track: newTrack })
      });

      const data = await response.json();

      if (data.success) {
        await fetchDashboardData();
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

  const userName = session?.user?.name?.replace(/\s*\([^)]*\)$/, '').trim();

  if (status === 'loading' || (status === 'authenticated' && !dashboardData && !error)) {
    return <LoadingState />;
  }

  if (error || !dashboardData) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  const { progress, nextGroup, stats, recentActivity, weeklyStats, track, jlptLevel } = dashboardData;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 max-w-5xl mx-auto"
      >
        {userName && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-2xl font-bold">Hi {userName}!</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <NextGroupCard nextGroup={nextGroup} track={track} jlptLevel={jlptLevel} />
          <StatsCard progress={progress} stats={stats} />
          <TrackCard track={track} onChangeTrack={onOpen} />
          <RecentActivitySection recentActivity={recentActivity} weeklyStats={weeklyStats} />
        </div>

        <TrackModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          track={track}
          changingTrack={changingTrack}
          onChangeTrack={handleChangeTrack}
        />
      </motion.div>
    </AnimatePresence>
  );
}