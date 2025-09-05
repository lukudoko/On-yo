import { useEffect, useState } from 'react';
import OnyomiGroupCard from '@/components/onyomigroupcards';

export async function getServerSideProps() {
  return {
    props: {},
  };
}

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

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-10 bg-gray-200 rounded w-96 animate-pulse mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-2xl animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-60 bg-gray-200 aspect-square rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p className="text-red-500">Error loading groups: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Study by Usefulness</h1>
        <p className="text-gray-600 mb-8">
          Follow the most statistically useful kanji groups first. Groups are ordered by their
          frequency of use in modern Japanese.
        </p>

        {onyomiGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No onyomi groups found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {onyomiGroups.map((group) => (
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
        )}
      </div>
    </div>
  );
}