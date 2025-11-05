import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (loading) return; 

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/stats", {
        headers: {
          'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
        }
      });
      const json = await response.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setError(json.message || "Failed to load stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const refreshStats = useCallback(() => {
    setStats(null);
    fetchStats();
  }, [fetchStats]);

  return (
    <StatsContext.Provider value={{ 
      stats, 
      loading, 
      error, 
      fetchStats, 
      refreshStats 
    }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}