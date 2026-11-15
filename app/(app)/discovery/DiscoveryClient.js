"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import Confetti from "react-confetti-boom";
import { submitDiscoveryAnswer } from "@/app/actions/discovery";

import TestCard from "@/components/test/testcard";
import TestQuestion from "@/components/test/testquestion";
import AnswerForm from "@/components/test/answers";
import ResultView from "@/components/test/resultview";

export default function DiscoveryClient({ testData }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const currentKanji = testData[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / testData.length) * 100);

  useEffect(() => {
    if (!showCompletion && isCorrect !== true) {
      inputRef.current?.focus();
    }
  }, [currentQuestion, showCompletion, isCorrect]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isCorrect === true) return;

    const userAnswer = selectedAnswer.trim();
    const correct =
      userAnswer.toLowerCase() === currentKanji.correctAnswer.toLowerCase();

    setIsCorrect(correct);

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDiscoveryAnswer(currentKanji.kanjiId, correct);
    } catch (err) {
      console.error("Failed to save discovery answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer("");
      setIsCorrect(null);
      setShake(false);
    } else {
      setShowCompletion(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (showCompletion) {
    return (
      <div className="py-6 max-w-2xl mx-auto">
        <Confetti particleCount={60} />
        <motion.div
          className="bg-white flex flex-col w-full max-w-lg  rounded-3xl mx-auto p-6 gap-6 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div>
            <div className="text-2xl font-bold mb-2">Great job!</div>
            <div className="text-gray-600">
              You learned {testData.length} new kanji.
            </div>
          </div>
          <Button
            className="bg-[#6A7FDB20] text-white font-semibold"
            onPress={() => router.push("/")}
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <TestCard
      current={currentQuestion + 1}
      total={testData.length}
      progress={progress}
    >
      <TestQuestion questionIndex={currentQuestion}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-9xl font-bold font-jp-round"
          >
            {currentKanji.kanji.character}
          </motion.div>

          {currentKanji.hints?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2"
            >
              <div className="text-xs font-semibold text-gray-600 mb-1 text-center">
                Same reading as:
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {currentKanji.hints.slice(0, 5).map((hint, index) => (
                  <span
                    key={index}
                    className="font-jp-round bg-[#6A7FDB10] rounded-lg px-2 py-1 text-lg"
                  >
                    {hint}
                  </span>
                ))}
                {currentKanji.hints.length > 5 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{currentKanji.hints.length - 5} more
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {isCorrect === true ? (
          <ResultView
            reading={currentKanji.correctAnswer}
            isCorrect={true}
            shake={false}
            userAnswer={selectedAnswer}
            isLastQuestion={currentQuestion === testData.length - 1}
            onNext={handleNext}
          />
        ) : (
          <AnswerForm
            type="write-in"
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            onSubmit={handleSubmit}
            isAnswerValid={!!selectedAnswer.trim()}
            isSubmitting={isSubmitting}
            inputRef={inputRef}
            inputProps={{
              className: "max-w-[15rem]",
            }}
            errorMessage={
              isCorrect === false && selectedAnswer ? "Not quite!" : undefined
            }
            shake={shake}
          />
        )}
      </TestQuestion>
    </TestCard>
  );
}