export type Kanji = {
  kanji: string;
  readings: string[];
  meaning: string;
  imagePath: string;
  vocab: VocabWord[];
};
export type VocabWord = {
  word: string;
  reading: string;
  meaning: string;
};
export type KanjiData = Kanji[];
export type KanjiHistory = Record<string, Attempt[]>;
export type Attempt = { time: string; correct: boolean };
