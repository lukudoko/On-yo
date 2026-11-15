'use client';

import Header from '@/components/header';
import { motion } from 'framer-motion';
import { StatsProvider } from '@/utils/stats.provider';

export default function AppShell({ children, initialStats }) {
  return (
    <StatsProvider initialStats={initialStats}>
      <div className="min-h-[100dvh] bg-[#f9f4ed]">
        <Header />
        <motion.main
          className="font-noto pt-20 px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </StatsProvider>
  );
}