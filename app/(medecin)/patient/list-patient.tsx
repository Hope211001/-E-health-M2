import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TextInput, 
  TouchableOpacity, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { auth } from '../../../api/firebase';
import { patientService } from '../../../api/patientService';
import { Patient } from '../../../types/collection';
import { APP_ROUTES } from '../../../constants/routes';

export default function ListePatients() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const medecinId = auth.currentUser?.uid;
      if (medecinId) {
        const data = await patientService.getPatientsByMedecin(medecinId);
        setPatients(data);
        setFilteredPatients(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Logique de recherche locale par Numero de Patient
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
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => {
        // Optionnel : rediriger vers le détail ou directement vers nouvelle ordonnance
        router.push(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href);
      }}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.email.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.patientInfo}>
        <Text style={styles.numeroPatient}>{item.numeroPatient}</Text>
        <Text style={styles.patientEmail}>{item.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Patient suivi</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Recherche */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Patients</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par N° Patient..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#7C3AED" size="large" />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.userId}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E2E8F0" />
              <Text style={styles.emptyText}>Aucun patient trouvé</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 15, 
    borderRadius: 12,
    height: 50
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B' },
  listContent: { padding: 20 },
  patientCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  avatarContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#EDE9FE', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 16 },
  patientInfo: { flex: 1, marginLeft: 15 },
  numeroPatient: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  patientEmail: { fontSize: 14, color: '#64748B', marginTop: 2 },
  badge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#F0FDF4', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginTop: 5 
  },
  badgeText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 }
});