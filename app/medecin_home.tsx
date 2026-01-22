import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../api/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function MedecinHome() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.replace('/'); // Retour à la page de connexion
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Espace Médecin</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => alert("Fonctionnalité : Liste des patients bientôt disponible")}
        >
          <Text style={styles.cardTitle}>👥 Mes Patients</Text>
          <Text>Gérer les dossiers et ordonnances</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#e8f5e9' }]}
          onPress={() => alert("Bientôt : Créer une ordonnance")}
        >
          <Text style={styles.cardTitle}>💊 Nouvelle Ordonnance</Text>
          <Text>Ajouter un suivi médicament</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: '#ffcdd2', borderRadius: 5 },
  logoutText: { color: '#c62828', fontWeight: 'bold' },
  menu: { marginTop: 30 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 }
});