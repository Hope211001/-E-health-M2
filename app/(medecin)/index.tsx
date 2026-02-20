import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs, count } from 'firebase/firestore';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Medecin } from '../../types/collection';
import { APP_ROUTES } from '../../constants/routes';

const { width } = Dimensions.get('window');

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

        // 1. Récupérer les infos du docteur
        const docRef = doc(db, "medecins", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDoctorData(docSnap.data() as Medecin);
        }

        // 2. RÉCUPÉRER LES STATS DYNAMIQUES
        // Compter les patients liés à ce médecin
        const patientsQuery = query(collection(db, "patients"), where("medecinId", "==", user.uid));
        const patientsSnap = await getDocs(patientsQuery);

        // Compter les ordonnances créées par ce médecin
        const prescriptionsQuery = query(collection(db, "prescriptions"), where("medecinId", "==", user.uid));
        const prescriptionsSnap = await getDocs(prescriptionsQuery);

        setStats({
          patients: patientsSnap.size,
          ordonnances: prescriptionsSnap.size
        });

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
        <Text style={{ marginTop: 10, color: '#7C3AED' }}>Chargement de l'espace santé...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header de bienvenue stylisé */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Ravi de vous revoir,</Text>
            <Text style={styles.doctorName}>
              Dr. {doctorData?.nom || doctorData?.email.split('@')[0]}
            </Text>
            <View style={styles.specialityBadge}>
              <Text style={styles.specialityText}>{doctorData?.specialite || 'Généraliste'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => router.push(APP_ROUTES.MEDECIN.PROFIL as Href)}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{doctorData?.nom?.substring(0, 1) || 'D'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Stats - Design Premium */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#7C3AED' }]}
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
          >
            <View style={styles.statIconBg}>
              <Ionicons name="people" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>{stats.patients}</Text>
            <Text style={styles.statLabel}>Patients suivis</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.4)" style={styles.statArrow} />
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.statIconBg}>
              <Ionicons name="document-text" size={20} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{stats.ordonnances}</Text>
            <Text style={styles.statLabel}>Ordonnances</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Services rapides</Text>

        <View style={styles.menuGrid}>
          <MenuButton
            title="Mes Patients"
            icon="people"
            color="#7C3AED"
            bgColor="#F5F3FF"
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
          />
          <MenuButton
            title="Nouvelle Prescription"
            icon="add-circle"
            color="#10B981"
            bgColor="#F0FDF4"
            onPress={() => router.push(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href)}
          />
          <MenuButton
            title="Rendez-vous"
            icon="calendar"
            color="#3B82F6"
            bgColor="#EFF6FF"
            onPress={() => { }}
          />
          <MenuButton
            title="Mon Profil"
            icon="settings"
            color="#64748B"
            bgColor="#F8FAFC"
            onPress={() => router.push(APP_ROUTES.MEDECIN.PROFIL as Href)}
          />
        </View>

        {/* Banner Déconnexion discrète */}
        <TouchableOpacity style={styles.logoutBanner} onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter de la session</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Composant interne pour les boutons du menu
function MenuButton({ title, icon, color, bgColor, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' }, // Fond plus clair et moderne
  scrollContainer: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10
  },
  welcomeText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  doctorName: { fontSize: 26, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  specialityBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 5,
    alignSelf: 'flex-start'
  },
  specialityText: { fontSize: 12, color: '#7C3AED', fontWeight: 'bold' },

  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF',
    padding: 3,
    elevation: 5,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },

  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 35 },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    position: 'relative',
    overflow: 'hidden'
  },
  statIconBg: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 13, color: '#fff', opacity: 0.9, fontWeight: '600' },
  statArrow: { position: 'absolute', right: 10, top: 10 },

  sectionTitle: { fontSize: 19, fontWeight: '800', marginBottom: 20, color: '#1E293B' },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: {
    width: (width - 55) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10
  },
  iconCircle: { width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  menuText: { fontWeight: '700', color: '#475569', fontSize: 14, textAlign: 'center' },

  logoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 20,
    gap: 10
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 }
});