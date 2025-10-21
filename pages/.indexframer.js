import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button, CircularProgress, Chip, Modal, useDisclosure, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { HiBookOpen, HiCheckCircle, HiQuestionMarkCircle } from "react-icons/hi2";

// Move constants outside component to avoid recreation
const MASTERY_LEVELS = {
  2: { bg: 'bg-green-400', text: 'text-green-900', label: 'Mastered' },
  1: { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Learning' },
  0: { bg: 'bg-red-400', text: 'text-red-900', label: 'Review' }
};

const getMasteryColors = (level) => {
  return MASTERY_LEVELS[level] || MASTERY_LEVELS[0];
};

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

const apiHeaders = {
  'Content-Type': 'application/json',
  'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
};

// Separate components for better organization
const KanjiProgressCard = ({ nextGroup, track, dashboardData }) => (
  <div className="flex px-6 py-8 col-span-1 row-span-1 flex-col shadow-sm justify-center items-center bg-white h-fit rounded-3xl">
    <p className="text-[5.25rem] font-bold font-jp-round mb-2">{nextGroup.reading}</p>
    <Button
      as="a"
      href={track === 'jlpt'
        ? `/groups/${nextGroup.reading}?jlpt=N${dashboardData.jlptLevel}`
        : `/groups/${nextGroup.reading}`
      }
      size="sm"
      className="font-medium text-slate-900 bg-indigo-100"
    >
      Continue Learning
    </Button>
  </div>
);

const StatsCard = ({ progress, stats }) => {
  const completionPercentage = Math.round((progress.mastered / Math.max(progress.total, 1)) * 100);
  const groupsPercentage = Math.round((stats.completedGroups / Math.max(stats.totalGroups, 1)) * 100);

  return (
    <div className="flex p-6 flex-col col-span-1 shadow-sm row-span-2 bg-white rounded-3xl">
      <p className="text-2xl font-bold mb-4">Stats</p>
      <div className="flex flex-1 items-center justify-around">
        <div className="flex flex-col items-center justify-center">
          <CircularProgress
            aria-label="Kanji progress"
            size="lg"
            value={completionPercentage}
            color="primary"
            showValueLabel={true}
            classNames={{
              svg: "w-28 h-28",
              indicator: "stroke-indigo-400",
              track: "stroke-indigo-400/10",
              value: "text-xl font-bold text-indigo-600",
              base: "mb-2"
            }}
            strokeWidth={4}
          />
          <div className="mb-2">
            <span className="text-xl font-bold text-indigo-600">{progress.mastered}</span>
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
              indicator: "stroke-cyan-400",
              track: "stroke-cyan-400/10",
              value: "text-lg font-bold text-cyan-600",
              base: "mb-2"
            }}
            strokeWidth={4}
          />
          <div className="mb-1">
            <span className="text-xl font-bold text-cyan-600">{stats.completedGroups}</span>
            <span className="text-xs"> / {stats.totalGroups} groups</span>
          </div>
          <span className="text-xs mb-2">{stats.inProgressGroups} in progress</span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:gap-4 lg-gap-6 gap-2 mt-3">
        <div className="flex bg-green-400 justify-center gap-x-1 items-center p-2 rounded-2xl">
          <HiCheckCircle className="fill-green-900" />
          <span className="text-base lg:text-lg font-bold text-green-900">{progress.mastered}</span>
        </div>
        <div className="flex bg-yellow-400 justify-center gap-x-1 items-center p-2 rounded-2xl">
          <HiBookOpen className="fill-yellow-900" />
          <span className="text-base lg:text-lg font-bold text-yellow-900">{progress.learning}</span>
        </div>
        <div className="flex bg-red-400 justify-center gap-x-1 items-center p-2 rounded-2xl">
          <HiQuestionMarkCircle className="fill-red-900" />
          <span className="text-base lg:text-lg font-bold text-red-900">{progress.unlearned}</span>
        </div>
      </div>
    </div>
  );
};

const TrackCard = ({ track, onOpen }) => (
  <div className="flex p-6 flex-col col-span-1 shadow-sm bg-white row-span-1 rounded-3xl">
    <p className="text-2xl font-bold mb-4">{track === 'stat' ? 'Stats' : 'JLPT'} Track</p>
    <div className="flex justify-around">
      <Button
        as="a"
        href="/study"
        size="sm"
        className="font-medium text-slate-900 bg-indigo-100"
      >
        View All Kanji Groups
      </Button>
      <Button
        onPress={onOpen}
        color="primary"
        size="sm"
        className="font-medium text-slate-900 bg-indigo-100"
      >
        Change Track
      </Button>
    </div>
  </div>
);

const ActivityCard = ({ recentActivity, weeklyStats }) => {
  if (!recentActivity?.length) return null;

  return (
    <div className="flex p-6 flex-col md:col-span-2 shadow-sm bg-white row-span-2 h-fit mb-8 rounded-3xl">
      <p className="text-2xl font-bold mb-4">Recent Activity</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {recentActivity.map((activity) => {
          const colors = getMasteryColors(activity.masteryLevel);
          return (
            <div
              key={`${activity.kanji}-${activity.lastStudied}`}
              className="flex bg-slate-100 rounded-xl items-center justify-between py-2 px-4"
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
            </div>
          );
        })}

        {weeklyStats && (
          <div className="flex justify-center flex-col py-2 px-4 bg-slate-100 rounded-xl text-xs">
            <div className="flex justify-between">
              <span className="font-bold">This week:</span>
              <span className="font-semibold text-indigo-600">{weeklyStats.thisWeek} kanji</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-bold text-gray-600">Last week:</span>
              <span className="font-semibold text-gray-600">{weeklyStats.lastWeek} kanji</span>
            </div>
            {weeklyStats.thisWeek > weeklyStats.lastWeek && (
              <div className="mt-1 text-green-600 font-medium text-center">
                ↑ {Math.round(((weeklyStats.thisWeek - weeklyStats.lastWeek) / Math.max(weeklyStats.lastWeek, 1)) * 100)}% improvement!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TrackChangeModal = ({ isOpen, onOpenChange, track, changeTrack, changingTrack }) => (
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
);

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
      const response = await fetch('/api/stats', {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ track: newTrack })
      });

      const data = await response.json();

      if (data.success) {
        // Refetch to get updated data
        const fetchResponse = await fetch('/api/stats', { headers: apiHeaders });
        const fetchJson = await fetchResponse.json();

        if (fetchJson.success) {
          setDashboardData(fetchJson.data);
        } else {
          // Fallback to update local state
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
          <div className="text-8xl animate-pulse font-jp-round text-center py-10">
            <p>音読</p>
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

  const { progress, nextGroup, stats, recentActivity, weeklyStats, track } = dashboardData;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        {session?.user?.name && (
          <p className="text-2xl font-bold">
            Hi {session.user.name.replace(/\s*\([^)]*\)$/, '').trim()}!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KanjiProgressCard nextGroup={nextGroup} track={track} dashboardData={dashboardData} />
        <StatsCard progress={progress} stats={stats} />
        <TrackCard track={track} onOpen={onOpen} />
        <ActivityCard recentActivity={recentActivity} weeklyStats={weeklyStats} />
      </div>

      <TrackChangeModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        track={track}
        changeTrack={changeTrack}
        changingTrack={changingTrack}
      />
    </div>
  );
}