import { SRSData, SRSHistory } from "./types";

export const createSRSStorage = () => {
  const getSRSHistory = (): SRSHistory => {
    return JSON.parse(localStorage.getItem("srsHistory") || "{}");
  };

  const storeSRSHistory = (history: SRSHistory) => {
    localStorage.setItem("srsHistory", JSON.stringify(history));
  };

  const storeKanji = (kanji: string, data: SRSData) => {
    const history = getSRSHistory();
    history[kanji] = data;
    storeSRSHistory(history);
  };

  const getKanji = (kanji: string): SRSData | undefined => {
    const history = getSRSHistory();
    return history[kanji];
  };

  return {
    getSRSHistory,
    storeSRSHistory,
    storeKanji,
    getKanji,
  };
};
