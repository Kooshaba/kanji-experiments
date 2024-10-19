import React, { useState, useEffect } from "react";
import {
  Attempt,
  Kanji,
  KanjiData,
  KanjiHistory,
  SRSLevelTranslations,
  SessionSummary,
} from "./types";
import { createSRSStorage } from "./SRSStorage";
import { Duration, DateTime } from "luxon";

const KanjiViewer = ({
  kanjiData,
  onCorrect,
  onIncorrect,
  srsStorage,
  onSessionComplete,
}: {
  kanjiData: KanjiData;
  srsStorage: ReturnType<typeof createSRSStorage>;
  onCorrect: (kanji: string, easeFactor?: number) => void;
  onIncorrect: (kanji: string) => void;
  onSessionComplete: (summary: SessionSummary) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<KanjiHistory>({});
  const [sessionSummary, setSessionSummary] = useState<SessionSummary>({
    totalTime: Duration.fromObject({ seconds: 0 }),
    totalKanji: 0,
    correctKanji: 0,
    incorrectKanji: 0,
  });
  const [startTime, setStartTime] = useState(DateTime.now());

  useEffect(() => {
    setStartTime(DateTime.now());
    setCurrentIndex(0);
    setSessionSummary({
      totalTime: Duration.fromObject({ seconds: 0 }),
      totalKanji: 0,
      correctKanji: 0,
      incorrectKanji: 0,
    });
  }, [kanjiData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        showDetails ? handleCorrect() : advance();
      }
      if (event.key === "ArrowDown" && showDetails) {
        handleIncorrect();
      }
      if (event.key === "ArrowUp" && showDetails) {
        handleEasy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDetails, kanjiData]);

  const advance = () => {
    setShowDetails(!showDetails);
    if (showDetails) {
      if (currentIndex < kanjiData.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const endTime = DateTime.now();
        const totalTime = endTime.diff(startTime);
        onSessionComplete({
          ...sessionSummary,
          totalTime: totalTime,
        });
      }
    }
  };

  const flashScreen = async (color: string) => {
    const body = document.body;
    body.style.transition = "background-color 0.5s ease";
    body.style.backgroundColor = color;
    await new Promise((resolve) => setTimeout(resolve, 200));
    body.style.backgroundColor = "";
  };

  const updateSessionHistory = (kanji: string, correct: boolean) => {
    const history = sessionHistory;
    const attempts = history[kanji] || [];
    attempts.push({ time: new Date().toISOString(), correct });
    history[kanji] = attempts;
    setSessionHistory(history);
  };

  const handleCorrect = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    onCorrect(currentKanji);
    setSessionSummary({
      ...sessionSummary,
      totalKanji: sessionSummary.totalKanji + 1,
      correctKanji: sessionSummary.correctKanji + 1,
    });
    updateSessionHistory(currentKanji, true);
    await flashScreen("green");
    advance();
  };

  const handleEasy = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    onCorrect(currentKanji, 2);
    setSessionSummary({
      ...sessionSummary,
      totalKanji: sessionSummary.totalKanji + 1,
      correctKanji: sessionSummary.correctKanji + 1,
    });
    updateSessionHistory(currentKanji, true);
    await flashScreen("blue");
    advance();
  };

  const handleIncorrect = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    onIncorrect(currentKanji);
    setSessionSummary({
      ...sessionSummary,
      totalKanji: sessionSummary.totalKanji + 1,
      incorrectKanji: sessionSummary.incorrectKanji + 1,
    });
    updateSessionHistory(currentKanji, false);
    await flashScreen("red");
    advance();
  };

  if (kanjiData.length === 0) return <div>Loading...</div>;

  const currentKanji = kanjiData[currentIndex] as Kanji | undefined;
  const currentKanjiSRSData = currentKanji
    ? srsStorage.getKanji(currentKanji.kanji)
    : undefined;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          border: "none",
          padding: "5px",
          fontSize: "12px",
          textAlign: "left",
        }}
      >
        <h3>Session Data</h3>
        <p>Remaining: {kanjiData.length - currentIndex}</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        {kanjiData.map((kanji, index) => {
          const isCurrent = index === currentIndex;
          const sessionAttempts = sessionHistory[kanji.kanji] ?? [];
          const lastAttempt =
            sessionAttempts.length > 0
              ? sessionAttempts[sessionAttempts.length - 1]
              : null;
          const lastAttemptCorrect = lastAttempt && lastAttempt.correct;
          let backgroundColor = "lightgray";
          if (lastAttemptCorrect) {
            backgroundColor = "lightgreen";
          } else if (lastAttempt) {
            backgroundColor = "lightcoral";
          }
          return (
            <div
              key={kanji.kanji}
              style={{
                flex: 1,
                height: "10px",
                backgroundColor: isCurrent ? "green" : backgroundColor,
                transition: "background-color 0.3s",
                transform: isCurrent ? "scale(1.5)" : "scale(1)",
                margin: "0 2px",
              }}
            ></div>
          );
        })}
      </div>

      <div>{currentKanji?.meaning}</div>
      {showDetails && currentKanji && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "100px" }}>{currentKanji.kanji}</div>
          <img
            src={currentKanji.imagePath}
            alt={`Stroke order for ${currentKanji.kanji}`}
            style={{ maxWidth: "100px" }}
          />
          <div>Readings: {currentKanji.readings.join(", ")}</div>

          <div>
            Last Attempt:{" "}
            {currentKanjiSRSData?.lastAttemptAt
              ? new Date(
                  currentKanjiSRSData.lastAttemptAt * 1000
                ).toLocaleString()
              : "N/A"}
          </div>
          <div>
            <strong>Level:</strong> {currentKanjiSRSData?.level} -{" "}
            {SRSLevelTranslations[currentKanjiSRSData?.level ?? 0]}
          </div>

          <a
            href={`https://www.kanshudo.com/search?q=${currentKanji.kanji}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
            }}
          >
            View on Kanshudo
          </a>

          <button
            onClick={handleIncorrect}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              marginLeft: "10px",
              backgroundColor: "red",
              color: "white",
              cursor: "pointer", // Add cursor pointer
              transition: "transform 0.2s", // Add transition for animation
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Incorrect
          </button>

          <button
            onClick={handleCorrect}
            style={{
              marginLeft: "10px",
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "green",
              color: "white",
              cursor: "pointer", // Add cursor pointer
              transition: "transform 0.2s", // Add transition for animation
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Correct
          </button>

          <button
            onClick={handleEasy}
            style={{
              marginLeft: "10px",
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "blue",
              color: "white",
              cursor: "pointer", // Add cursor pointer
              transition: "transform 0.2s", // Add transition for animation
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Easy
          </button>

          <div
            style={{
              marginTop: "20px",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <div style={{ marginBottom: "10px" }}>Sample Words:</div>
            {currentKanji?.vocab?.map((vocabWord, index) => (
              <div key={index} style={{ marginBottom: "5px" }}>
                <strong>{vocabWord.word}</strong> ({vocabWord.reading}):{" "}
                {vocabWord.meaning}{" "}
                <a
                  href={`https://jisho.org/search/${encodeURIComponent(
                    vocabWord.word
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (Jisho)
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!showDetails && (
        <button
          onClick={advance}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            cursor: "pointer", // Add cursor pointer
            transition: "transform 0.2s", // Add transition for animation
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Show Details
        </button>
      )}
    </div>
  );
};

export default KanjiViewer;
