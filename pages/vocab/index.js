import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Progress, Accordion, AccordionItem, Spinner, Input, Button, Popover, PopoverTrigger, PopoverContent, Form } from "@heroui/react";
import { motion } from "framer-motion";
import Confetti from 'react-confetti-boom';

const ACCURACY_MESSAGES = [
  { threshold: 90, message: "Amazing Work!" },
  { threshold: 80, message: "Excellent!" },
  { threshold: 70, message: "Great stuff! 😎" },
  { threshold: 60, message: "Good shot!" },
  { threshold: 50, message: "Not bad! 🤔" },
  { threshold: 0, message: "Keep practicing! 🔥" }
];

const formatMeaning = (meaning) => {
  if (!meaning) return '';
  return meaning
    .split(';')
    .map(part =>
      part.trim()
        .replace(/^\w/, c => c.toUpperCase())
    )
    .join(', ');
};

export default function VocabTest() {
  const router = useRouter();
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showSelection, setShowSelection] = useState(true);
  const [selectedLimit, setSelectedLimit] = useState(null);

  const [error, setError] = useState(null);

  const currentItem = testData?.[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / (testData?.length || 1)) * 100);

  const loadTestData = async (limit) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test/vocab/selection?limit=${limit}`, {
      });
      const data = await response.json();

      if (data.success && data.vocab?.length > 0) {
        setTestData(data.vocab);
        setShowSelection(false);
      } else {
        setTestData([]);
        setError(data.error || 'No vocab items available.');
        setShowSelection(false);
      }
    } catch (error) {
      console.error('Error loading vocab test:', error);
      setError('Failed to load vocab test.');
      setShowSelection(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitSelect = (limit) => {
    setSelectedLimit(limit);
    loadTestData(limit);
  };

  useEffect(() => {
    if (testData && currentQuestion < testData.length) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, testData]);

  const updateStreak = async (kanjiId, isCorrect) => {
    try {
      const response = await fetch('/api/test/vocab/update', {
        method: 'POST',
        body: JSON.stringify({ kanjiId, isCorrect })
      });
      if (!response.ok) {
        console.error('Error updating streak');
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentItem) return;

    const userAnswer = selectedAnswer.trim();
    const correct = currentItem.testType === 'write-in'
      ? userAnswer.toLowerCase() === currentItem.correctAnswer.toLowerCase()

      : userAnswer === currentItem.correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    const result = {
      kanjiId: currentItem.kanjiId,
      wordId: currentItem.wordId,
      isCorrect: correct,
      userAnswer,
      correctAnswer: currentItem.correctAnswer,
      word: currentItem.word,
      meaning: currentItem.meaning
    };
    setSessionResults(prev => [...prev, result]);

    await updateStreak(currentItem.kanjiId, correct);
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

  if (showSelection) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-8"
        >
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Vocab Test Length</h2>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            {[10, 20, 30].map((limit) => (
              <Button
                key={limit}
                onPress={() => handleLimitSelect(limit)}
                size="lg"
                className={`font-semibold ${selectedLimit === limit
                  ? 'bg-[#6A7FDB] text-white'
                  : 'bg-[#6A7FDB20] text-black'
                  }`}
              >
                {limit} words
              </Button>
            ))}
          </div>

          <p className="text-gray-600 text-sm">
            Longer tests provide more comprehensive practice
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Spinner classNames={{ wrapper: "w-30", dots: "bg-black scale-350" }} variant="wave" size='lg' />
      </div>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No vocab items available. Review more kanji first!</div>
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
                      {result.word}
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

  const isAnswerValid = currentItem.testType === 'write-in'
    ? selectedAnswer.trim()
    : selectedAnswer;

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Progress
          aria-label="Progress"
          size="lg"
          label={`Vocab ${currentQuestion + 1} of ${testData.length}`}
          classNames={{
            base: "max-w-xs mx-auto md:max-w-sm",
            indicator: "bg-[#F56A83]",
            label: "font-bold",
          }}
          value={progress}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6"
      >
        <motion.div
          key={currentQuestion}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', mass: 0.7, damping: 20 }}
          className="flex flex-col gap-2  items-center">
          <div className="text-lg">
            {(() => {
              const reading = currentItem.reading;
              const targetReading = currentItem.targetReadingPart;

              if (targetReading && reading.includes(targetReading)) {
                const parts = reading.split(targetReading);
                return (
                  <span>
                    <span className="font-light">{parts[0]}</span>
                    <span className="font-bold">{targetReading}</span>
                    <span className="font-light">{parts[1] || ''}</span>
                  </span>
                );
              }
              return <span className="font-light">{reading}</span>;
            })()}

          </div>

          <div className="flex items-center justify-center font-semibold  text-6xl font-jp-round" >

            {currentItem.testType === 'multiple-choice' ? (
              <>
                {(() => {
                  const blanked = currentItem.blankedWord;
                  const parts = blanked.split('_');

                  return (
                    <div className='flex items-center'>
                      {parts[0] && parts[0].trim() && (
                        <span className='p-2'>{parts[0]}</span>
                      )}
                      <div className="flex items-center justify-center rounded-2xl p-2 bg-[#6A7FDB20] overflow-hidden flex items-center justify-center">
                        {selectedAnswer ? (
                          <motion.span
                            key={selectedAnswer}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'easeinout' }}
                          >
                            {selectedAnswer}
                          </motion.span>
                        ) : (
                          <span className="opacity-0">音</span>
                        )}
                      </div>
                      {parts[1] && parts[1].trim() && (
                        <span className='p-2'>{parts[1]}</span>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <motion.div
                key={currentQuestion}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', mass: 0.7, damping: 20 }}
                className="text-6xl font-semibold font-jp-round"
              >
                {currentItem.word}
              </motion.div>
            )}
          </div>

          <div className="text-base font-semibold">
            {formatMeaning(currentItem.meaning)}
          </div>

        </motion.div>

        {!showResult ? (
          <Form
            onSubmit={handleSubmit}

            className="flex flex-col gap-6 items-center justify-center"
          >
            {currentItem.testType === 'multiple-choice' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-3 justify-items-center gap-3"
              >
                {currentItem.multipleChoiceOptions.map((option, index) => (
                  <Button
                    key={index}
                    onPress={() => setSelectedAnswer(option)}
                    size="lg"
                    className={`w-full font-bold text-lg ${selectedAnswer === option
                      ? 'bg-[#6A7FDB] text-white'
                      : 'bg-[#6A7FDB20] text-black'
                      }`}
                  >
                    {option}
                  </Button>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className='flex items-center justify-center gap-2'
              >
                {(() => {
                  const prompt = currentItem.prompt;

                  // Find the position of the first underscore and the text after it
                  const underscoreIndex = prompt.indexOf('＿');
                  if (underscoreIndex !== -1) {
                    const before = prompt.substring(0, underscoreIndex);
                    const after = prompt.substring(prompt.lastIndexOf('＿') + 1); // Get text after the last underscore

                    return (
                      <div className="flex items-center gap-2">
                        {before && (
                          <span className="text-2xl font-bold">{before}</span>
                        )}
                        <Input
                          type="text"
                          value={selectedAnswer}
                          onValueChange={setSelectedAnswer}
                          autoFocus
                          size="lg"
                          className='w-16 text-center text-2xl'
                        />
                        {after && (
                          <span className="text-2xl font-bold">{after}</span>
                        )}
                      </div>
                    );
                  }

                  // Fallback if no underscore found
                  return (
                    <span className="text-2xl font-bold">{prompt}</span>
                  );
                })()}
              </motion.div>
            )}

            <Button
              type="submit"
              className='bg-[#6A7FDB20] font-semibold w-32'
              isDisabled={!isAnswerValid}
            >
              Check
            </Button>
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
              {!isCorrect && (
                <>
                  Answer: <span className="font-jp-round">{currentItem.correctAnswer}</span>
                </>
              )}
            </div>
            <Button
              onPress={handleNext}
              className='bg-[#6A7FDB20] font-semibold mt-4'
            >
              {currentQuestion < testData.length - 1 ? 'Next' : 'See Results'}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}