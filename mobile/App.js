import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView } from 'react-native';

export default function App() {
  const [lyrics, setLyrics] = useState("");
  const [result, setResult] = useState(null);

  const handleLyricsSearch = async () => {
    const res = await fetch('http://10.0.2.2:5000/api/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tune Detective</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter lyrics..."
        value={lyrics}
        onChangeText={setLyrics}
      />
      <Button title="Search" onPress={handleLyricsSearch} />
      <ScrollView>
        {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, width: '100%', marginBottom: 10 }
});
