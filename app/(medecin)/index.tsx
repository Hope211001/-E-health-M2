import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../../api/firebase'; // Ajuste le chemin selon ton dossier api
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MedecinDashboard() {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Récupérer les infos du médecin connecté
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setDoctorData(docSnap.data());
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorInfo();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header avec Bienvenue */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bonjour,</Text>
        <Text style={styles.doctorName}>Dr. {doctorData?.nom || 'Chargement...'}</Text>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Patients suivis</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Ordonnances actives</Text>
        </View>
      </View>

      {/* Menu d'actions rapides */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      
      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(medecin)/patients')} // On ira créer cette page après
        >
          <Ionicons name="people" size={32} color="#3498db" />
          <Text style={styles.menuText}>Mes Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(medecin)/ajout_ordonnance')} // On ira créer cette page après
        >
          <Ionicons name="add-circle" size={32} color="#e67e22" />
          <Text style={styles.menuText}>Nouvelle Ordonnance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="calendar" size={32} color="#9b59b6" />
          <Text style={styles.menuText}>Rendez-vous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings" size={32} color="#7f8c8d" />
          <Text style={styles.menuText}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 40, marginBottom: 30 },
  welcomeText: { fontSize: 18, color: '#7f8c8d' },
  doctorName: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { flex: 1, padding: 20, borderRadius: 15, marginHorizontal: 5, elevation: 4 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#fff', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#34495e' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { 
    width: '48%', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  menuText: { marginTop: 10, fontWeight: '600', color: '#2c3e50' }
});