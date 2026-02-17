import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { auth, db } from '../../api/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Medecin } from '../../types/collection';
import { APP_ROUTES } from '../../constants/routes';

export default function MedecinDashboard() {
  const [doctorData, setDoctorData] = useState<Medecin | null>(null);
  const [stats, setStats] = useState({ patients: 0, ordonnances: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "medecins", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDoctorData(docSnap.data() as Medecin);
          setStats({ patients: 12, ordonnances: 5 }); 
        }
      } catch (error) {
        console.error("Erreur Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header de bienvenue */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.doctorName}>
              Dr. {doctorData?.email.split('@')[0]} 
            </Text>
            <Text style={styles.speciality}>{doctorData?.specialite?.join(', ')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push(APP_ROUTES.MEDECIN.PROFIL as Href)}
          >
            <Ionicons name="person-circle" size={54} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Section Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#7C3AED' }]}>
            <Ionicons name="people-outline" size={24} color="#FFF" />
            <Text style={styles.statNumber}>{stats.patients}</Text>
            <Text style={styles.statLabel}>Patients suivis</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#A78BFA' }]}>
            <Ionicons name="document-text-outline" size={24} color="#FFF" />
            <Text style={styles.statNumber}>{stats.ordonnances}</Text>
            <Text style={styles.statLabel}>Ordonnances</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Gestion Cabinet</Text>
        
        <View style={styles.menuGrid}>
          {/* Correction des routes ici selon tes constantes */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people" size={28} color="#7C3AED" />
            </View>
            <Text style={styles.menuText}>Mes Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="add-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.menuText}>Prescrire</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>Rendez-vous</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => auth.signOut()}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out" size={28} color="#EF4444" />
            </View>
            <Text style={styles.menuText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 10
  },
  welcomeText: { fontSize: 16, color: '#64748B' },
  doctorName: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
  speciality: { fontSize: 14, color: '#7C3AED', fontWeight: '600', marginTop: 2 },
  profileButton: { padding: 2 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { 
    flex: 1, 
    padding: 18, 
    borderRadius: 24, 
    elevation: 4, 
    shadowColor: '#7C3AED', 
    shadowOpacity: 0.2, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#fff', opacity: 0.9, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1E293B', marginLeft: 5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { 
    width: '48%', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 24, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  iconCircle: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuText: { fontWeight: 'bold', color: '#475569', fontSize: 14 }
});