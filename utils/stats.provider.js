'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const StatsContext = createContext(null);

export function StatsProvider({ initialStats, children }) {
  const [stats, setStats] = useState(initialStats);
  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  const updateStats = useCallback((patch) => {
    setStats((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <StatsContext.Provider value={{ stats, updateStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used inside <StatsProvider>');
  return ctx;
}