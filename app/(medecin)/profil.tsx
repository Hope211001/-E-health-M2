import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../api/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function ProfilScreen() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>
      <Text style={styles.info}>Email : {auth.currentUser?.email}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 16, marginBottom: 30 },
  button: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});