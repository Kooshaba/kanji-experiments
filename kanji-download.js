// Import necessary modules
import axios from 'axios';
import { load } from 'cheerio';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { writeFile, readFile } from 'fs/promises'; // Added readFile

import { fetchKanjiDetails } from './kanji-utils.js';

(async () => {
  const kanjiList = await fsPromises.readFile('kanji-list.txt', 'utf8').then(text => text.split('\n').filter(line => line.trim() !== ''));

  // Read existing kanji details
  let existingKanjiDetails = [];
  try {
    const data = await readFile('public/kanjiDetails.json', 'utf8');
    existingKanjiDetails = JSON.parse(data);
  } catch (error) {
    console.log('No existing kanji details found, starting fresh.');
  }

  // Extract kanji characters from existing details
  const existingKanjiCharacters = new Set(existingKanjiDetails.map(detail => detail.kanji));

  // Filter out URLs for kanji that already have details
  const newKanji = kanjiList.filter(char => {
    return !existingKanjiCharacters.has(char);
  });
  console.log(`Downloading details for ${newKanji.length} new kanji.`);

  const kanjiDetailsList = [...existingKanjiDetails];
  const fetchPromises = [];

  for (let i = 0; i < newKanji.length; i += 10) {
    const chunk = newKanji.slice(i, i + 10);
    const promises = chunk.map(char => fetchKanjiDetails(`https://www.kanshudo.com/kanji/${char}`));
    fetchPromises.push(...promises);
    
    const detailsList = await Promise.all(promises);
    detailsList.forEach(details => {
      if (details) {
        kanjiDetailsList.push(details);
      }
    });
  }

  // Save the details to a JSON file
  await writeFile('public/kanjiDetails.json', JSON.stringify(kanjiDetailsList, null, 2));
  console.log('Kanji details saved to kanjiDetails.json');
})();