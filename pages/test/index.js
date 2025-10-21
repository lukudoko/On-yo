import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Progress, Accordion, AccordionItem, Input, Button, Popover, PopoverTrigger, PopoverContent, Form } from "@heroui/react";
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

    // Shuffle a copy of the readings array and take the first 3
    const shuffled = [...readings].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map((reading, index) => (
      <span key={index} className="inline-block mr-2 mb-1 last:mr-0">
        {reading}
        {index < selected.length - 1 && ', '}
      </span>
    ));
  };

  // Load test data on component mount
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test/testselect', {
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

  // Format meanings when question changes
  useEffect(() => {
    if (testData && testData[currentQuestion]) {
      setFormattedMeanings(formatReadings(testData[currentQuestion].kanji.meanings));
    }
  }, [currentQuestion, testData]);

  // Handle answer submission with real-time update
  const handleSubmit = async () => {
    if (!testData || currentQuestion >= testData.length) return;

    const currentKanji = testData[currentQuestion];
    const userAnswer = currentKanji.testType === 'write-in' ? selectedAnswer : selectedAnswer;
    const correct = currentKanji.testType === 'write-in'
      ? userAnswer.trim().toLowerCase() === currentKanji.correctAnswer.toLowerCase()
      : userAnswer === currentKanji.correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    // Add to session results
    const result = {
      kanjiId: currentKanji.kanjiId,
      isCorrect: correct,
      userAnswer: userAnswer,
      correctAnswer: currentKanji.correctAnswer
    };
    setSessionResults(prev => [...prev, result]);

    // Update the streak in real-time (for now, just log it)
    try {
      const response = await fetch('/api/test/updateStreak', {
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

  // Move to next question
  const handleNext = () => {
    if (currentQuestion < testData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      // Show summary instead of redirecting immediately
      setShowSummary(true);
    }
  };

  // Finish test and redirect
  const finishTest = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading test...</div>
      </div>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No testable kanji available</div>
      </div>
    );
  }

  if (showSummary) {
    const completionMessages = [
      "Nice! 😎",
      "Great stuff!",
      "Excellent work!",
      "Well done!",
      "Fantastic effort!"
    ];
    const randomMessage = completionMessages[Math.floor(Math.random() * completionMessages.length)];

    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionResults.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Confetti particleCount={80} />
        <div className="bg-white flex flex-col w-full max-w-md shadow-sm rounded-3xl mx-auto p-6 gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{randomMessage}</h2>
            <div className="text-6xl font-black mb-4">{accuracy}%</div>
            <div className="text-gray-600">
              {correctCount}/{sessionResults.length} correct
            </div>
          </div>



          <Button onPress={finishTest} >
            Back to Dash
          </Button>

          <Accordion className="shadow-sm rounded-2xl" variant="shadow">
            <AccordionItem key="1" aria-label="View Results" title="View Results">
              <div className="grid grid-cols-2 gap-3 overflow-scroll h-60">
                {sessionResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-xl ${result.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-jp-round font-bold">{testData.find(k => k.kanjiId === result.kanjiId)?.kanji.character}</span>
                      <span>{result.isCorrect ? '✓' : '✗'}</span>
                    </div>
                    <div className="text-sm">
                      {result.isCorrect ? '' : `Answer: ${result.correctAnswer}`}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionItem>
          </Accordion>

        </div>
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
            track: "",
            label: "font-bold",
          }}
          value={progress} />
      </div>

      <div className="bg-white flex flex-col w-full max-w-md  shadow-sm rounded-3xl mx-auto p-6 gap-6">
        <div className="text-center">
          <div className="text-9xl font-bold font-jp-round mb-4">{currentKanji.kanji.character}</div>
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
              <div className="grid grid-cols-3 justify-items-center gap-3">
                {currentKanji.multipleChoiceOptions.map((option, index) => (
                  <Button
                    key={index}
                    onPress={() => setSelectedAnswer(option)}
                    size="lg"
                    className={`w-full font-bold text-lg ${selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                type="text"
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                label="Enter the reading"
                autoFocus
                size="lg"
              />
            )}

            {/* Shared Submit Button */}
            <div className="flex justify-center gap-4">
              <Button
                type="submit"
                isDisabled={
                  currentKanji.testType === 'write-in'
                    ? !selectedAnswer.trim()
                    : !selectedAnswer // for multiple-choice, must have selection
                }
              >
                Check
              </Button>

              {currentKanji.masteryLevel === 1 &&
                currentKanji.hints &&
                currentKanji.hints.length > 0 && (
                  <Popover size="lg" placement="top">
                    <PopoverTrigger>
                      <Button>Hint</Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-indigo-50 flex flex-col mt-2 p-6">
                      <div className="text-sm font-bold mb-3">Same reading as:</div>
                      <div className="flex justify-center space-x-4">
                        {currentKanji.hints.map((hint, index) => (
                          <span
                            key={index}
                            className="font-jp-round bg-white rounded-lg p-2 text-2xl"
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
          // Result view
          <div className={`rounded-3xl flex flex-col gap-4 items-center p-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <div className="text-lg mt-2">
                Answer: <span className="font-jp-round">{currentKanji.correctAnswer}</span>
              </div>
            </div>

            <Button onPress={handleNext} className="rounded-lg hover:bg-blue-700">
              {currentQuestion < testData.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}