import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../../api/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import AppHeader from '../../../../components/AppHeader';

export default function ProfilScreen() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Mon profil" />
      <View style={styles.container}>
        <Text style={styles.title}>Mon Profil</Text>
        <Text style={styles.info}>Email : {auth.currentUser?.email}</Text>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 16, marginBottom: 30 },
  button: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});