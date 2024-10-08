import React, { useState, useEffect } from "react";
import KanjiViewer from "./src/KanjiViewer";
import { KanjiData, KanjiHistory } from "./src/types";

enum StudyMode {
  All = "all",
  RecentlyAdded = "recentlyAdded",
  RecentlyFailed = "recentlyFailed",
  LowestCorrectPercent = "lowestCorrectPercent",
  NotSeenRecently = "notSeenRecently",
}

function App() {
  const [allKanji, setAllKanji] = useState<KanjiData>([]);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.All);

  useEffect(() => {
    fetch("/kanjiDetails.json")
      .then((response) => response.json())
      .then((data) => {
        setAllKanji(data);
      })
      .catch((error) => {
        console.error("Error fetching kanji details:", error);
        setError("Error fetching kanji details");
      });
  }, []);

  const getKanjiHistory = (): KanjiHistory => {
    return JSON.parse(localStorage.getItem("kanjiHistory") || "{}");
  };

  const filterKanjiData = (): KanjiData => {
    if (studyMode === StudyMode.RecentlyAdded) {
      const history = getKanjiHistory();
      return allKanji.filter((kanji) => !history[kanji.kanji]);
    }
    if (studyMode === StudyMode.RecentlyFailed) {
      const history = getKanjiHistory();
      return allKanji.filter((kanji) => {
        const attempts = history[kanji.kanji] || [];
        const recentAttempts = attempts.slice(-2);
        const failedAttempts = recentAttempts.filter(
          (attempt) => !attempt.correct
        );
        return failedAttempts.length > 0;
      });
    }

    if (studyMode === StudyMode.LowestCorrectPercent) {
      const history = getKanjiHistory();
      return allKanji.sort((a, b) => {
        const attempts = history[a.kanji] || [];
        const correctAttempts = attempts.filter((attempt) => attempt.correct);
        const aCorrectPercent =
          (correctAttempts.length / attempts.length) * 100;

        const attemptsB = history[b.kanji] || [];
        const correctAttemptsB = attemptsB.filter((attempt) => attempt.correct);
        const bCorrectPercent =
          (correctAttemptsB.length / attemptsB.length) * 100;

        return aCorrectPercent - bCorrectPercent;
      });
    }

    if (studyMode === StudyMode.NotSeenRecently) {
      const history = getKanjiHistory();
      const recentAttemptsThreshold =
        new Date().getTime() - 1000 * 60 * 60 * 24; // 1 day
      return allKanji
        .filter((kanji) => {
          const attempts = history[kanji.kanji] || [];
          const recentAttempts = attempts.filter(
            (attempt) => new Date(attempt.time) > recentAttemptsThreshold
          );
          return recentAttempts.length === 0;
        })
        .sort((a, b) => {
          const attemptsA = history[a.kanji] || [];
          const attemptsB = history[b.kanji] || [];
          const latestAttemptA = attemptsA[attemptsA.length - 1];
          const latestAttemptB = attemptsB[attemptsB.length - 1];
          return (
            new Date(latestAttemptA.time).getTime() -
            new Date(latestAttemptB.time).getTime()
          );
        });
    }

    return allKanji;
  };

  const filteredKanjiData = filterKanjiData();

  return (
    <div className="App">
      {error && <div className="error">{error}</div>}
      <div>
        <button onClick={() => setStudyMode(StudyMode.All)}>All Kanji</button>
        <button onClick={() => setStudyMode(StudyMode.RecentlyAdded)}>
          Recently Added
        </button>
        <button onClick={() => setStudyMode(StudyMode.RecentlyFailed)}>
          Recently Failed
        </button>
        <button onClick={() => setStudyMode(StudyMode.LowestCorrectPercent)}>
          Lowest Scores
        </button>
        <button onClick={() => setStudyMode(StudyMode.NotSeenRecently)}>
          Not Seen Recently
        </button>
      </div>
      <div>
        <p>Total Kanji in Session: {filteredKanjiData.length}</p>
      </div>
      {filteredKanjiData.length > 0 && (
        <KanjiViewer kanjiData={filteredKanjiData} />
      )}
    </div>
  );
}

export default App;
