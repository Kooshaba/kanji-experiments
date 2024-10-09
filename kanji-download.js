// Import necessary modules
import axios from 'axios';
import { load } from 'cheerio';
import { promises as fsPromises } from 'fs';
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
  const kanjiList = [
    '人',
    '一',
    '日',
    '大',
    '年',
    '出',
    '本',
    '中',
    '子',
    '見',
    '国',
    '上',
    '分',
    '生',
    '行',
    '二',
    '間',
    '時',
    '気',
    '十',
    '女',
    '三',
    '前',
    '入',
    '小',
    '後',
    '長',
    '下',
    '学',
    '月',
    '何',
    '来',
    '話',
    '山',
    '高',
    '今',
    '書',
    '五',
    '名',
    '金',
    '男',
    '外',
    '四',
    '先',
    '川',
    '東',
    '聞',
    '語',
    '九',
    '食',
    '八',
    '水',
    '天',
    '木',
    '六',
    '万',
    '白',
    '七',
    '円',
    '電',
    '父',
    '北',
    '車',
    '母',
    '半',
    '百',
    '土',
    '西',
    '読',
    '千',
    '校',
    '右',
    '南',
    '左',
    '友',
    '火',
    '毎',
    '雨',
    '休',
    '午',
    '容',
    '内',
    '力',
    '新',
    '古',
    '安',
    '短',
    '明',
    '暗',
    '開',
    '豆',
    '赤',
    '仕',
    '事',
    '英',
    '秋',
    '飴',
    '姉',
    '兄',
    '青',
    '朝',
    '飯',
    '足',
    '頭',
    '晩',
    '番',
    '号',
    '不',
    '更'
  ];

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