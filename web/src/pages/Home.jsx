import React from "react";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-purple-900 text-white">
      <h1 className="text-4xl font-bold mb-4">🎵 Tune Detective</h1>
      <p className="mb-6">Hum, sing, or play to find your track</p>
      <button className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg">
        Start Recording
      </button>
    </div>
  );
}

export default Home;
