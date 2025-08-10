const { PrismaClient } = require('@prisma/client');

// Load your JSON data - adjust the path to where your JSON file is located
const kanjiData = require('./kanji.json'); // Update this path

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');
  
  // First, identify all unique onyomi groups and their scores
  const onyomiGroupsMap = new Map();
  
  // Extract unique onyomi groups and their scores
  Object.entries(kanjiData).forEach(([character, data]) => {
    if (data.readings_on && data.readings_on.length > 0) {
      const primaryOnyomi = data.readings_on[0];
      // Only store groups that have a usefulness_score
      if (data.usefulness_score !== undefined && data.usefulness_score !== null) {
        if (!onyomiGroupsMap.has(primaryOnyomi)) {
          onyomiGroupsMap.set(primaryOnyomi, data.usefulness_score);
        }
      }
    }
  });
  
  // Create all onyomi groups
  console.log(`Creating ${onyomiGroupsMap.size} onyomi groups...`);
  
  for (const [reading, usefulness_score] of onyomiGroupsMap.entries()) {
    try {
      await prisma.onyomiGroup.create({
        data: {
          reading: reading,
          usefulness_score: usefulness_score
        }
      });
      console.log(`Created group: ${reading} (score: ${usefulness_score})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Group ${reading} already exists`);
      } else {
        console.log(`Error creating group ${reading}:`, error.message);
      }
    }
  }
  
  // Now create all kanji entries
  console.log(`Creating kanji entries...`);
  
  let count = 0;
  let skipped = 0;
  
  for (const [character, data] of Object.entries(kanjiData)) {
    const primaryOnyomi = data.readings_on && data.readings_on.length > 0 
      ? data.readings_on[0] 
      : null;
    
    // Skip kanji without usefulness scores or without primary onyomi
    if (!data.hasOwnProperty('usefulness_score') || data.usefulness_score === null || data.usefulness_score === undefined) {
      console.log(`Skipping ${character} - no usefulness_score`);
      skipped++;
      continue;
    }
    
    if (!primaryOnyomi) {
      console.log(`Skipping ${character} - no primary onyomi`);
      skipped++;
      continue;
    }
    
    // Skip kanji whose group doesn't exist
    if (!onyomiGroupsMap.has(primaryOnyomi)) {
      console.log(`Skipping ${character} - group ${primaryOnyomi} not created`);
      skipped++;
      continue;
    }
    
    try {
      await prisma.kanji.create({
        data: {
          character: character,
          strokes: data.strokes,
          grade: data.grade,
          freq: data.freq,
          jlpt_new: data.jlpt_new,
          meanings: data.meanings || [],
          readings_on: data.readings_on || [],
          readings_kun: data.readings_kun || [],
          primary_onyomi: primaryOnyomi,
          usefulness_score: data.usefulness_score
        }
      });
      
      count++;
      if (count % 100 === 0) {
        console.log(`Created ${count} kanji so far...`);
      }
    } catch (error) {
      console.log(`Error creating kanji ${character}:`, error.message);
    }
  }
  
  console.log(`Migration completed! Created ${count} kanji entries, skipped ${skipped}.`);
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });