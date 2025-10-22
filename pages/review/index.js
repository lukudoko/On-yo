import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Progress, Accordion, AccordionItem, Spinner, Input, Button, Popover, PopoverTrigger, PopoverContent, Form } from "@heroui/react";
import { motion } from "framer-motion";
import Confetti from 'react-confetti-boom'

export default function KanjiTest() {
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formattedMeanings, setFormattedMeanings] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const router = useRouter();

  const formatReadings = (readings) => {
    if (!readings || readings.length === 0) return "None";

    const shuffled = [...readings].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map((reading, index) => (
      <span key={index} className="inline-block mr-2 mb-1 last:mr-0">
        {reading}
        {index < selected.length - 1 && ', '}
      </span>
    ));
  };

  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test/review/testselect', {
          headers: {
            'x-api-token': process.env.NEXT_PUBLIC_API_TOKEN
          }
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
    if (testData && testData[currentQuestion]) {
      setFormattedMeanings(formatReadings(testData[currentQuestion].kanji.meanings));
    }
  }, [currentQuestion, testData]);

  const handleSubmit = async () => {
    if (!testData || currentQuestion >= testData.length) return;

    const currentKanji = testData[currentQuestion];
    const userAnswer = currentKanji.testType === 'write-in' ? selectedAnswer : selectedAnswer;
    const correct = currentKanji.testType === 'write-in'
      ? userAnswer.trim().toLowerCase() === currentKanji.correctAnswer.toLowerCase()
      : userAnswer === currentKanji.correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    const result = {
      kanjiId: currentKanji.kanjiId,
      isCorrect: correct,
      userAnswer: userAnswer,
      correctAnswer: currentKanji.correctAnswer
    };
    setSessionResults(prev => [...prev, result]);

    try {
      const response = await fetch('/api/test/review/updateStreak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': process.env.NEXT_PUBLIC_API_TOKEN
        },
        body: JSON.stringify({
          kanjiId: currentKanji.kanjiId,
          isCorrect: correct
        })
      });

      if (!response.ok) {
        console.error('Error updating streak');
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setShowSummary(true);
    }
  };

  const finishTest = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Spinner classNames={{ wrapper: "w-30", dots: "bg-black scale-350" }} variant="wave" size='lg' />
      </div>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">You&apos;ve tested all your kanji (For now!)</div>
      </div>
    );
  }

  if (showSummary) {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionResults.length) * 100);

    let message;
    if (accuracy >= 90) {
      message = "Amazing Work!";
    } else if (accuracy >= 80) {
      message = "Excellent!";
    } else if (accuracy >= 70) {
      message = "Great stuff! 😎";
    } else if (accuracy >= 60) {
      message = "Good shot!";
    } else if (accuracy >= 50) {
      message = "Not bad! 🤔";
    } else {
      message = "Keep practicing! 🔥";
    }

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Confetti particleCount={80} />
        <motion.div
          className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{message}</h2>
            <div className="text-6xl font-black mb-4">{accuracy}%</div>
            <div className="text-gray-600">
              {correctCount}/{sessionResults.length} correct
            </div>
          </div>

          <Button className='bg-[#3B479020] font-semibold' onPress={finishTest} >
            Back to Dash
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
                    className={`p-4 flex flex-col justify-center items-center rounded-2xl ${result.isCorrect ? 'bg-[#1F8A6C20]' : 'bg-[#E72C3A20]'}`}
                  >
                    <span className="text-2xl font-jp-round font-bold">{testData.find(k => k.kanjiId === result.kanjiId)?.kanji.character}</span>
                    {!result.isCorrect && (
                      <div className="text-xs">
                        Answer: {result.correctAnswer}
                      </div>
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

  const currentKanji = testData[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / testData.length) * 100);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Progress aria-label="Progress" size="lg"
          label={`Question ${currentQuestion + 1} of ${testData.length}`}
          classNames={{
            base: "max-w-xs mx-auto md:max-w-sm ",
            indicator: "bg-[#F56A83]",
            label: "font-bold",
          }}
          value={progress} />
      </div>

      <div className="bg-white flex flex-col w-full max-w-md  shadow-sm rounded-3xl mx-auto p-6 gap-6">


        <div className="text-center">
          <motion.div
            key={currentQuestion}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', mass: 0.7, damping: 20 }} className="text-9xl font-bold font-jp-round mb-4">{currentKanji.kanji.character}

          </motion.div>


          <div className="text-gray-600 text-sm">
            {formattedMeanings}</div>
        </div>

        {!showResult ? (
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col  gap-6 items-center justify-center"
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
                    className={`w-full font-bold text-lg ${selectedAnswer === option
                      ? 'bg-[#3B4790] text-white '
                      : 'bg-[#3B479020] text-black'
                      }`}
                  >
                    {option}
                  </Button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
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
                className='bg-[#3B479020] font-semibold w-32'
                isDisabled={
                  currentKanji.testType === 'write-in'
                    ? !selectedAnswer.trim()
                    : !selectedAnswer
                }
              >
                Check
              </Button>

              {currentKanji.masteryLevel === 1 &&
                currentKanji.hints &&
                currentKanji.hints.length > 0 && (
                  <Popover size="lg" placement="top">
                    <PopoverTrigger>
                      <Button className='bg-[#3B479020] font-semibold'>Hint</Button>
                    </PopoverTrigger>
                    <PopoverContent className=" flex flex-col mt-2 p-6">
                      <div className="text-sm font-bold mb-3">Same reading as:</div>
                      <div className="flex justify-center space-x-4">
                        {currentKanji.hints.map((hint, index) => (
                          <span
                            key={index}
                            className="font-jp-round bg-[#3B479010] rounded-lg p-2 text-2xl"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className={`rounded-3xl flex flex-col gap-4 items-center p-6 ${isCorrect ? 'bg-[#1F8A6C20]' : 'bg-[#E72C3A20]'}`}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <div className="text-lg mt-2">
                Answer: <span className="font-jp-round">{currentKanji.correctAnswer}</span>
              </div>
            </div>

            <Button onPress={handleNext} className='bg-[#3B479020] font-semibold w-32'>
              {currentQuestion < testData.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}