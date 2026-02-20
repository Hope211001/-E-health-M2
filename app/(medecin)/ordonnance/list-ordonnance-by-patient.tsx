import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionService } from '../../../api/prescriptionService';
import { APP_ROUTES } from '../../../constants/routes';

export default function HistoriquePrescriptions() {
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams(); // Récupérés depuis la liste des patients
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour charger l'historique
  const fetchHistory = async () => {
    try {
      if (patientId) {
        // Appel au service que nous avons mis à jour ensemble
        const data = await prescriptionService.getPrescriptionsByPatient(patientId as string);
        setPrescriptions(data);
      }
    } catch (error) {
      console.error("Erreur historique:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderPrescriptionItem = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.timelineItem}>
      {/* Ligne verticale (Design Timeline) */}
      <View style={styles.timelineLine}>
        <View style={styles.timelineDot} />
        {index !== prescriptions.length - 1 && <View style={styles.verticalLine} />}
      </View>

      {/* Carte cliquable pour voir les détails */}
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: APP_ROUTES.MEDECIN.ORDONNANCE.DETAIL as any,
          params: { id: item.id }
        } as any)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            {/* Utilisation de dateCreation car c'est le champ de ton service */}
            {item.dateCreation ? item.dateCreation.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) : 'Date inconnue'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
        </View>

        <Text style={styles.diagnosticLabel}>Diagnostic :</Text>
        <Text style={styles.diagnosticText} numberOfLines={2}>
            {item.diagnostic || "Aucun diagnostic renseigné"}
        </Text>

        <View style={styles.medicationBadgeContainer}>
          {item.medicaments?.slice(0, 3).map((med: any, i: number) => (
            <View key={i} style={styles.medBadge}>
              <Text style={styles.medBadgeText}>{med.nomMedicament}</Text>
            </View>
          ))}
          {item.medicaments?.length > 3 && (
            <Text style={styles.moreText}>+{item.medicaments.length - 3} plus</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER AVEC BOUTON RETOUR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSubtitle}>Historique de</Text>
          <Text style={styles.headerTitle}>{patientName || "Patient"}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{marginTop: 10, color: '#64748B'}}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderPrescriptionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#E2E8F0" />
              <Text style={styles.emptyText}>Aucune ordonnance trouvée</Text>
              <TouchableOpacity 
                style={styles.btnCreate}
                onPress={() => router.push({ 
                  pathname: "/(medecin)/ordonnances/add" as any, 
                  params: { patientId } 
                } as any)}
              >
                <Text style={styles.btnCreateText}>Créer la première</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { 
    padding: 8, 
    marginRight: 15, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12 
  },
  headerSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },

  listContent: { padding: 20 },

  // Design de la Timeline
  timelineItem: { flexDirection: 'row', marginBottom: 5 },
  timelineLine: { alignItems: 'center', marginRight: 15, width: 20 },
  timelineDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#7C3AED', 
    zIndex: 1,
    marginTop: 20
  },
  verticalLine: { 
    width: 2, 
    flex: 1, 
    backgroundColor: '#E2E8F0', 
    marginTop: -5 
  },

  // Style des Cartes d'ordonnances
  card: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10
  },
  dateText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  diagnosticLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  diagnosticText: { fontSize: 15, color: '#1E293B', marginTop: 4, lineHeight: 22 },

  medicationBadgeContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 15, 
    gap: 6,
    alignItems: 'center'
  },
  medBadge: { 
    backgroundColor: '#F5F3FF', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE'
  },
  medBadgeText: { color: '#7C3AED', fontSize: 11, fontWeight: '600' },
  moreText: { fontSize: 11, color: '#94A3B8', marginLeft: 5 },

  // État vide
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 },
  btnCreate: { 
    marginTop: 20, 
    backgroundColor: '#7C3AED', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12 
  },
  btnCreateText: { color: '#FFF', fontWeight: 'bold' }
});