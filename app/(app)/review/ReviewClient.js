"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import TestCard from "@/components/test/testcard";
import TestQuestion from "@/components/test/testquestion";
import AnswerForm from "@/components/test/answers";
import ResultView from "@/components/test/resultview";
import SummaryScreen from "@/components/test/summary";
import { submitReviewAnswer } from "@/app/actions/review";
import { pickRandom } from "@/lib/testOptions";
import { motion } from "framer-motion"


export default function ReviewClient({ testData: initialTestData }) {
  const router = useRouter();
  const [testData] = useState(initialTestData);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const currentKanji = testData[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / testData.length) * 100);

  useEffect(() => {
    if (currentKanji?.testType === "write-in" && !showResult) {
      inputRef.current?.focus();
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 100);
    }
  }, [currentQuestion, showResult, currentKanji]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestion]);

  const shuffledMeanings = useMemo(() => {
    const meanings = currentKanji?.kanji?.meanings;
    if (!meanings?.length) return null;
    return pickRandom(meanings, 3).join(", ");
  }, [currentQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentKanji || isSubmitting) return;
    const userAnswer = selectedAnswer.trim();
    const correct =
      currentKanji.testType === "write-in"
        ? userAnswer.toLowerCase() === currentKanji.correctAnswer.toLowerCase()
        : userAnswer === currentKanji.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    setSessionResults((prev) => [
      ...prev,
      {
        kanjiId: currentKanji.kanjiId,
        isCorrect: correct,
        userAnswer,
        correctAnswer: currentKanji.correctAnswer,
        character: currentKanji.kanji.character,
      },
    ]);
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setIsSubmitting(true);
    try {
      await submitReviewAnswer(currentKanji.kanjiId, correct);
    } catch (err) {
      console.error("Failed to save review answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setShake(false);
    } else {
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (showSummary) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    return (
      <SummaryScreen
        correctCount={correctCount}
        total={sessionResults.length}
        results={sessionResults}
        renderResultCard={(result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
            className={`p-4 flex flex-col items-center justify-center rounded-2xl ${result.isCorrect ? "bg-[#26A68220]" : "bg-[#EB475220]"
              }`}
          >
            <span className="text-sm font-medium mt-1 opacity-70">{result.correctAnswer}</span>
            <span className="text-2xl font-jp-round font-bold">{result.character}</span>
            {!result.isCorrect && (
              <span className="text-xs text-red-600 mt-0.5">You answered: {result.userAnswer}</span>
            )}
          </motion.div>
        )}
        onBack={() => router.push("/")}
      />
    );
  }

  return (
    <TestCard current={currentQuestion + 1} total={testData.length} progress={progress}>
      <TestQuestion questionIndex={currentQuestion}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="text-8xl md:text-9xl font-bold font-jp-round"
        >
          {currentKanji.kanji.character}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="px-6 text-center font-semibold min-h-[2rem]"
        >
          {shuffledMeanings ?? "—"}
        </motion.div>

        {!showResult ? (
          <AnswerForm
            type={currentKanji.testType}
            options={currentKanji.multipleChoiceOptions}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            onSubmit={handleSubmit}
            isAnswerValid={
              currentKanji.testType === "write-in" ? !!selectedAnswer.trim() : !!selectedAnswer
            }
            isSubmitting={isSubmitting}
            hints={currentKanji.hints}
            showHints={currentKanji.masteryLevel === 1 && currentKanji.hints?.length > 0}
            inputRef={inputRef}
            inputProps={{
              className: "max-w-[15rem]",            // wider
            }}
          />
        ) : (
          <ResultView
            reading={currentKanji.correctAnswer}
            isCorrect={isCorrect}
            shake={shake}
            userAnswer={selectedAnswer.trim()}
            isLastQuestion={currentQuestion === testData.length - 1}
            onNext={handleNext}
          />
        )}
      </TestQuestion>
    </TestCard>
  );
}