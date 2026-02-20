import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { auth } from '../../../api/firebase';
import { patientService } from '../../../api/patientService';
import { Patient } from '../../../types/collection';
import { APP_ROUTES } from '../../../constants/routes';

const { width } = Dimensions.get('window');

export default function ListePatients() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupération des patients depuis Firebase
  const fetchPatients = async () => {
    try {
      const medecinId = auth.currentUser?.uid;
      if (medecinId) {
        const data = await patientService.getPatientsByMedecin(medecinId);
        setPatients(data);
        setFilteredPatients(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des patients:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, []);

  // Logique de recherche
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(p =>
        p.numeroPatient.toLowerCase().includes(text.toLowerCase()) ||
        p.email.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      {/* SECTION HAUTE : Infos Patient */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.email.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.patientInfo}>
          <Text style={styles.numeroPatient}>{item.numeroPatient}</Text>
          <Text style={styles.patientEmail} numberOfLines={1}>{item.email}</Text>
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Suivi</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* SECTION BASSE : Actions Rapides */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.LISTE_BY_PATIENT as any,
            params: { patientId: item.userId, patientName: item.numeroPatient }
          } as any)}
        >
          <Ionicons name="journal-outline" size={18} color="#475569" />
          <Text style={styles.secondaryButtonText}>Historique</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT as any,
            params: { patientId: item.userId, patientName: item.numeroPatient }
          } as any)}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>Prescrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER MODERNE */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Espace Médecin</Text>
            <Text style={styles.headerTitle}>Mes Patients</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => router.push("/(medecin)/patients/add" as Href)}
          >
            <Ionicons name="person-add" size={22} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un numéro ou email..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7C3AED" size="large" />
          <Text style={styles.loadingText}>Chargement des dossiers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.userId}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={50} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Aucun patient</Text>
              <Text style={styles.emptySubtitle}>Commencez par ajouter votre premier patient pour effectuer une prescription.</Text>
            </View>
          }
        />
      )}

      {/* BOUTON FLOTTANT (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(medecin)/patients/add" as Href)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14 },
  
  // Header
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15, 
    marginBottom: 20 
  },
  headerSubtitle: { fontSize: 13, color: '#7C3AED', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  headerIconBtn: { backgroundColor: '#F5F3FF', padding: 12, borderRadius: 15 },
  
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B' },

  // Liste
  listContainer: { padding: 20, paddingBottom: 100 },
  
  // Card Patient
  patientCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 18 },
  patientInfo: { flex: 1, marginLeft: 15 },
  numeroPatient: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  patientEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDF4', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  statusText: { color: '#166534', fontSize: 11, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

  // Boutons Actions
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: { backgroundColor: '#7C3AED' },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  secondaryButton: { backgroundColor: '#F1F5F9' },
  secondaryButtonText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#7C3AED',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  }
});