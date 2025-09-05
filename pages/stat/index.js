import { useEffect, useState } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards';

export async function getServerSideProps() {
  return {
    props: {},
  };
}

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, index) => (
      <div key={index} className="w-full bg-gray-100 aspect-square rounded-3xl animate-pulse" />
    ))}
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="text-center py-10">
    <p className="text-red-500">Error loading groups: {error}</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8">
    <p className="text-gray-500">No onyomi groups found.</p>
  </div>
);

const GroupsGrid = ({ groups }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {groups.map((group) => (
      <OnyomiGroupCard
        key={group.reading}
        onyomi={group.reading}
        usefulness_score={group.usefulness_score}
        mastered={group.mastered}
        learning={group.learning}
        unlearned={group.unlearned}
        showProgress={true}
      />
    ))}
  </div>
);

export default function StatisticsPage() {
  const [onyomiGroups, setOnyomiGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/groups/stat');
        const json = await response.json();

        if (json.success) {
          setOnyomiGroups(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError('Failed to load groups');
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem('statisticsPageScrollY', window.scrollY.toString());
    };

    const restoreScroll = () => {
      const savedScrollY = sessionStorage.getItem('statisticsPageScrollY');
      if (savedScrollY && !loading) {
        window.scrollTo(0, parseInt(savedScrollY));
        sessionStorage.removeItem('statisticsPageScrollY');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    if (!loading) {
      restoreScroll();
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [loading]);

  const renderContent = () => {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} />;
    if (onyomiGroups.length === 0) return <EmptyState />;
    return <GroupsGrid groups={onyomiGroups} />;
  };

  return (
    <div className="px-4 pb-24 max-w-5xl mx-auto">
      {renderContent()}
    </div>
  );
}