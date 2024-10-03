import React, { useState, useEffect } from 'react';

const KanjiViewer = () => {
  const [kanjiData, setKanjiData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('/kanjiDetails.json')
      .then(response => response.json())
      .then(data => setKanjiData(shuffle(data)))
      .catch(error => console.error('Error fetching kanji details:', error));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        advance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetails, kanjiData]);

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
        </div>
      )}
      <button onClick={advance} style={{ marginTop: '20px', padding: '10px 20px' }}>
        {showDetails ? 'Next Kanji' : 'Show Details'}
      </button>
    </div>
  );
};

export default KanjiViewer;
