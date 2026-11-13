"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import TestCard from "@/components/test/testcard";
import TestQuestion from "@/components/test/testquestion";
import AnswerForm from "@/components/test/answers";
import ResultView from "@/components/test/resultview";
import SummaryScreen from "@/components/test/summary";
import { submitVocabAnswer, getVocabTestData } from "@/app/actions/vocab";
import { formatMeaning, splitOnBlank, splitAroundTarget } from "@/lib/testOptions";

function VocabPrompt({ item, selectedAnswer }) {
  const highlighted = splitAroundTarget(item.reading, item.targetReadingPart);
  const blank =
    item.testType === "multiple-choice" ? item.blankedWord.split("_") : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="flex flex-col gap-3 items-center"
    >
      {item.reading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg"
        >
          {highlighted ? (
            <span>
              <span className="font-light">{highlighted.before}</span>
              <span className="font-bold">{item.targetReadingPart}</span>
              <span className="font-light">{highlighted.after}</span>
            </span>
          ) : (
            <span className="font-light">{item.reading}</span>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center font-semibold text-6xl font-jp-round"
      >
        {item.testType === "multiple-choice" ? (
          <div className="flex items-center">
            {blank[0]?.trim() && <span className="p-2">{blank[0]}</span>}
            <div className="flex overflow-hidden items-center justify-center rounded-2xl p-2 bg-[#6A7FDB20]">
              {selectedAnswer ? (
                <motion.span
                  key={selectedAnswer}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  {selectedAnswer}
                </motion.span>
              ) : (
                <span className="opacity-0">音</span>
              )}
            </div>
            {blank[1]?.trim() && <span className="p-2">{blank[1]}</span>}
          </div>
        ) : (
          <div className="text-6xl font-semibold font-jp-round">{item.word}</div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-base px-6 text-center font-semibold"
      >
        {formatMeaning(item.meaning)}
      </motion.div>
    </motion.div>
  );
}

export default function VocabClient() {
  const router = useRouter();

  const [limit, setLimit] = useState(null);
  const [testData, setTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const currentItem = testData ? testData[currentQuestion] : null;
  const progress = testData
    ? Math.round(((currentQuestion + 1) / testData.length) * 100)
    : 0;

  useEffect(() => {
    if (currentItem?.testType === "write-in" && !showResult) {
      inputRef.current?.focus();
    }
  }, [currentQuestion, showResult, currentItem]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestion]);

  const handleSelectLimit = async (num) => {
    setLimit(num);
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await getVocabTestData(num);
      if (!result.success || !result.vocab.length) {
        setFetchError(result.error || "No vocab items available. Review more kanji first!");
        setTestData(null);
      } else {
        setTestData(result.vocab);
      }
    } catch (err) {
      console.error("Failed to load vocab test data:", err);
      setFetchError("Something went wrong loading the test. Please try again.");
      setTestData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSelection = () => {
    setLimit(null);
    setTestData(null);
    setFetchError(null);
    setCurrentQuestion(0);
    setSessionResults([]);
    setShowSummary(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem || isSubmitting) return;


    const userAnswer = selectedAnswer.trim();
    const correct =
      currentItem.testType === "write-in"
        ? userAnswer.toLowerCase() === currentItem.correctAnswer.toLowerCase()
        : userAnswer === currentItem.correctAnswer;

            const fullWord = currentItem.word ||
      (currentItem.blankedWord
        ? currentItem.blankedWord.replace(/_/g, currentItem.correctAnswer)
        : null) ||
      correctAnswer;

    const displayReading = currentItem.fullreading || currentItem.reading || currentItem.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    setSessionResults((prev) => [
      ...prev,
      {
        kanjiId: currentItem.kanjiId,
        wordId: currentItem.wordId,
        isCorrect: correct,
        userAnswer,
        correctAnswer: currentItem.correctAnswer,
        word: fullWord,
        fullreading: displayReading,
        meaning: currentItem.meaning,
      },
    ]);

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    if (currentItem.kanjiId) {
      setIsSubmitting(true);
      try {
        await submitVocabAnswer(currentItem.kanjiId, correct);
      } catch (err) {
        console.error("Failed to save vocab answer:", err);
      } finally {
        setIsSubmitting(false);
      }
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

  if (!limit) {
    return (
      <DifficultySelector isLoading={isLoading} onSelect={handleSelectLimit} />
    );
  }

  if (isLoading || (!testData && !fetchError)) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center px-4">
        <div className="bg-white rounded-3xl p-8">
          <p className="text-gray-600">Loading test…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center px-4">
        <div className="bg-white rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Oops!</h2>
          <p className="text-gray-600 mb-6">{fetchError}</p>
          <div className="flex flex-col gap-3 items-center">
            <Button
              onPress={() => router.push("/")}
              size="lg"
              className="font-bold w-full max-w-xs text-white bg-[#6A7FDB]"
            >
              Back to Dashboard
            </Button>
            <Button onPress={resetSelection} variant="light" className="text-[#6A7FDB]">
              Try a different amount
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    console.log(sessionResults);
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
            <span className="text-sm font-medium mt-1 opacity-70">
              {result.fullreading || result.correctAnswer}
            </span>
            <span className="text-2xl font-jp-round font-bold">
              {result.word || result.correctAnswer}
            </span>
            <div className="text-xs mt-1 text-gray-600">
              {result.meaning?.split(";")[0] || ""}
            </div>
            {!result.isCorrect && (
              <div className="text-xs mt-1 text-red-600">
                You answered: {result.userAnswer}
              </div>
            )}
          </motion.div>
        )}
        onBack={() => router.push("/")}
      />
    );
  }

  const blank =
    currentItem.testType === "write-in" ? splitOnBlank(currentItem.prompt) : null;

  return (
    <TestCard
      current={currentQuestion + 1}
      total={testData.length}
      progress={progress}
    >
      <TestQuestion questionIndex={currentQuestion}>
        { }
        <VocabPrompt item={currentItem} selectedAnswer={selectedAnswer} />

        {!showResult ? (
          <AnswerForm
            type={currentItem.testType}
            options={currentItem.multipleChoiceOptions}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            onSubmit={handleSubmit}
            isAnswerValid={
              currentItem.testType === "write-in"
                ? !!selectedAnswer.trim()
                : !!selectedAnswer
            }
            isSubmitting={isSubmitting}
            before={blank?.before || ""}
            after={blank?.after || ""}
            inputRef={inputRef}
          />
        ) : (
          <ResultView
            reading={currentItem.fullreading}
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

function DifficultySelector({ isLoading, onSelect }) {
  const [pendingLimit, setPendingLimit] = useState(null);

  const handlePress = (num) => {
    setPendingLimit(num);
    onSelect(num);
  };

  return (
    <div className="py-12 max-w-2xl mx-auto text-center px-4">
      <div className="bg-white rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Choose Vocab Test Difficulty
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          {[10, 20, 30].map((num) => (
            <Button
              key={num}
              onPress={() => handlePress(num)}
              isLoading={isLoading && pendingLimit === num}
              className="font-bold text-white bg-[#6A7FDB]"
            >
              {num} words
            </Button>
          ))}
        </div>
        <p className="text-gray-600 text-sm">
          Longer tests provide more comprehensive practice
        </p>
      </div>
    </div>
  );
}