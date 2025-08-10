import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, Progress, Card, Chip } from '@heroui/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { getDashboardData } from '@/utils/dashboard';

export default function Home({ dashboardData }) {
  const { data: session, status } = useSession();

  

  if (status === 'loading') {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p>Unable to load dashboard data. Please try signing in again.</p>
          { }
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
      { }
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

        <Card className="p-6  border-4 rounded-3xl border-black ">
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

          { }
          <div className="flex gap-2 mt-3">
            <Chip size="sm" className="text-white bg-green-500" variant="flat">
              {progress.mastered} Mastered
            </Chip>
            <Chip size="sm" className="text-white bg-yellow-500" variant="flat">
              {progress.learning} Learning
            </Chip>
            <Chip size="sm" className='text-white bg-red-500' variant="flat">
              Don't Know {progress.unlearned}
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
          I'll add stuff here later
        </Card>
        <Card className="p-6  border-4 rounded-3xl border-black ">
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

          { }
          <div className="flex gap-2 mt-3">
            <Chip size="sm" color="primary" variant="flat">
              Total: {stats.totalGroups}
            </Chip>
            <Chip size="sm" color="secondary" variant="flat">
              In Progress: {stats.inProgressGroups}
            </Chip>
          </div>
        </Card>
      </div>

      { }
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.masteryLevel === 2 ? 'bg-green-100 text-green-800' :
                      activity.masteryLevel === 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {activity.masteryLevel === 2 ? 'Mastered' :
                        activity.masteryLevel === 1 ? 'Learning' : 'Review'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activity.lastStudied ? formatRelativeTime(activity.lastStudied) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      { }
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

export async function getServerSideProps(context) {
  const { req, res } = context;

  try {

    const dashboardData = await getDashboardData(req, res);

    if (dashboardData === null) {

      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }

    return {
      props: {
        dashboardData,
      },
    };
  } catch (error) {

    console.error('Unexpected error in dashboard getServerSideProps:', error);

    return {
      props: {
        dashboardData: null,
      },
    };
  }
}