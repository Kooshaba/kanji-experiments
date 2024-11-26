import React, { useMemo, useState } from "react";
import {
  KanjiData,
  SRSData,
  SRSHistory,
  SRSLevel,
  SRSLevelTimeGaps,
  SRSLevelTranslations,
} from "./types";
import { Duration, DateTime } from "luxon";

function SetHistoryForm({
  historyData,
  setHistory,
  closeModal,
}: {
  historyData: SRSData;
  setHistory: (kanji: string, data: SRSData) => void;
  closeModal: () => void;
}) {
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const lastReviewAt = useMemo(() => {
    return DateTime.fromSeconds(historyData.lastAttemptAt);
  }, [historyData.lastAttemptAt]);
  const nextReviewAt = useMemo(() => {
    return lastReviewAt.plus(
      SRSLevelTimeGaps[historyData.level] ?? Duration.fromObject({ seconds: 0 })
    );
  }, [lastReviewAt, historyData.level]);

  const onSetLevel = (e: SubmitEvent) => {
    e.preventDefault();
    if (newLevel === null) return;

    setHistory(historyData.kanji, {
      ...historyData,
      level: newLevel as SRSLevel,
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          backgroundColor: "white",
          padding: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "32px",
          }}
        >
          <h1 style={{ fontSize: "32px" }}>{historyData.kanji}</h1>
          <button onClick={closeModal}>(close)</button>
        </div>
        <h1>
          Current Level: {historyData.level} (
          {SRSLevelTranslations[historyData.level]})
        </h1>

        <p>Next Review: {nextReviewAt.toRelative()}</p>
        <form onSubmit={onSetLevel}>
          <input
            type="number"
            value={newLevel ?? ""}
            onChange={(e) => setNewLevel(parseInt(e.target.value))}
            placeholder="level override"
          />
          <button type="submit">Save</button>
        </form>

        <div style={{ height: "2rem" }} />

        <a
          href={`https://www.kanshudo.com/kanji/${historyData.kanji}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "blue",
            padding: "10px",
            textAlign: "center",
            color: "white",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer",
            borderRadius: "5px",
            textDecoration: "none",
            border: "none",
          }}
        >
          View on Kanshudo
        </a>
      </div>
    </div>
  );
}

export function KanjiBoard({
  kanjiHistory,
  allKanji,
  setHistory,
}: {
  kanjiHistory: SRSHistory;
  allKanji: KanjiData;
  setHistory: (kanji: string, data: SRSData) => void;
}) {
  const [selectedKanji, setSelectedKanji] = useState<SRSData | null>(null);
  const [sortMethod, setSortMethod] = useState<
    "lastStudied" | "srsLevel" | "unsorted"
  >("lastStudied");
  const maxLevel = 8;

  // Sort kanji based on the selected sort method
  const sortedKanji = useMemo(() => {
    if (sortMethod === "unsorted") {
      return allKanji;
    }
    return [...allKanji].sort((a, b) => {
      if (sortMethod === "lastStudied") {
        const aLastAttempt = kanjiHistory[a.kanji]?.lastAttemptAt || 0;
        const bLastAttempt = kanjiHistory[b.kanji]?.lastAttemptAt || 0;
        return bLastAttempt - aLastAttempt;
      } else if (sortMethod === "srsLevel") {
        const aLevel = kanjiHistory[a.kanji]?.level || 0;
        const bLevel = kanjiHistory[b.kanji]?.level || 0;
        return bLevel - aLevel;
      }
      return 0;
    });
  }, [allKanji, kanjiHistory, sortMethod]);

  // Function to get color based on SRS level
  const getColorForLevel = (level: SRSLevel) => {
    switch (level) {
      case 0:
        return "gray";
      case 1:
        return "lightblue";
      case 2:
        return "blue";
      case 3:
        return "purple";
      case 4:
        return "green";
      case 5:
        return "darkgreen";
      case 6:
        return "orange";
      case 7:
        return "red";
      case 8:
        return "black";
      default:
        return "white";
    }
  };

  return (
    <>
      {selectedKanji && (
        <SetHistoryForm
          setHistory={setHistory}
          historyData={selectedKanji}
          closeModal={() => setSelectedKanji(null)}
        />
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="sortMethod">Sort by: </label>
        <select
          id="sortMethod"
          value={sortMethod}
          onChange={(e) =>
            setSortMethod(
              e.target.value as "lastStudied" | "srsLevel" | "unsorted"
            )
          }
        >
          <option value="lastStudied">Last Studied</option>
          <option value="srsLevel">SRS Level</option>
          <option value="unsorted">Unsorted</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "10px",
        }}
      >
        {sortedKanji.map((kanji) => {
          const srsData = kanjiHistory[kanji.kanji];
          const level = Math.min(
            srsData ? srsData.level : 0,
            maxLevel
          ) as SRSLevel;
          const color = getColorForLevel(level);

          return (
            <button
              key={`${kanji.kanji}-${srsData?.level}-${Math.random()}`}
              style={{
                backgroundColor: color,
                padding: "10px",
                textAlign: "center",
                color: "white",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                borderRadius: "5px",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={(e) => {
                setSelectedKanji(srsData);
              }}
            >
              <div>{kanji.kanji}</div>
              <div>{SRSLevelTranslations[level]}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}
