import React, { useState, useEffect } from 'react';

const KanjiViewer = () => {
  const [kanjiData, setKanjiData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState([]);

  useEffect(() => {
    fetch('/kanjiDetails.json')
      .then(response => response.json())
      .then(data => {
        const history = JSON.parse(localStorage.getItem('kanjiHistory')) || {};

        // Separate kanji with no attempts
        const noAttempts = data.filter(kanji => !history[kanji.kanji]);
        const withAttempts = data.filter(kanji => history[kanji.kanji]);

        // Sort kanji with attempts based on a simple SRS algorithm
        const sortedWithAttempts = withAttempts.sort((a, b) => {
          const aAttempts = history[a.kanji];
          const bAttempts = history[b.kanji];

          const aCorrectCount = aAttempts.filter(attempt => attempt.correct).length;
          const bCorrectCount = bAttempts.filter(attempt => attempt.correct).length;

          const aLastIncorrect = aAttempts.filter(attempt => !attempt.correct)[aAttempts.length - 1];
          const bLastIncorrect = bAttempts.filter(attempt => !attempt.correct)[bAttempts.length - 1];

          if (aCorrectCount !== bCorrectCount) {
            return aCorrectCount - bCorrectCount; // Fewer correct attempts first
          }

          if (!aLastIncorrect) {
            return 1
          }
          if (!bLastIncorrect) {
            return -1;
          }

          return new Date(bLastIncorrect.time) - new Date(aLastIncorrect.time); // More recent incorrect attempts first
        });

        // Combine the two arrays
        const sortedData = [...noAttempts, ...sortedWithAttempts];

        setKanjiData(sortedData);
      })
      .catch(error => console.error('Error fetching kanji details:', error));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        showDetails ? handleCorrect() : advance();
      }
      if(event.key === 'ArrowDown' && showDetails){
        handleIncorrect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetails, kanjiData]);

  useEffect(() => {
    if (kanjiData.length > 0) {
      const currentKanji = kanjiData[currentIndex].kanji;
      const history = JSON.parse(localStorage.getItem('kanjiHistory')) || {};
      setAttemptHistory(history[currentKanji] || []);
    }
  }, [currentIndex, kanjiData]);

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const advance = () => {
    setShowDetails(!showDetails);
    if (showDetails) {
      setCurrentIndex((currentIndex + 1) % kanjiData.length);
    }
  };

  const flashScreen = async (color) => {
    const body = document.body;
    body.style.transition = 'background-color 0.5s ease';
    body.style.backgroundColor = color;
    await new Promise(resolve => setTimeout(resolve, 200));
    body.style.backgroundColor = ''; // Reset to original color
  };

  const saveAttempt = (kanji, correct) => {
    const history = JSON.parse(localStorage.getItem('kanjiHistory')) || {};
    const attempts = history[kanji] || [];
    attempts.push({ time: new Date().toISOString(), correct });
    history[kanji] = attempts;
    localStorage.setItem('kanjiHistory', JSON.stringify(history));
  };

  const handleCorrect = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    saveAttempt(currentKanji, true);
    await flashScreen('green');
    advance();
  };

  const handleIncorrect = async () => {
    const currentKanji = kanjiData[currentIndex].kanji;
    saveAttempt(currentKanji, false);
    await flashScreen('red');
    advance();
  };

  if (kanjiData.length === 0) return <div>Loading...</div>;

  const currentKanji = kanjiData[currentIndex];

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div>{currentKanji.meaning}</div>
      {showDetails && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '100px' }}>{currentKanji.kanji}</div>
          <img src={currentKanji.imagePath} alt={`Stroke order for ${currentKanji.kanji}`} style={{ maxWidth: '100px' }} />
          <div>Readings: {currentKanji.readings.join(', ')}</div>
          
          <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
            <div style={{ marginBottom: '10px' }}>Previous Attempts:</div>
            {attemptHistory.map((attempt, index) => (
              <span key={index} style={{ color: attempt.correct ? 'green' : 'red' }}>
                {attempt.correct ? '✔️' : '❌'}
              </span>
            ))}
          </div>

          <button 
            onClick={handleIncorrect} 
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              marginLeft: '10px', 
              backgroundColor: 'red', // Color for incorrect
              color: 'white' 
            }}
          >
            Incorrect
          </button>
          
          <button 
            onClick={handleCorrect} 
            style={{ 
              marginLeft: '10px',
              marginTop: '20px', 
              padding: '10px 20px', 
              backgroundColor: 'green', // Color for correct
              color: 'white' 
            }}
          >
            Correct
          </button>
        </div>
      )}
      {!showDetails && (
        <button onClick={advance} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Show Details
        </button>
      )}
    </div>
  );
};

export default KanjiViewer;
