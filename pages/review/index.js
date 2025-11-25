import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Progress, Accordion, AccordionItem, Spinner, Input, Button, Popover, PopoverTrigger, PopoverContent, Form } from "@heroui/react";
import { motion } from "framer-motion";
import Confetti from 'react-confetti-boom';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-token': process.env.NEXT_PUBLIC_API_TOKEN
};

const ACCURACY_MESSAGES = [
  { threshold: 90, message: "Amazing Work!" },
  { threshold: 80, message: "Excellent!" },
  { threshold: 70, message: "Great stuff! 😎" },
  { threshold: 60, message: "Good shot!" },
  { threshold: 50, message: "Not bad! 🤔" },
  { threshold: 0, message: "Keep practicing! 🔥" }
];

export default function KanjiTest() {
  const router = useRouter();
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [formattedMeanings, setFormattedMeanings] = useState(null);

  const currentKanji = testData?.[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / (testData?.length || 1)) * 100);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test/review/selection', {
          headers: API_HEADERS
        });
        const data = await response.json();
        setTestData(data.kanji);
      } catch (error) {
        console.error('Error loading test:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTestData();
  }, []);

  useEffect(() => {
    if (testData && currentQuestion < testData.length) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, testData]);

  useEffect(() => {
    if (currentKanji?.kanji?.meanings) {
      const shuffled = [...currentKanji.kanji.meanings].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      setFormattedMeanings(formatReadings(selected));
    }
  }, [currentQuestion, testData]);

  const formatReadings = (readings) => {
    if (!readings?.length) return "None";
    return readings.map((reading, index) => (
      <span key={index} className="inline-block mr-2 mb-1 last:mr-0">
        {reading}
        {index < readings.length - 1 && ', '}
      </span>
    ));
  };

  const updateStreak = async (kanjiId, isCorrect) => {
    try {
      const response = await fetch('/api/test/review/updateStreak', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ kanjiId, isCorrect })
      });
      if (!response.ok) {
        console.error('Error updating streak');
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentKanji) return;

    const userAnswer = selectedAnswer.trim();
    const correct = currentKanji.testType === 'write-in'
      ? userAnswer.toLowerCase() === currentKanji.correctAnswer.toLowerCase()
      : userAnswer === currentKanji.correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    const result = {
      kanjiId: currentKanji.kanjiId,
      isCorrect: correct,
      userAnswer,
      correctAnswer: currentKanji.correctAnswer
    };
    setSessionResults(prev => [...prev, result]);

    await updateStreak(currentKanji.kanjiId, correct);
  };

  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAccuracyMessage = (accuracy) => {
    return ACCURACY_MESSAGES.find(item => accuracy >= item.threshold)?.message || ACCURACY_MESSAGES[ACCURACY_MESSAGES.length - 1].message;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Spinner classNames={{ wrapper: "w-30", dots: "bg-black scale-350" }} variant="wave" size='lg' />
      </div>
    );
  }

  if (!testData?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">You&apos;ve tested all your kanji (For now!)</div>
      </div>
    );
  }

  if (showSummary) {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionResults.length) * 100);

    return (
      <div className="py-6 max-w-2xl mx-auto">
        <Confetti particleCount={80} />
        <motion.div 
          className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div>
            <h2 className="text-2xl font-bold mb-2">{getAccuracyMessage(accuracy)}</h2>
            <div className="text-6xl font-black mb-2">{accuracy}%</div>
            <div className="text-gray-600">
              {correctCount}/{sessionResults.length} correct
            </div>
          </div>

          <Button 
            className='bg-[#6A7FDB20] font-semibold' 
            onPress={() => router.push('/')}
          >
            Back to Dashboard
          </Button>

          <Accordion className="shadow-sm rounded-2xl" variant="shadow">
            <AccordionItem key="1" aria-label="View Results" title="View Results">
              <div className="grid grid-cols-2 gap-3 overflow-scroll h-60">
                {sessionResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className={`p-4 flex flex-col justify-center items-center rounded-2xl ${result.isCorrect ? 'bg-[#26A68220]' : 'bg-[#EB475220]'}`}
                  >
                    <span className="text-2xl font-jp-round font-bold">
                      {testData.find(k => k.kanjiId === result.kanjiId)?.kanji.character}
                    </span>
                    {!result.isCorrect && (
                      <div className="text-xs">Answer: {result.correctAnswer}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    );
  }

  const isAnswerValid = currentKanji.testType === 'write-in'
    ? selectedAnswer.trim()
    : selectedAnswer;

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Progress 
          aria-label="Progress" 
          size="lg"
          label={`Question ${currentQuestion + 1} of ${testData.length}`}
          classNames={{
            base: "max-w-xs mx-auto md:max-w-sm",
            indicator: "bg-[#F56A83]",
            label: "font-bold",
          }}
          value={progress} 
        />
      </div>

      <div className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6">
        <div className="text-center">
          <motion.div
            key={currentQuestion}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', mass: 0.7, damping: 20 }} 
            className="text-9xl font-bold font-jp-round mb-4"
          >
            {currentKanji.kanji.character}
          </motion.div>

          <div className="text-gray-600 text-sm">
            {formattedMeanings}
          </div>
        </div>

        {!showResult ? (
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col gap-6 items-center justify-center"
          >
            {currentKanji.testType === 'multiple-choice' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-3 justify-items-center gap-3"
              >
                {currentKanji.multipleChoiceOptions.map((option, index) => (
                  <Button
                    key={index}
                    onPress={() => setSelectedAnswer(option)}
                    size="lg"
                    className={`w-full font-bold text-lg ${
                      selectedAnswer === option
                        ? 'bg-[#6A7FDB] text-white'
                        : 'bg-[#6A7FDB20] text-black'
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Input
                  type="text"
                  value={selectedAnswer}
                  onValueChange={setSelectedAnswer}
                  label="Enter the reading"
                  autoFocus
                  size="lg"
                />
              </motion.div>
            )}

            <div className="flex justify-center gap-4">
              <Button
                type="submit"
                className='bg-[#6A7FDB20] font-semibold w-32'
                isDisabled={!isAnswerValid}
              >
                Check
              </Button>

              {currentKanji.masteryLevel === 1 && currentKanji.hints?.length > 0 && (
                <Popover size="lg" placement="top">
                  <PopoverTrigger>
                    <Button className='bg-[#6A7FDB20] font-semibold'>Hint</Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex flex-col mt-2 p-6">
                    <div className="text-sm font-bold mb-3">Same reading as:</div>
                    <div className="flex justify-center space-x-4">
                      {currentKanji.hints.map((hint, index) => (
                        <span
                          key={index}
                          className="font-jp-round bg-[#6A7FDB10] rounded-lg p-2 text-2xl"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </Form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            <div className="text-lg mt-2">
              Answer: <span className="font-jp-round">{currentKanji.correctAnswer}</span>
            </div>
            <Button 
              onPress={handleNext} 
              className='bg-[#6A7FDB20] font-semibold mt-4'
            >
              {currentQuestion < testData.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}