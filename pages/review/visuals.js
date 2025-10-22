import { useState, useEffect } from 'react';

export default function TestVisual() {
  const [testKanji, setTestKanji] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTestKanji = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/review/testselect', {
        headers: {
          'x-api-token': process.env.NEXT_PUBLIC_API_TOKEN
        }
      });
      const data = await response.json();
      setTestKanji(data.kanji);
    } catch (error) {
      console.error('Error fetching test kanji:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestKanji();
  }, []);

  // Calculate stats
  const learningKanji = testKanji.filter(k => k.masteryLevel === 1);
  const knownKanji = testKanji.filter(k => k.masteryLevel === 2);
  const mcKanji = testKanji.filter(k => k.testType === 'multiple-choice');
  const writeInKanji = testKanji.filter(k => k.testType === 'write-in');
  
  const knownPercentage = testKanji.length > 0 
    ? Math.round((knownKanji.length / testKanji.length) * 100) 
    : 0;

  return (
    <div className="p-4">
      <h1>Test Visualizer</h1>
      <p>Shows 15 selected kanji with hints and mixed test types</p>
      
      <div className="mt-4 mb-4">
        <button 
          onClick={fetchTestKanji} 
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Loading...' : 'Get New Test Set'}
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-100 rounded">
        <strong>Selection Summary:</strong><br/>
        Total: {testKanji.length}/15 kanji<br/>
        Learning (Level 1): {learningKanji.length}<br/>
        Known (Level 2): {knownKanji.length} ({knownPercentage}%)<br/>
        Multiple Choice: {mcKanji.length}<br/>
        Write-in: {writeInKanji.length}<br/>
        <span className="font-bold text-green-600">
          Min 5 MC, Min 3 Write-in enforced
        </span>
      </div>

      <div className="space-y-6">
        {testKanji.map((progress, index) => (
          <div key={progress.id} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl">{progress.kanji.character}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                progress.masteryLevel === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                Level {progress.masteryLevel} ({progress.testType})
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              Meanings: {progress.kanji.meanings.join(', ')}
            </div>

            {/* Show hints for learning kanji */}
            {progress.masteryLevel === 1 && progress.hints && progress.hints.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Hints (known kanji from same group):</div>
                <div className="flex space-x-2">
                  {progress.hints.map((hint, hintIndex) => (
                    <span 
                      key={hintIndex} 
                      className="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-lg"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {progress.testType === 'multiple-choice' && (
              <>
                <div className="mb-2">
                  <strong>Multiple Choice Options:</strong>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {progress.multipleChoiceOptions.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className={`p-2 border rounded text-center ${
                        option === progress.correctAnswer 
                          ? 'border-green-500 bg-green-50 font-bold' 
                          : 'border-gray-300'
                      }`}
                    >
                      {option}
                      {option === progress.correctAnswer && ' ✓'}
                    </div>
                  ))}
                </div>
              </>
            )}

            {progress.testType === 'write-in' && (
              <div className="mb-2">
                <strong>Write-in Answer:</strong> (User types the reading)
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              Correct answer: {progress.correctAnswer} (streak: {progress.testStreak})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}