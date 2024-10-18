import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { addKanjiToFile, fetchKanjiDetails } from '../kanji-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get kanji details
app.get('/api/kanji-details', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, '..', 'public', 'kanjiDetails.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read kanji details' });
  }
});

// Endpoint to get specific kanji details
app.get('/api/kanji/:kanji', async (req, res) => {
  const { kanji } = req.params;
  try {
    const data = await fs.readFile(path.join(__dirname, '..', 'public', 'kanjiDetails.json'), 'utf8');
    const kanjiDetails = JSON.parse(data);
    const specificKanji = kanjiDetails.find(detail => {
      console.log(kanji);
      return detail.kanji === kanji
    });
    
    if (specificKanji) {
      res.json(specificKanji);
    } else {
      res.status(404).json({ error: 'Kanji not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read kanji details' });
  }
});

// trigger download of kanji details
app.post('/api/kanji/review', async (req, res) => {
  const { kanji } = req.body;
  const kanjiDetails = await fetchKanjiDetails(kanji);
  await addKanjiToFile(kanjiDetails);
  res.json(kanjiDetails);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
