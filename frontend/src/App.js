import React, { useState } from 'react';

function App() {
  const [lyrics, setLyrics] = useState("");
  const [result, setResult] = useState(null);

  const handleLyricsSearch = async () => {
    const res = await fetch('http://localhost:5000/api/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="App">
      <h1>Tune Detective</h1>
      <input
        type="text"
        placeholder="Enter lyrics..."
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
      />
      <button onClick={handleLyricsSearch}>Search</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default App;
