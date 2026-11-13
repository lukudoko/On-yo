"use client";
import { motion } from "framer-motion";
import Confetti from "react-confetti-boom";
import {
  Button,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { getAccuracyMessage } from "@/lib/testOptions";   // we'll create this

export default function SummaryScreen({
  correctCount,
  total,
  results,
  renderResultCard,
  onBack,
}) {
  const accuracy = Math.round((correctCount / total) * 100);
  const message = getAccuracyMessage(accuracy);

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <Confetti particleCount={80} />
      <motion.div
        className="bg-white w-full max-w-lg mx-auto rounded-3xl p-6 flex flex-col gap-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div>
          <h2 className="text-2xl font-bold mb-2">{message}</h2>
          <div className="text-6xl font-black mb-2">{accuracy}%</div>
          <div className="text-gray-600">
            {correctCount}/{total} correct
          </div>
        </div>
        <Button className="bg-[#6A7FDB] text-white font-semibold" onPress={onBack}>
          Back to Dashboard
        </Button>
        <Accordion className="shadow-sm rounded-2xl" variant="shadow">
          <AccordionItem key="1" aria-label="View Results" title="View Results">
            <div className="grid grid-cols-2 gap-3 overflow-scroll max-h-60">
              {results.map((result, index) =>
                renderResultCard(result, index)
              )}
            </div>
          </AccordionItem>
        </Accordion>
      </motion.div>
    </div>
  );
}