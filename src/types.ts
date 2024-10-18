import { Duration } from "luxon";

export type Kanji = {
  kanji: string;
  readings: string[];
  meaning: string;
  imagePath: string;
  vocab?: VocabWord[];
};
export type VocabWord = {
  word: string;
  reading: string;
  meaning: string;
};
export type KanjiData = Kanji[];
export type KanjiHistory = Record<string, Attempt[]>;
export type Attempt = { time: string; correct: boolean };

export type SRSHistory = Record<string, SRSData>;
export type SRSData = {
  kanji: string;
  level: SRSLevel;
  lastAttemptAt: number;
};
export type SRSLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const SRSLevelTranslations: Record<SRSLevel, string> = {
  0: "None",
  1: "Apprentice",
  2: "Guru",
  3: "Guru 2",
  4: "Master",
  5: "Master 2",
  6: "Enlightened",
  7: "Legendary",
  8: "Burned",
};

export const SRSLevelTimeGaps = {
  0: Duration.fromObject({ seconds: 0 }),
  1: Duration.fromObject({ minutes: 30 }),
  2: Duration.fromObject({ hours: 2 }),
  3: Duration.fromObject({ hours: 8 }),
  4: Duration.fromObject({ hours: 24 }),
  5: Duration.fromObject({ days: 3 }),
  6: Duration.fromObject({ days: 7 }),
  7: Duration.fromObject({ days: 14 }),
  8: Duration.fromObject({ days: 30 }),
};

export type SessionSummary = {
  totalTime: Duration;
  totalKanji: number;
  correctKanji: number;
  incorrectKanji: number;
};
