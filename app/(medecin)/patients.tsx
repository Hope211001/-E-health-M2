import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { db } from '../../api/firebase'; // Import de la base de données Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Fonctions Firestore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Définition du type Patient (Bonne pratique pour le développement pro)
interface Patient {
  id: string;
  nom: string;
  email: string;
  role: string;
}

export default function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([]); // État pour stocker la liste
  const [loading, setLoading] = useState(true); // État pour l'indicateur de chargement
  const [search, setSearch] = useState(''); // État pour la barre de recherche
  const router = useRouter();

  // useEffect : S'exécute dès que la page s'affiche
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fonction pour récupérer les patients dans Firestore
  const fetchPatients = async () => {
    try {
      // On crée une requête : Chercher dans la collection "users" où le rôle est "patient"
      const q = query(collection(db, "users"), where("role", "==", "patient"));
      
      const querySnapshot = await getDocs(q);
      const patientList: Patient[] = [];
      
      // On parcourt les résultats pour les mettre dans un tableau
      querySnapshot.forEach((doc) => {
        patientList.push({ id: doc.id, ...doc.data() } as Patient);
      });

      setPatients(patientList); // On met à jour l'affichage
    } catch (error) {
      console.error("Erreur lors de la récupération des patients:", error);
    } finally {
      setLoading(false); // On arrête le chargement
    }
  };

  // Filtrage de la liste selon la recherche de l'utilisateur
  const filteredPatients = patients.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  // Design d'une "Carte" Patient pour la liste
  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => alert(`Ouvrir le dossier de ${item.nom}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nom.charAt(0)}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.patientName}>{item.nom}</Text>
        <Text style={styles.patientEmail}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchSection}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un patient..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Affichage pendant le chargement */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : (
        /* Liste performante (FlatList est recommandé pour les longues listes) */
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun patient trouvé.</Text>
          }
        />
      )}

      {/* Bouton flottant pour ajouter un patient (Facultatif) */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  
  // Style de la barre de recherche
  searchSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 2, // Ombre sur Android
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45 },

  // Style de la carte patient
  patientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  infoContainer: { flex: 1, marginLeft: 15 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  patientEmail: { fontSize: 14, color: '#7f8c8d' },

  // Bouton flottant (FAB)
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2ecc71',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' }
});