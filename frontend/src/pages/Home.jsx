import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    const res = await fetch(`/api/lyrics/${query}`);
    const data = await res.json();
    setResults(data.message?.body?.track_list || []);
  };

  return (
    <div>
      <h1>Tune Detective</h1>
      <SearchBar onSearch={handleSearch} />
      <ul>
        {results.map((track, i) => (
          <li key={i}>{track.track.track_name} - {track.track.artist_name}</li>
        ))}
      </ul>
    </div>
  );
}