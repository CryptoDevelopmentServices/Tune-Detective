import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    const res = await fetch(`http://localhost:5000/api/search?q=${query}`);
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="min-h-screen bg-primaryPurple text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-primaryOrange">🎵 Tune Detective</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter song title or lyrics"
        className="border p-2 text-black rounded w-80 mb-4"
      />
      <button
        onClick={handleSearch}
        className="px-6 py-3 rounded-lg text-lg font-semibold bg-primaryOrange"
      >
        Search
      </button>

      {result && (
        <div className="mt-6 p-4 bg-white text-black rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold">Result</h2>
          <p>Title: {result.title || 'N/A'}</p>
          <p>Artist: {result.artist || 'N/A'}</p>
          <p>Source: {result.source}</p>
        </div>
      )}
    </div>
  );
}

export default App;
