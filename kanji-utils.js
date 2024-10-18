// Import necessary modules
import axios from 'axios';
import { load } from 'cheerio';
import { join } from 'path';
import sharp from 'sharp';
import { writeFile, readFile } from 'fs/promises'; // Added readFile

// Function to convert katakana to hiragana
function katakanaToHiragana(katakana) {
  return katakana.replace(/[\u30A1-\u30F6]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

// Function to fetch kanji details
export async function fetchKanjiDetails(kanjiUrl) {
  try {
    const { data } = await axios.get(kanjiUrl);
    const $ = load(data);

    // Extract all script contents from the page
    const scriptContents = [];
    $('script').each((i, elem) => {
      scriptContents.push($(elem).html());
    });
    const allScripts = scriptContents.join('\n');
    const svgUrlMatch = allScripts.match(/https:\/\/kanshudo\.s3\.amazonaws\.com\/svg\/[a-z0-9]+\.svg/);
    const strokeOrderImg = svgUrlMatch ? svgUrlMatch[0] : null;

    const svgResponse = await axios.get(strokeOrderImg, { responseType: 'arraybuffer' });
    const svgBuffer = Buffer.from(svgResponse.data);

    const fileName = `${kanjiUrl.split('/')[4]}.png`;
    const pngPath = join(process.cwd(), 'public', 'kanji', fileName);
    await sharp(svgBuffer)
      .png()
      .toFile(pngPath);

    console.log(`Downloaded and converted stroke order image for ${kanjiUrl}`);

    const kanjiCharacter = kanjiUrl.split('/')[4];
    const kanjiData = (await axios.get(`https://kanjiapi.dev/v1/kanji/${kanjiCharacter}`)).data;
    const meaning = kanjiData.meanings.join(', ');
    const readings = kanjiData.kun_readings.concat(kanjiData.on_readings.map(katakanaToHiragana));

    return { kanji: kanjiCharacter, readings, meaning, imagePath: `kanji/${fileName}` };
  } catch (error) {
    console.error(`Error fetching details for ${kanjiUrl}:`, error);
  }
}

export async function addKanjiToFile(kanji) {
  const kanjiDetails = await readFile('public/kanjiDetails.json', 'utf8').then(data => JSON.parse(data));
  kanjiDetails.push(kanji);
  await writeFile('public/kanjiDetails.json', JSON.stringify(kanjiDetails, null, 2));
}