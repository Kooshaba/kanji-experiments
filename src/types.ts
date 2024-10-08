export type Kanji = {
  kanji: string;
  readings: string[];
  meaning: string;
  imagePath: string;
};
export type KanjiData = Kanji[];
export type KanjiHistory = Record<string, Attempt[]>;
export type Attempt = { time: string; correct: boolean };
