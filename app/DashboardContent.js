"use client"

import { motion } from "framer-motion"
import HeroCard from "@/components/dash/hero"
import TestsCard from "@/components/dash/tests"
import StatsCard from "@/components/dash/stats"

export default function DashboardContent({ data, userEmail, onTrackChanged }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  }

  const motionKey = JSON.stringify(data)

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        key={motionKey}
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        <HeroCard itemVariants={itemVariants} data={data} />
        <TestsCard itemVariants={itemVariants} data={data} />
        <StatsCard itemVariants={itemVariants} data={data} onTrackChanged={onTrackChanged} />
      </motion.div>
    </div>
  )
}