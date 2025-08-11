// scripts/import-words-to-db.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Load your words data - update the path to your actual JSON file
const wordsData = require('./kanji_examples.json');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting word import process...');
  
  // Get all kanji that exist in your database
  const existingKanji = await prisma.kanji.findMany({
    select: { 
      character: true, 
      id: true 
    }
  });
  
  const kanjiMap = new Map();
  existingKanji.forEach(k => kanjiMap.set(k.character, k.id));
  
  console.log(`Found ${kanjiMap.size} kanji in database`);
  
  let totalWordsCreated = 0;
  let totalWordsSkipped = 0;
  
  // Process each kanji and its words
  for (const [kanjiChar, words] of Object.entries(wordsData)) {
    const kanjiId = kanjiMap.get(kanjiChar);
    
    // Only process kanji that exist in database
    if (kanjiId) {
      console.log(`Processing ${kanjiChar} (${words.length} words)...`);
      
      // Create words for this kanji
      for (const wordData of words) {
        try {
          // Check if word already exists
          const existingWord = await prisma.exampleWord.findUnique({
            where: { word: wordData.word }
          });
          
          if (existingWord) {
            // Word exists, check if it's associated with this kanji
            if (existingWord.kanjiId === kanjiId) {
              console.log(`  Word ${wordData.word} already exists for this kanji, skipping...`);
              totalWordsSkipped++;
            } else {
              // Word exists but for different kanji - this is fine, words can have multiple kanji
              // For simplicity, we'll create a new entry for this kanji
              await prisma.exampleWord.create({
                data: {
                  word: wordData.word,
                  reading: wordData.reading,
                  meaning: wordData.meaning,
                  kanjiId: kanjiId
                }
              });
              totalWordsCreated++;
              console.log(`  Created word ${wordData.word} for kanji ${kanjiChar}`);
            }
          } else {
            // Create new word
            await prisma.exampleWord.create({
              data: {
                word: wordData.word,
                reading: wordData.reading,
                meaning: wordData.meaning,
                kanjiId: kanjiId
              }
            });
            totalWordsCreated++;
            console.log(`  Created word ${wordData.word} for kanji ${kanjiChar}`);
          }
        } catch (error) {
          console.error(`  Error processing word ${wordData.word}:`, error.message);
        }
      }
    } else {
      console.log(`Skipping kanji ${kanjiChar} - not in database`);
    }
  }
  
  console.log(`\nImport completed!`);
  console.log(`Total words created: ${totalWordsCreated}`);
  console.log(`Total words skipped: ${totalWordsSkipped}`);
  console.log(`Kanji processed: ${Object.keys(wordsData).filter(k => kanjiMap.has(k)).length}`);
}

main()
  .catch(e => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });