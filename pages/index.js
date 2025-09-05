import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Progress, Card, Chip } from '@heroui/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { HiBookOpen, HiCheckCircle, HiQuestionMarkCircle } from "react-icons/hi2";


export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stats?type=full', {
          headers: {
            'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN || 'fallback-token-for-dev'
          }
        });
        const json = await response.json();

        if (json.success) {
          setDashboardData(json.data);
        } else {
          if (response.status === 401) {
            router.push('/auth/signin');
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
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

  if (!dashboardData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p>Unable to load dashboard data. Please try signing in again.</p>
        </div>
      </div>
    );
  }

  const { progress, nextGroup, stats, recentActivity, weeklyStats } = dashboardData;

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: enIE
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        {status === 'authenticated' ? (
          <p className="text-3xl font-bold">
            Hi {session?.user?.name?.replace(/\s*\([^)]*\)$/, '').trim() || ''}!
          </p>
        ) : (
          <div></div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 border-4 rounded-3xl border-black">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Jump back in!</h3>
          <div className='flex flex-1 flex-col justify-center items-center'>
            <p className="text-6xl font-jp-round font-bold mb-4">{nextGroup.reading}</p>
            <Button
              as="a"
              href={`/groups/${nextGroup.reading}`}
              color="primary"
              size="lg"
              className="font-medium"
            >
              Start Learning
            </Button>
          </div>
        </Card>
        <Card className="p-6 border-4 rounded-3xl border-black">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Kanji Progress</h3>
          <div className="mb-2">
            <span className="text-2xl font-bold text-blue-600">{progress.mastered}</span>
            <span className="text-gray-600"> / {progress.total} kanji</span>
          </div>
          <Progress
            aria-label="Kanji progress"
            size="lg"
            value={Math.round((progress.mastered / Math.max(progress.total, 1)) * 100)}
            color="primary"
            className="mb-2"
          />
          <p className="text-sm text-gray-500">
            {Math.round((progress.mastered / Math.max(progress.total, 1)) * 100)}% complete
          </p>

          <div className="flex gap-2 mt-3">
            <Chip
              classNames={{
                base: "pl-2",
                content: "text-white font-bold",
              }}
              startContent={<HiCheckCircle color="white" />} className='bg-green-500 text-bold'>
              {progress.mastered}
            </Chip>

            <Chip
              classNames={{
                base: "pl-2",
                content: "text-white font-bold",
              }}
              startContent={<HiBookOpen color="white" />} className='bg-yellow-500 text-bold'>
              {progress.learning}
            </Chip>
            <Chip
              classNames={{
                base: "pl-2",
                content: "text-white font-bold",
              }}
              startContent={<HiQuestionMarkCircle color="white" />} className='bg-red-500 text-bold'>
              {progress.unlearned}
            </Chip>
          </div>

          {weeklyStats && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">This week:</span>
                <span className="font-semibold text-blue-600">{weeklyStats.thisWeek} kanji</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Last week:</span>
                <span className="font-semibold text-gray-600">{weeklyStats.lastWeek} kanji</span>
              </div>
              {weeklyStats.thisWeek > weeklyStats.lastWeek && (
                <div className="mt-1 text-green-600 font-medium text-center">
                  ↑ {Math.round(((weeklyStats.thisWeek - weeklyStats.lastWeek) / Math.max(weeklyStats.lastWeek, 1)) * 100)}% improvement!
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4 border-4 rounded-3xl border-black text-center">
          I&apos;ll add stuff here later
        </Card>

        <Card className="p-6 border-4 rounded-3xl border-black">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Onyomi Groups</h3>
          <div className="mb-2">
            <span className="text-2xl font-bold text-green-600">{stats.completedGroups}</span>
            <span className="text-gray-600"> / {stats.totalGroups} groups</span>
          </div>
          <Progress
            aria-label="Groups progress"
            size="lg"
            value={Math.round((stats.completedGroups / Math.max(stats.totalGroups, 1)) * 100)}
            color="success"
            className="mb-2"
          />
          <p className="text-sm text-gray-500">
            {Math.round((stats.completedGroups / Math.max(stats.totalGroups, 1)) * 100)}% complete
          </p>

          <div className="flex gap-2 mt-3">
            <Chip
              classNames={{
                base: "bg-indigo-500",
                content: "text-white font-bold",
              }}

              variant="flat">
              Total: {stats.totalGroups}
            </Chip>
            <Chip classNames={{
              base: "bg-violet-300",
              content: "text-white font-bold",
            }}
              variant="flat">
              {stats.inProgressGroups} in progress
            </Chip>
          </div>
        </Card>
      </div>

      {recentActivity && recentActivity.length > 0 && (
        <div className="mb-8">
          <Card className="p-6 border-4 rounded-3xl border-black">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={`${activity.kanji}-${activity.lastStudied}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-jp-round">{activity.kanji}</span>
                    <div>
                      <p className="font-medium text-sm">{activity.kanji}</p>
                      <p className="text-xs text-gray-500">{activity.onyomi} group</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip
                      classNames={{
                        base: ` ${activity.masteryLevel === 2 ? 'bg-green-500' :
                          activity.masteryLevel === 1 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`,
                        content: "text-white text-xs font-bold",
                      }}>


                      {activity.masteryLevel === 2 ? 'Mastered' :
                        activity.masteryLevel === 1 ? 'Learning' : 'Review'}
                    </Chip>
                    <span className="text-xs font-bold text-gray-500">
                      {activity.lastStudied ? formatRelativeTime(activity.lastStudied) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/stat" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Study by Usefulness</h3>
            <p className="text-gray-600 mb-4">Follow the most statistically useful kanji groups first</p>
            <div className="text-blue-600 font-medium">View All Groups →</div>
          </Card>
        </Link>

        <Link href="/jlpt" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Study by JLPT Level</h3>
            <p className="text-gray-600 mb-4">Progress through kanji organized by JLPT difficulty</p>
            <div className="text-blue-600 font-medium">View JLPT Track →</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

