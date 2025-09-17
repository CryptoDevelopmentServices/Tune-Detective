import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [training, setTraining] = useState({ title: '', artist: '' });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = e => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', blob, 'record.wav');
      try {
        const res = await axios.post('http://localhost:5000/api/record', formData);
        setResult(res.data.acoustidResult || { source: 'none' });
      } catch (err) {
        console.error(err);
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);
    setTimeout(() => stopRecording(), 15000); // stop after 15s
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTrain = async () => {
    if (!result.fingerprint) return;
    try {
      await axios.post('http://localhost:5000/api/train', {
        fingerprint: result.fingerprint,
        title: training.title,
        artist: training.artist
      });
      alert('Training data saved!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-primaryPurple text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-primaryOrange">🎵 Tune Detective</h1>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg text-lg font-semibold ${recording ? 'bg-red-600' : 'bg-primaryOrange'}`}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-white text-black rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold">Result</h2>
          <p>Title: {result.title || 'N/A'}</p>
          <p>Artist: {result.artist || 'N/A'}</p>
          <p>Source: {result.source}</p>

          <div className="mt-4">
            <h3 className="font-semibold">Training Mode</h3>
            <input
              type="text"
              placeholder="Song Title"
              className="border p-2 w-full my-1"
              value={training.title}
              onChange={e => setTraining({ ...training, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Artist"
              className="border p-2 w-full my-1"
              value={training.artist}
              onChange={e => setTraining({ ...training, artist: e.target.value })}
            />
            <button onClick={handleTrain} className="mt-2 bg-primaryOrange px-4 py-2 rounded">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
