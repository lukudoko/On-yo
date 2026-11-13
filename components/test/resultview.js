"use client";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";

export default function ResultView({
  reading,           // the full correct reading to display at the top
  isCorrect,
  shake,
  userAnswer,
  isLastQuestion,
  onNext,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shake ? { x: [0, -8, 8, -4, 4, 0] } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div className="text-3xl font-bold font-jp-round mb-1">{reading}</div>
      <div className={`text-2xl font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
        {isCorrect ? "Correct!" : "Incorrect"}
        {!isCorrect && (
          <p className="text-sm font-normal text-gray-500 mt-1">
            You answered: {userAnswer}
          </p>
        )}
      </div>
      <Button onPress={onNext} className="bg-[#6A7FDB] text-white font-semibold mt-5 h-11 w-40">
        {isLastQuestion ? "See Results" : "Next"}
      </Button>
    </motion.div>
  );
}