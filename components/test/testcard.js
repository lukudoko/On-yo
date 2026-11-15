"use client";
import { motion } from "framer-motion";
import { Progress } from "@heroui/react";

export default function TestCard({ current, total, progress, children }) {
  return (
    <div className="my-6 max-w-2xl mx-auto px-4"> 
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white w-full max-w-lg mx-auto rounded-3xl p-6 flex flex-col gap-6"
      >
        <Progress
          aria-label="Progress"
          size="sm"
          label={`${current} / ${total}`}
          classNames={{
            base: "max-w-full",
            indicator: "bg-[#6A7FDB]",
            label: "font-bold text-sm",
          }}
          value={progress}
        />
        {children}
      </motion.div>
    </div>
  );
}