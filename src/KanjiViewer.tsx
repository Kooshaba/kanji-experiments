import React, { useState, useEffect } from "react";
import { Attempt, KanjiData, KanjiHistory } from "./types";

function getKanjiHistory(): KanjiHistory {
  return JSON.parse(localStorage.getItem("kanjiHistory") || "{}");
}

function getKanjiHistoryForKanji(kanji: string): Attempt[] {
  const history = getKanjiHistory();
  return history[kanji] || [];
}

const KanjiViewer = ({ kanjiData }: { kanjiData: KanjiData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<
    {
      time: string;
      correct: boolean;
    }[]
  >([]);
  const [sessionHistory, setSessionHistory] = useState<KanjiHistory>({});

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        showDetails ? handleCorrect() : advance();
      }
      if (event.key === "ArrowDown" && showDetails) {
        handleIncorrect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDetails, kanjiData]);

  useEffect(() => {
    if (kanjiData.length > 0) {
      const currentKanji = kanjiData[currentIndex].kanji;
      const history = getKanjiHistory();
      setAttemptHistory(history[currentKanji] || []);
    }
  }, [currentIndex, kanjiData]);

  const advance = () => {
    setShowDetails(!showDetails);
    if (showDetails) {
      setCurrentIndex((currentIndex + 1) % kanjiData.length);
    }
  };

  const flashScreen = async (color) => {
    const body = document.body;
    body.style.transition = "background-color 0.5s ease";
    body.style.backgroundColor = color;
    await new Promise((resolve) => setTimeout(resolve, 200));
    body.style.backgroundColor = ""; // Reset to original color
  };

  const saveAttempt = (kanji, correct) => {
    const history = getKanjiHistory();
    const attempts = history[kanji] || [];
    attempts.push({ time: new Date().toISOString(), correct });
    history[kanji] = attempts;
    localStorage.setItem("kanjiHistory", JSON.stringify(history));
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
    saveAttempt(currentKanji, true);
    await flashScreen("green");
    advance();
    updateSessionHistory(currentKanji, true);
  };

  const handleIncorrect = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    saveAttempt(currentKanji, false);
    await flashScreen("red");
    advance();
    updateSessionHistory(currentKanji, false);
  };

  if (kanjiData.length === 0) return <div>Loading...</div>;

  const currentKanji = kanjiData[currentIndex];

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
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

      <div>{currentKanji.meaning}</div>
      {showDetails && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "100px" }}>{currentKanji.kanji}</div>
          <img
            src={currentKanji.imagePath}
            alt={`Stroke order for ${currentKanji.kanji}`}
            style={{ maxWidth: "100px" }}
          />
          <div>Readings: {currentKanji.readings.join(", ")}</div>

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

          <div
            style={{
              marginTop: "20px",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <div style={{ marginBottom: "10px" }}>Previous Attempts:</div>
            {attemptHistory.map((attempt, index) => (
              <span
                key={index}
                style={{ color: attempt.correct ? "green" : "red" }}
              >
                {attempt.correct ? "✔️" : "❌"}
              </span>
            ))}
          </div>

          <button
            onClick={handleIncorrect}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              marginLeft: "10px",
              backgroundColor: "red", // Color for incorrect
              color: "white",
            }}
          >
            Incorrect
          </button>

          <button
            onClick={handleCorrect}
            style={{
              marginLeft: "10px",
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "green", // Color for correct
              color: "white",
            }}
          >
            Correct
          </button>
        </div>
      )}
      {!showDetails && (
        <button
          onClick={advance}
          style={{ marginTop: "20px", padding: "10px 20px" }}
        >
          Show Details
        </button>
      )}
    </div>
  );
};

export default KanjiViewer;
