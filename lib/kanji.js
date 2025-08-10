import kanjiData from '@/data/kanji.json';

export function getKanjiData() {
  return Object.entries(kanjiData).map(([kanji, data]) => ({
    kanji,
    ...data,
  }));
}

export function getKanjiByJlpt() {
  const kanjiByJlpt = {
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
    null: [], 
  };

  const kanjiDataArray = getKanjiData();
  kanjiDataArray.forEach((kanji) => {
    const level = kanji.jlpt_new ? `N${kanji.jlpt_new}` : 'null';
    kanjiByJlpt[level].push(kanji);
  });

  return kanjiByJlpt;
}