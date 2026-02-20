import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionService } from '../../../api/prescriptionService';

export default function DetailPrescription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ord, setOrd] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    const data = await prescriptionService.getPrescriptionById(id as string);
    setOrd(data);
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /></View>;
  if (!ord) return <View style={styles.center}><Text>Ordonnance introuvable</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails Ordonnance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Date & Statut */}
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.label}>Date de prescription</Text>
            <Text style={styles.value}>
              {ord.dateCreation?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{ord.statut?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Diagnostic */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pulse" size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Diagnostic & Observations</Text>
          </View>
          <Text style={styles.diagnosticContent}>{ord.diagnostic}</Text>
        </View>

        {/* Liste Médicaments */}
        <Text style={styles.medicationMainTitle}>Traitements prescrits</Text>
        
        {ord.medicaments?.map((med: any, index: number) => (
          <View key={index} style={styles.medCard}>
            <View style={styles.medIconContainer}>
               <Ionicons name="medical" size={24} color="#7C3AED" />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{med.nomMedicament}</Text>
              <View style={styles.medDetailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dosage</Text>
                  <Text style={styles.detailValue}>{med.dosage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Fréquence</Text>
                  <Text style={styles.detailValue}>{med.frequence}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{med.duree} Jours</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Footer info */}
        <View style={styles.footerInfo}>
           <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
           <Text style={styles.footerText}>
             Traitement du {ord.dateDebut?.toLocaleDateString()} au {ord.dateFin?.toLocaleDateString()}
           </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  
  scrollContent: { padding: 20 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  
  statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },

  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 25 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { marginLeft: 10, fontSize: 16, fontWeight: '700', color: '#1E293B' },
  diagnosticContent: { fontSize: 15, color: '#475569', lineHeight: 24 },

  medicationMainTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  medCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  medIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  medInfo: { flex: 1 },
  medName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  
  medDetailsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 2 },

  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, opacity: 0.6 },
  footerText: { marginLeft: 6, fontSize: 12, color: '#64748B' }
});