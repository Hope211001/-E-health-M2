import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Rappel(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rappel</Text>
      <Text>Liste</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' }
});