import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResultCard({ result }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Source: {result.source}</Text>
      <Text style={styles.text}>Title: {result.data.title}</Text>
      <Text style={styles.text}>Artist: {result.data.artist}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%', marginTop: 20 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  text: { color: '#333', fontSize: 14 }
});
