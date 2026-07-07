import { getUserJlptProgress } from '@/utils/jlpt';

export async function getGoalProgress(userId, track, goalLevel) {

  if (!goalLevel) {
    const jlptProgress = track === 'jlpt' ? await getUserJlptProgress(userId) : await getUserJlptProgress(userId);
    return calculateOverallProgress(jlptProgress);
  }

  const jlptProgress = track === 'jlpt' ? await getUserJlptProgress(userId) : await getUserJlptProgress(userId);

  if (track === 'jlpt') {
    return calculateJlptGoalProgress(goalLevel, jlptProgress);
  } else {
    return calculateStatGoalProgress(goalLevel, jlptProgress);
  }
}

function calculateOverallProgress(jlptProgress) {

  let totalMastered = 0;
  let totalLearning = 0;
  let totalUnlearned = 0;
  let totalKanji = 0;

  Object.values(jlptProgress).forEach(level => {
    totalMastered += level.mastered;
    totalLearning += level.learning;
    totalUnlearned += level.unlearned;
    totalKanji += level.totalKanji;
  });

  return {
    mastered: totalMastered,
    learning: totalLearning,
    unlearned: totalUnlearned,
    total: totalKanji,
    percentage: Math.round((totalMastered / totalKanji) * 100)
  };
}

function calculateJlptGoalProgress(goalLevel, jlptProgress) {
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1'];
  const targetIndex = levels.indexOf(goalLevel);

  let totalMastered = 0;
  let totalLearning = 0;
  let totalUnlearned = 0;
  let totalKanji = 0;

  for (let i = 0; i <= targetIndex; i++) {
    const level = levels[i];
    totalMastered += jlptProgress[level].mastered;
    totalLearning += jlptProgress[level].learning;
    totalUnlearned += jlptProgress[level].unlearned;
    totalKanji += jlptProgress[level].totalKanji;
  }

  return {
    mastered: totalMastered,
    learning: totalLearning,
    unlearned: totalUnlearned,
    total: totalKanji,
    percentage: Math.round((totalMastered / totalKanji) * 100),
    goalLevel,
    goalName: `JLPT ${goalLevel.toUpperCase()}`
  };
}

function calculateStatGoalProgress(goalLevel, jlptProgress) {
  const statGrouping = {
    n5: { levels: ['n5'], name: 'Beginner' },                    
    n4: { levels: ['n5', 'n4', 'n3'], name: 'Intermediate' },   
    n3: { levels: ['n5', 'n4', 'n3'], name: 'Intermediate' },   
    n2: { levels: ['n5', 'n4', 'n3', 'n2'], name: 'Advanced' }, 
    n1: { levels: ['n5', 'n4', 'n3', 'n2', 'n1'], name: 'Native' }
  };

  const config = statGrouping[goalLevel] || statGrouping['n4']; 

  if (!config) {

    return calculateOverallProgress(jlptProgress);
  }

  let totalMastered = 0;
  let totalLearning = 0;
  let totalUnlearned = 0;
  let totalKanji = 0;

  config.levels.forEach(level => {
    totalMastered += jlptProgress[level].mastered;
    totalLearning += jlptProgress[level].learning;
    totalUnlearned += jlptProgress[level].unlearned;
    totalKanji += jlptProgress[level].totalKanji;
  });

  return {
    mastered: totalMastered,
    learning: totalLearning,
    unlearned: totalUnlearned,
    total: totalKanji,
    percentage: Math.round((totalMastered / totalKanji) * 100),
    goalLevel,
    goalName: config.name
  };
}

export function getAvailableGoals(track) {
  if (track === 'jlpt') {
    return [
      { value: 'n5', label: 'JLPT N5', description: 'Master 80 basic kanji' },
      { value: 'n4', label: 'JLPT N4', description: 'Expand to 250 kanji' },
      { value: 'n3', label: 'JLPT N3', description: 'Intermediate 370 kanji' },
      { value: 'n2', label: 'JLPT N2', description: 'Advanced 1000+ kanji' },
      { value: 'n1', label: 'JLPT N1', description: 'Mastery of 2000+ kanji' }
    ];
  } else {
    return [
      { value: 'n5', label: 'Beginner', description: 'Start with N5 kanji (80)' },
      { value: 'n3', label: 'Intermediate', description: 'Master up to N3 (250+ kanji)' }, 

      { value: 'n2', label: 'Advanced', description: 'Master up to N2 (500+ kanji)' },
      { value: 'n1', label: 'Native', description: 'Complete mastery (2000+ kanji)' }
    ];
  }
}

