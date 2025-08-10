import { useState, useEffect } from 'react';
import Onboarding from '@/components/splash';

export default function Home() {
  const [progressionMode, setProgressionMode] = useState(null);

  // Check local storage for saved progression mode
  useEffect(() => {
    const savedMode = localStorage.getItem('progressionMode');
    if (savedMode) {
      setProgressionMode(savedMode);
    }
  }, []);

  // Save progression mode to local storage
  const handleSelectProgression = (mode) => {
    localStorage.setItem('progressionMode', mode);
    setProgressionMode(mode);
  };

  return (
    <div>
      {/* Show onboarding screen if no progression mode is selected */}
      {!progressionMode && (
        <Onboarding onSelectProgression={handleSelectProgression} />
      )}

      {/* Show the main app content once a progression mode is selected */}
      {progressionMode && (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Welcome to On'yo!</h1>
          <p>You selected: {progressionMode === 'jlpt' ? 'JLPT-Based Progression' : 'Unstructured Progression'}</p>
        </div>
      )}
    </div>
  );
}