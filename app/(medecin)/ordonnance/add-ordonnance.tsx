import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ERREUR COURANTE : export const AddOrdonnance = () => { ... }
// CORRECTION ci-dessous :

export default function AddOrdonnance() {
  return (
    <View style={styles.container}>
      <Text>Ajouter une ordonnance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});