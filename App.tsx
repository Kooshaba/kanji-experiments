import React, { useState, useEffect, useMemo } from "react";
import KanjiViewer from "./src/KanjiViewer";
import { KanjiData, SessionSummary } from "./src/types";
import { createSRSStorage } from "./src/SRSStorage";
import { createSRSCalculator } from "./src/SRSCalculator";
import { KanjiBoard } from "./src/KanjiBoard";

function App() {
  const [allKanji, setAllKanji] = useState<KanjiData>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionKanji, setSessionKanji] = useState<KanjiData>([]);
  const [isLearningSession, setIsLearningSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(
    null
  );
  const [manualSessionSize, setManualSessionSize] = useState<number | null>(
    null
  );
  const [displayKanjiBoard, setDisplayKanjiBoard] = useState(false);

  const srsStorage = useMemo(() => createSRSStorage(), []);
  const srsCalculator = useMemo(
    () =>
      createSRSCalculator({
        getAttempt: srsStorage.getKanji,
        storeAttempt: srsStorage.storeKanji,
      }),
    [srsStorage]
  );

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

  const handleSessionComplete = (summary: SessionSummary) => {
    if (isLearningSession) {
      const incorrectKanji = sessionKanji.filter(
        (kanji) => srsStorage.getKanji(kanji.kanji)?.level === 0
      );
      setSessionKanji(incorrectKanji);
    } else {
      setSessionKanji([]);
      setSessionSummary(summary);
    }
  };

  const createNewSession = () => {
    const newSession = srsCalculator.createNewSession(allKanji);
    let filteredSession = newSession.filter((kanji) => {
      const level = srsStorage.getKanji(kanji.kanji)?.level || 0;
      return level !== 0;
    });
    if (manualSessionSize)
      filteredSession = filteredSession.slice(0, manualSessionSize);
    setSessionKanji(filteredSession);
    setIsLearningSession(false);
  };

  const createLearningSession = () => {
    let newSession = srsCalculator
      .createNewSession(allKanji)
      .filter((kanji) => {
        const level = srsStorage.getKanji(kanji.kanji)?.level || 0;
        return level === 0 || level === 1;
      });
    if (manualSessionSize) newSession = newSession.slice(0, manualSessionSize);
    setSessionKanji(newSession);
    setIsLearningSession(true);
  };

  return (
    <div className="App">
      {error && <div className="error">{error}</div>}

      <button
        onClick={() => setDisplayKanjiBoard((prev) => !prev)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#ffc107",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#e0a800")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#ffc107")
        }
      >
        {displayKanjiBoard ? "Hide Kanji Board" : "Show Kanji Board"}
      </button>

      {displayKanjiBoard && (
        <KanjiBoard
          kanjiHistory={srsStorage.getSRSHistory()}
          allKanji={allKanji}
          setHistory={srsStorage.storeKanji}
        />
      )}

      <button
        onClick={createNewSession}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#0056b3")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#007bff")
        }
      >
        Create New Session
      </button>

      <button
        onClick={createLearningSession}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#218838")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#28a745")
        }
      >
        Create Learning Session
      </button>

      <div style={{ marginTop: "20px" }}>
        <label htmlFor="sessionSize" style={{ marginRight: "10px" }}>
          Choose Session Size:
        </label>
        <input
          type="number"
          id="sessionSize"
          min="1"
          max="20"
          onChange={(e) => setManualSessionSize(Number(e.target.value))}
          style={{
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "60px",
          }}
        />
      </div>

      {sessionKanji.length > 0 && (
        <KanjiViewer
          onSessionComplete={handleSessionComplete}
          kanjiData={sessionKanji}
          srsStorage={srsStorage}
          onCorrect={srsCalculator.correctAttempt}
          onIncorrect={srsCalculator.incorrectAttempt}
          isLearningSession={isLearningSession}
        />
      )}

      {sessionSummary && (
        <div>
          <h2>Session Summary</h2>
          <p>Correct: {sessionSummary.correctKanji}</p>
          <p>Incorrect: {sessionSummary.incorrectKanji}</p>
        </div>
      )}
    </div>
  );
}

export default App;
