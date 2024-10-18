import { shuffle } from "lodash";
import { KanjiData, SRSLevel, SRSLevelTimeGaps } from "./types";

import { SRSData } from "./types";
import { DateTime, Duration } from "luxon";

export const createSRSCalculator = ({
  storeAttempt,
  getAttempt,
}: {
  storeAttempt: (kanji: string, data: SRSData) => void;
  getAttempt: (kanji: string) => SRSData | undefined;
}) => {
  const createBlankSrsData = (kanji: string): SRSData => {
    return {
      kanji,
      level: 0 as SRSLevel,
      lastAttemptAt: DateTime.now().toUnixInteger(),
    };
  };

  const correctAttempt = (kanji: string, easeFactor: number = 0) => {
    let attempt = getAttempt(kanji);
    if (!attempt) {
      attempt = createBlankSrsData(kanji);
    }
    let newLevel = (attempt.level + 1 + easeFactor) as SRSLevel;
    if (newLevel > 12) {
      newLevel = 12 as SRSLevel;
    }

    const newAttempt = {
      ...attempt,
      level: newLevel,
      lastAttemptAt: DateTime.now().toUnixInteger(),
    };
    storeAttempt(kanji, newAttempt);
  };

  const incorrectAttempt = (kanji: string) => {
    let attempt = getAttempt(kanji);
    if (!attempt) {
      attempt = createBlankSrsData(kanji);
    }

    let newLevel = (attempt.level - 2) as SRSLevel;
    if (newLevel < 0) {
      newLevel = 0 as SRSLevel;
    }
    const newAttempt = {
      ...attempt,
      level: newLevel,
      lastAttemptAt: DateTime.now().toUnixInteger(),
    };
    storeAttempt(kanji, newAttempt);
  };

  const shouldGenerateReview = (kanji: string): boolean => {
    const attempt = getAttempt(kanji);
    if (!attempt) {
      return true;
    }
    const gap = getTimeSinceLastReview(kanji);
    const minGapForLevel = SRSLevelTimeGaps[attempt.level];
    return gap > minGapForLevel;
  };

  const getTimeSinceLastReview = (kanji: string): Duration => {
    const attempt = getAttempt(kanji);
    if (!attempt) {
      return Duration.fromObject({ seconds: 0 });
    }
    const gap = DateTime.now().diff(
      DateTime.fromSeconds(attempt.lastAttemptAt)
    );
    return gap;
  };

  const createNewSession = (kanjiData: KanjiData): KanjiData => {
    const sessionKanji = kanjiData.filter((kanji) =>
      shouldGenerateReview(kanji.kanji)
    );
    return shuffle(sessionKanji);
  };

  return {
    correctAttempt,
    incorrectAttempt,
    shouldGenerateReview,
    getTimeSinceLastReview,
    createNewSession,
  };
};
