import React, { useState, useRef } from 'react';
import { SafeAreaView, Text, Button, TextInput, View, StyleSheet } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';

export default function App() {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [training, setTraining] = useState({ title: '', artist: '' });
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const startRecording = async () => {
    const path = 'record.mp4';
    await audioRecorderPlayer.startRecorder(path);
    setRecording(true);
  };

  const stopRecording = async () => {
    const resultPath = await audioRecorderPlayer.stopRecorder();
    setRecording(false);

    const formData = new FormData();
    formData.append('audio', {
      uri: `file://${resultPath}`,
      type: 'audio/mp4',
      name: 'record.mp4'
    });

    try {
      const res = await axios.post('http://localhost:5000/api/record', formData);
      setResult(res.data.acoustidResult || { source: 'none' });
    } catch (err) {
      console.error(err);
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎵 Tune Detective</Text>

      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
        color="#E65100"
      />

      {result && (
        <View style={styles.resultBox}>
          <Text>Title: {result.title || 'N/A'}</Text>
          <Text>Artist: {result.artist || 'N/A'}</Text>
          <Text>Source: {result.source}</Text>

          <TextInput
            placeholder="Song Title"
            style={styles.input}
            value={training.title}
            onChangeText={text => setTraining({ ...training, title: text })}
          />
          <TextInput
            placeholder="Artist"
            style={styles.input}
            value={training.artist}
            onChangeText={text => setTraining({ ...training, artist: text })}
          />
          <Button title="Save" onPress={handleTrain} color="#582C83" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#582C83' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#E65100', marginBottom: 20 },
  resultBox: { marginTop: 20, width: '100%', padding: 16, backgroundColor: 'white', borderRadius: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 5, borderRadius: 5 }
});
