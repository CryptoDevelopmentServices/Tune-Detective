import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RecordButton from './components/RecordButton';
import ResultCard from './components/ResultCard';

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  return (
    <View style={styles.container}>
      <RecordButton setResult={setResult} setError={setError} />
      {error && <Text style={styles.error}>{error}</Text>}
      {result && <ResultCard result={result} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#582C83', alignItems: 'center', justifyContent: 'center' },
  error: { color: 'red', marginTop: 20 }
});
