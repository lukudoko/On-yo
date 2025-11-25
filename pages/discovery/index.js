import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Progress, Spinner, Input, Button } from "@heroui/react";
import { motion } from "framer-motion";
import Confetti from 'react-confetti-boom';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-token': process.env.NEXT_PUBLIC_API_TOKEN
};

export default function DiscoveryTest() {
  const router = useRouter();
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState(null);

  const currentKanji = testData?.[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / (testData?.length || 1)) * 100);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test/discovery/selection', {
          headers: API_HEADERS
        });
        const data = await response.json();

        if (data.success && data.kanji?.length > 0) {
          setTestData(data.kanji);
        } else {
          setTestData([]);
          setError(data.error || 'No discovery items available right now.');
        }
      } catch (error) {
        console.error('Error loading discovery test:', error);
        setError('Failed to load. Please try again later.');
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

  const updateDiscoveryProgress = async (kanjiId, isCorrect) => {
    try {
      await fetch('/api/test/discovery/updateProgress', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ kanjiId, isCorrect })
      });
    } catch (error) {
      console.error('Error updating discovery progress:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userAnswer = selectedAnswer.trim();
    const correct = userAnswer.toLowerCase() === currentKanji.correctAnswer.toLowerCase();

    setIsCorrect(correct);

    if (correct) {

      updateDiscoveryProgress(currentKanji.kanjiId, true);
    }
  };
  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setIsCorrect(null);
    } else {
      setShowCompletion(true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Spinner classNames={{ wrapper: "w-30", dots: "bg-black scale-350" }} variant="wave" size='lg' />
      </div>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-8"
        >
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No New Kanji to Discover</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {error || "Keep practicing in your review tests to unlock new kanji groups!"}
          </p>
          <Button
            className='bg-[#6A7FDB20] font-semibold'
            onPress={() => router.push('/')}
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="py-6 max-w-2xl mx-auto">
        <Confetti particleCount={60} />
        <motion.div
          className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6 text-center"
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
            className='bg-[#6A7FDB20] font-semibold'
            onPress={() => router.push('/')}
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Progress
          aria-label="Progress"
          size="lg"
          label={`Kanji ${currentQuestion + 1} of ${testData.length}`}
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

          {currentKanji.hints?.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">Same reading as:</div>
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
                  <span className="text-xs text-gray-500 self-center">+{currentKanji.hints.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
          <motion.div
            animate={isCorrect === false ? { x: [0, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Input
              type="text"
              value={selectedAnswer}
              onValueChange={(val) => {
                setSelectedAnswer(val);
                if (isCorrect === false) setIsCorrect(null);
              }}
              label="Enter the reading"
              autoFocus
              size="lg"
              color={isCorrect === false ? "danger" : "default"}
            />
          </motion.div>

          {isCorrect === false && selectedAnswer && (
            <div className="text-center text-red-600 text-lg font-bold mt-1">
              Not quite!
            </div>
          )}

          {isCorrect === true && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-green-600 font-bold text-xl mb-3">Correct!</div>
              <Button
                onPress={handleNext}
                className='bg-[#6A7FDB20] font-semibold'
              >
                {currentQuestion < testData.length - 1 ? 'Next Kanji' : 'Finish Practice'}
              </Button>
            </motion.div>
          )}

          {isCorrect === null && (
            <Button
              type="submit"
              className='bg-[#6A7FDB20] font-semibold w-32'
              isDisabled={!selectedAnswer.trim()}
            >
              Check
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}