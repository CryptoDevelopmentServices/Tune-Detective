import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function RecordButton({ setResult, setError }) {
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    setResult(null);
    setError(null);
    await audioRecorderPlayer.startRecorder();
    setRecording(true);
  };

  const stopRecording = async () => {
    const uri = await audioRecorderPlayer.stopRecorder();
    setRecording(false);

    const formData = new FormData();
    formData.append('audio', { uri, type: 'audio/wav', name: 'recording.wav' });

    try {
      const res = await axios.post('http://10.0.2.2:5000/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError("Failed to identify song");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.listenButton, recording && styles.listening]}
      onPress={recording ? stopRecording : startRecording}
    >
      <Text style={styles.listenText}>{recording ? "🛑" : "🎵"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listenButton: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#E65100', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  listening: { backgroundColor: '#ff7043' },
  listenText: { fontSize: 50, color: '#fff' }
});
