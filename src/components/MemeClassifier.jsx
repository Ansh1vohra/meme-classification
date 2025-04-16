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
            
            // Add meme to state immediately (with loading state)
            const newMeme = {
              id: `meme-${Date.now()}-${uniqueUrls.size}`,
              url: data.url,
              classifications: null,
              isLoading: true
            };
            setMemes(prev => [...prev, newMeme]);

            // Classify the meme
            const classifications = await classifyMeme(data.url);
            const sortedResults = [...classifications].sort((a, b) => b.score - a.score);
            const topResult = sortedResults[0];
            
            // Update the meme with classifications
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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Meme Classifier</h1>
      
      {/* Controls */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="memeCount" style={{ marginRight: '10px' }}>
            Number of memes to analyze (1-10):
          </label>
          <input
            id="memeCount"
            type="number"
            min="1"
            max="10"
            value={memeCount}
            onChange={(e) => setMemeCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{ padding: '5px', marginRight: '10px', width: '60px' }}
          />
          <button 
            onClick={fetchAndClassifyMemes} 
            disabled={isLoading}
            style={{ 
              padding: '8px 20px', 
              backgroundColor: isLoading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Memes'}
          </button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>

      {/* Results */}
      <div style={{ marginTop: '30px' }}>
        {memes.length > 0 && (
          <h2>Results ({memes.length} memes analyzed)</h2>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {memes.map((meme) => (
            <div 
              key={meme.id}
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Loading overlay */}
              {meme.isLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 10
                }}>
                  Analyzing...
                </div>
              )}

              {/* Meme image */}
              <img 
                src={meme.url} 
                alt="Meme" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                  filter: meme.isLoading ? 'blur(2px)' : 'none'
                }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/300x300?text=Failed+to+load+meme';
                }}
              />

              {/* Classification results */}
              {meme.classifications && (
                <div style={{ padding: '15px' }}>
                  <h3 style={{ marginTop: 0 }}>
                    {/* Top Classification:  */}
                    <span style={{ 
                      color: '#007bff',
                      marginLeft: '8px'
                    }}>
                      {/* {meme.topResult.label} ({Math.round(meme.topResult.score * 100)}%) */}
                    </span>
                  </h3>
                  
                  <div style={{ marginTop: '10px' }}>
                    <h4>All classifications:</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                      {meme.classifications
                        .sort((a, b) => b.score - a.score)
                        .map((result, index) => (
                          <li key={index}>
                            {result.label}: {Math.round(result.score * 100)}%
                          </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemeClassifier;