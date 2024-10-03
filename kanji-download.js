// Import necessary modules
import axios from 'axios';
import { load } from 'cheerio';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';

// Function to convert katakana to hiragana
function katakanaToHiragana(katakana) {
  return katakana.replace(/[\u30A1-\u30F6]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

// Function to fetch kanji details
async function fetchKanjiDetails(kanjiUrl) {
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

(async () => {
  const kanjiUrls = [
    'https://www.kanshudo.com/kanji/人',
    'https://www.kanshudo.com/kanji/一',
    'https://www.kanshudo.com/kanji/日',
    'https://www.kanshudo.com/kanji/大',
    'https://www.kanshudo.com/kanji/年',
    'https://www.kanshudo.com/kanji/出',
    'https://www.kanshudo.com/kanji/本',
    'https://www.kanshudo.com/kanji/中',
    'https://www.kanshudo.com/kanji/子',
    'https://www.kanshudo.com/kanji/見',
    'https://www.kanshudo.com/kanji/国',
    'https://www.kanshudo.com/kanji/上',
    'https://www.kanshudo.com/kanji/分',
    'https://www.kanshudo.com/kanji/生',
    'https://www.kanshudo.com/kanji/行',
    'https://www.kanshudo.com/kanji/二',
    'https://www.kanshudo.com/kanji/間',
    'https://www.kanshudo.com/kanji/時',
    'https://www.kanshudo.com/kanji/気',
    'https://www.kanshudo.com/kanji/十',
    'https://www.kanshudo.com/kanji/女',
    'https://www.kanshudo.com/kanji/三',
    'https://www.kanshudo.com/kanji/前',
    'https://www.kanshudo.com/kanji/入',
    'https://www.kanshudo.com/kanji/小',
    'https://www.kanshudo.com/kanji/後',
    'https://www.kanshudo.com/kanji/長',
    'https://www.kanshudo.com/kanji/下',
    'https://www.kanshudo.com/kanji/学',
    'https://www.kanshudo.com/kanji/月',
    'https://www.kanshudo.com/kanji/何',
    'https://www.kanshudo.com/kanji/来',
    'https://www.kanshudo.com/kanji/話',
    'https://www.kanshudo.com/kanji/山',
    'https://www.kanshudo.com/kanji/高',
    'https://www.kanshudo.com/kanji/今',
    'https://www.kanshudo.com/kanji/書',
    'https://www.kanshudo.com/kanji/五',
    'https://www.kanshudo.com/kanji/名',
    'https://www.kanshudo.com/kanji/金',
    'https://www.kanshudo.com/kanji/男',
    'https://www.kanshudo.com/kanji/外',
    'https://www.kanshudo.com/kanji/四',
    'https://www.kanshudo.com/kanji/先',
    'https://www.kanshudo.com/kanji/川',
    'https://www.kanshudo.com/kanji/東',
    'https://www.kanshudo.com/kanji/聞',
    'https://www.kanshudo.com/kanji/語',
    'https://www.kanshudo.com/kanji/九',
    'https://www.kanshudo.com/kanji/食',
    'https://www.kanshudo.com/kanji/八',
    'https://www.kanshudo.com/kanji/水',
    'https://www.kanshudo.com/kanji/天',
    'https://www.kanshudo.com/kanji/木',
    'https://www.kanshudo.com/kanji/六',
    'https://www.kanshudo.com/kanji/万',
    'https://www.kanshudo.com/kanji/白',
    'https://www.kanshudo.com/kanji/七',
    'https://www.kanshudo.com/kanji/円',
    'https://www.kanshudo.com/kanji/電',
    'https://www.kanshudo.com/kanji/父',
    'https://www.kanshudo.com/kanji/北',
    'https://www.kanshudo.com/kanji/車',
    'https://www.kanshudo.com/kanji/母',
    'https://www.kanshudo.com/kanji/半',
    'https://www.kanshudo.com/kanji/百',
    'https://www.kanshudo.com/kanji/土',
    'https://www.kanshudo.com/kanji/西',
    'https://www.kanshudo.com/kanji/読',
    'https://www.kanshudo.com/kanji/千',
    'https://www.kanshudo.com/kanji/校',
    'https://www.kanshudo.com/kanji/右',
    'https://www.kanshudo.com/kanji/南',
    'https://www.kanshudo.com/kanji/左',
    'https://www.kanshudo.com/kanji/友',
    'https://www.kanshudo.com/kanji/火',
    'https://www.kanshudo.com/kanji/毎',
    'https://www.kanshudo.com/kanji/雨',
    'https://www.kanshudo.com/kanji/休',
    'https://www.kanshudo.com/kanji/午',
    
  ];

  const kanjiDetailsList = [];
  const fetchPromises = [];

  for (let i = 0; i < kanjiUrls.length; i += 10) {
    const chunk = kanjiUrls.slice(i, i + 10);
    const promises = chunk.map(url => fetchKanjiDetails(url));
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