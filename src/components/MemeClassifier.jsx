import { useState } from 'react';
import { classifyMeme } from "../lib/classifier";

const MemeClassifier = () => {
  const [memeCount, setMemeCount] = useState(3);
  const [memes, setMemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAndClassifyMemes = async () => {
    if (memeCount < 1 || memeCount > 10) {
      setError('Please enter a number between 1 and 10');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMemes([]);

    const uniqueUrls = new Set();
    const maxAttempts = memeCount * 2;
    let attempts = 0;

    try {
      while (uniqueUrls.size < memeCount && attempts < maxAttempts) {
        attempts++;
        try {
          const response = await fetch('https://meme-api.com/gimme');
          const data = await response.json();

          if (data.url && !uniqueUrls.has(data.url)) {
            uniqueUrls.add(data.url);

            const newMeme = {
              id: `meme-${Date.now()}-${uniqueUrls.size}`,
              url: data.url,
              classifications: null,
              isLoading: true
            };
            setMemes(prev => [...prev, newMeme]);

            const classifications = await classifyMeme(data.url);
            const sortedResults = [...classifications].sort((a, b) => b.score - a.score);
            const topResult = sortedResults[0];

            setMemes(prev => prev.map(meme =>
              meme.id === newMeme.id
                ? { ...meme, classifications, topResult, isLoading: false }
                : meme
            ));
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error('Error fetching/classifying meme:', err);
        }
      }

      if (uniqueUrls.size < memeCount) {
        setError(`Only found ${uniqueUrls.size} unique memes after ${attempts} attempts.`);
      }
    } catch (err) {
      setError('Failed to fetch and classify memes. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Meme Emotion Analysis</h1>

      {/* Controls */}
      <div className="card mb-5 shadow-sm">
        <div className="card-body">
          <div className="row align-items-center justify-content-center g-3 mb-3">
            <div className="col-auto">
              <label htmlFor="memeCount" className="form-label fw-medium">
                Number of memes to analyze (1-10):
              </label>
            </div>
            <div className="col-auto">
              <input
                id="memeCount"
                type="number"
                min="1"
                max="10"
                value={memeCount}
                onChange={(e) =>
                  setMemeCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="form-control"
                style={{ width: '80px' }}
              />
            </div>
            <div className="col-auto">
              <button
                onClick={fetchAndClassifyMemes}
                disabled={isLoading}
                className={`btn ${isLoading ? 'btn-secondary' : 'btn-danger'}`}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Memes'}
              </button>
            </div>
          </div>
          {error && <div className="text-danger fw-semibold">{error}</div>}
        </div>
      </div>

      {/* Results */}
      {memes.length > 0 && (
        <h2 className="text-center mb-4">{memes.length} Memes Analyzed</h2>
      )}

      <div className="row g-4">
        {memes.map((meme) => (
          <div key={meme.id} className="col-sm-6 col-lg-4">
            <div className="card h-100 shadow-sm position-relative">
              {/* Overlay */}
              {meme.isLoading && (
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white fw-bold z-3">
                  Analyzing...
                </div>
              )}

              {/* Meme image */}
              <img
                src={meme.url}
                alt="Meme"
                className={`card-img-top ${meme.isLoading ? 'blur-sm' : ''}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300x300?text=Failed+to+load+meme';
                }}
              />

              {/* Classification */}
              {meme.classifications && (
                <div className="card-body">
                  <h5 className="card-title">All Classifications</h5>
                  <ul className="list-group list-group-flush small">
                    {meme.classifications
                      .sort((a, b) => b.score - a.score)
                      .map((result, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between">
                          <span>{result.label}</span>
                          <span className="fw-semibold">{Math.round(result.score * 100)}%</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemeClassifier;
