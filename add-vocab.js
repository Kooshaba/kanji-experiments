import axios from 'axios';
import { promises as fsPromises } from 'fs';
import OpenAI from "openai";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const openai = new OpenAI();


// Function to fetch vocabulary words
async function fetchVocabForKanji(kanji, existingKanji) {
  try {
    console.log(`Generating vocab for ${kanji}`);
    const prompt = `Generate vocabulary words using the kanji "${kanji}".
    Only use kanji that are in the following list: ${existingKanji.join(', ')}.
    Make sure the words are real and Japanese.
    Output only 2 words using the two different readings. They should be the most common words.
    Output the words in json using this example format: {
      words: [{
        word: "word",
        reading: "reading",
        meaning: "meaning"
      }]
    }`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a master of the Japanese language.You are generating vocabulary words given a specific kanji. You focus on accuracy and correctness." },
        {
            role: "user",
            content: prompt
        },
      ],
    });

    const textResponse = response.choices[0].message.content;
    const vocabWords = JSON.parse(textResponse);
    console.log(`Generated vocab for ${kanji}:`, vocabWords);
    return vocabWords.words;
  } catch (error) {
    console.error(`Error fetching vocab for ${kanji}:`, error);
    return [];
  }
}

(async () => {
  // Read existing kanji details
  const data = await fsPromises.readFile('public/kanjiDetails.json', 'utf8');
  const kanjiDetails = JSON.parse(data);

  // Extract kanji characters
  const existingKanji = kanjiDetails.map(detail => detail.kanji);
  for (const detail of kanjiDetails) {
    if (!detail.vocab || detail.vocab.length === 0) {
      const vocab = await fetchVocabForKanji(detail.kanji, existingKanji);
      detail.vocab = vocab;
    }
  }

  // Save updated kanji details
  await fsPromises.writeFile('public/kanjiDetails.json', JSON.stringify(kanjiDetails, null, 2));
  console.log('Updated kanji details with vocabulary words.');
})();
