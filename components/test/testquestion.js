"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function TestQuestion({ questionIndex, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-6 w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}