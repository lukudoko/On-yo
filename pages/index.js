import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import HeroCard from "@/components/dash/hero"
import TestsCard from "@/components/dash/tests"
import StatsCard from "@/components/dash/stats"
import { Button } from "@heroui/react";
import { useStats } from "@/contexts/stats";

export default function Home() {
  const { data: session, status } = useSession();
  const { stats: dashboardData, error, fetchStats } = useStats();

  useEffect(() => {
    if (status === 'authenticated' && !dashboardData) {
      fetchStats();
    }
  }, [status, fetchStats]);

  if (
    status === "loading" ||
    (status === "authenticated" && !dashboardData && !error)
  ) {
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
      <div className="pt-8 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p className="text-red-600 mb-4">
            {error || "Unable to load dashboard data."}
          </p>
          <Button color="primary" onPress={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="py-6 max-w-5xl mx-auto">

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >

        <HeroCard itemVariants={itemVariants} />
        <TestsCard itemVariants={itemVariants} />
        <StatsCard itemVariants={itemVariants} />
      </motion.div>
    </div>
  );
}
