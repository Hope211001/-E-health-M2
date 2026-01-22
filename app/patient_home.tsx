import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../api/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function PatientHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Suivi Médical</Text>
      
      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>🔔 Prochaine prise :</Text>
        <Text style={styles.medText}>Paracétamol - 20h00</Text>
      </View>

      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={() => { signOut(auth); router.replace('/'); }}
      >
        <Text>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e3f2fd' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  alertCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#2196f3' },
  alertTitle: { fontSize: 18, color: '#1976d2', fontWeight: 'bold' },
  medText: { fontSize: 20, marginTop: 10 },
  logoutBtn: { marginTop: 50, alignItems: 'center' }
});