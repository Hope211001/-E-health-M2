import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams,Href } from 'expo-router'; // ✅ Ajout de useLocalSearchParams
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../../api/firebase';
import { patientService } from '../../../api/patientService';
import { prescriptionController } from '../../../controller/prescriptionController';
import { Patient } from '../../../types/collection';
import { APP_ROUTES } from '../../../constants/routes';

export default function AjoutOrdonnance() {
  const router = useRouter();
  const params = useLocalSearchParams(); // ✅ Récupère les paramètres (patientId, patientName)

  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); // Pour le chargement initial du patient

  // --- ÉTATS RECHERCHE PATIENT ---
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- ÉTATS FORMULAIRE ---
  const [diagnostic, setDiagnostic] = useState('');
  const [medicaments, setMedicaments] = useState<any[]>([
    { nomMedicament: '', dosage: '', frequence: '', duree: '' }
  ]);

  // ✅ EFFET 1 : Gestion de l'auto-sélection si on vient de la liste
  useEffect(() => {
    if (params.patientId) {
      loadSelectedPatient(params.patientId as string);
    }
  }, [params.patientId]);

  const loadSelectedPatient = async (id: string) => {
    setIsInitialLoading(true);
    try {
      // On récupère les infos complètes du patient via son ID
      const p = await patientService.getPatientById(id); // Assure-toi que cette méthode existe dans ton service
      if (p) {
        setSelectedPatient(p);
        setSearchQuery(p.numeroPatient);
      }
    } catch (error) {
      console.error("Erreur auto-selection:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // ✅ EFFET 2 : LOGIQUE DE RECHERCHE MANUELLE
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // On ne lance la recherche que si on n'a pas déjà un patient sélectionné 
      // et que le texte a changé manuellement
      if (searchQuery.length >= 3 && !selectedPatient) {
        setIsSearching(true);
        const pts = await patientService.searchPatientByNumero(searchQuery);
        setResults(pts);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedPatient]);

  // GESTION MÉDICAMENTS
  const addMed = () => {
    setMedicaments([...medicaments, { nomMedicament: '', dosage: '', frequence: '', duree: '' }]);
  };

  const removeMed = (index: number) => {
    if (medicaments.length > 1) {
      const newMeds = medicaments.filter((_, i) => i !== index);
      setMedicaments(newMeds);
    }
  };

  const updateMed = (index: number, field: string, value: string) => {
    const newMeds = [...medicaments];
    newMeds[index][field] = value;
    setMedicaments(newMeds);
  };

  // SOUMISSION
  const handleSave = async () => {
    if (!selectedPatient) return Alert.alert("Attention", "Veuillez sélectionner un patient.");
    if (!diagnostic) return Alert.alert("Attention", "Le diagnostic est obligatoire.");

    setLoading(true);
    const res = await prescriptionController.submitOrdonnance(
      auth.currentUser?.uid!,
      selectedPatient.userId,
      diagnostic,
      medicaments
    );
    setLoading(false);

    if (res.success) {
      Alert.alert("Succès", "L'ordonnance a été générée avec succès.");
      router.back();
    } else {
      Alert.alert("Erreur", res.message);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Préparation du dossier patient...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Nouvelle Ordonnance</Text>
        </View>

        {/* SECTION PATIENT */}
        <View style={styles.sectionCard}>
          <Text style={styles.label}>Patient</Text>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={[styles.input, selectedPatient && styles.inputSelected]}
              placeholder="Rechercher par N° de dossier..."
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                if (selectedPatient) setSelectedPatient(null);
              }}
            />
            {isSearching && <ActivityIndicator style={styles.loader} size="small" color="#7C3AED" />}
            {selectedPatient && (
              <TouchableOpacity onPress={() => { setSelectedPatient(null); setSearchQuery(''); }} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* LISTE DES RÉSULTATS */}
          {results.length > 0 && (
            <View style={styles.resultsDropdown}>
              {results.map((p) => (
                <TouchableOpacity
                  key={p.userId}
                  style={styles.resultItem}
                  onPress={() => {
                    setSelectedPatient(p);
                    setSearchQuery(p.numeroPatient);
                    setResults([]);
                  }}
                >
                  <Ionicons name="person" size={16} color="#7C3AED" />
                  <Text style={styles.resultText}>{p.numeroPatient} - {p.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedPatient && (
            <View style={styles.patientBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.patientBadgeText}>Patient sélectionné</Text>
                <Text style={styles.patientSubText}>{selectedPatient.email}</Text>
              </View>
            </View>
          )}
        </View>

        {/* SECTION DIAGNOSTIC */}
        <View style={styles.sectionCard}>
          <Text style={styles.label}>Diagnostic / Observations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez les symptômes ou le diagnostic..."
            multiline
            numberOfLines={4}
            value={diagnostic}
            onChangeText={setDiagnostic}
          />
        </View>

        {/* SECTION MÉDICAMENTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Médicaments</Text>
          <TouchableOpacity onPress={addMed} style={styles.btnAddSmall}>
            <Ionicons name="add" size={20} color="#7C3AED" />
            <Text style={styles.btnAddSmallText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {medicaments.map((med, index) => (
          <View key={index} style={styles.medCard}>
            <View style={styles.medHeader}>
              <View style={styles.medIndexBadge}>
                <Text style={styles.medIndexText}>{index + 1}</Text>
              </View>
              {medicaments.length > 1 && (
                <TouchableOpacity onPress={() => removeMed(index)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Nom du médicament</Text>
              <TextInput
                style={styles.inputMed}
                placeholder="ex: Amoxicilline"
                value={med.nomMedicament}
                onChangeText={(v) => updateMed(index, 'nomMedicament', v)}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.subLabel}>Dosage</Text>
                <TextInput
                  style={styles.inputMed}
                  placeholder="ex: 1g"
                  value={med.dosage}
                  onChangeText={(v) => updateMed(index, 'dosage', v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Fréquence</Text>
                <TextInput
                  style={styles.inputMed}
                  placeholder="ex: Matin/Soir"
                  value={med.frequence}
                  onChangeText={(v) => updateMed(index, 'frequence', v)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Durée (en jours)</Text>
              <TextInput
                style={styles.inputMed}
                placeholder="7"
                keyboardType="numeric"
                value={med.duree}
                onChangeText={(v) => updateMed(index, 'duree', v)}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btnSubmit, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="checkmark-done-circle" size={22} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.btnSubmitText}>Confirmer l'ordonnance</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, marginRight: 15, elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

  sectionCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10 },

  searchWrapper: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  clearBtn: { position: 'absolute', right: 12, zIndex: 1 },
  loader: { position: 'absolute', right: 40 },

  input: { backgroundColor: '#F1F5F9', padding: 14, paddingLeft: 40, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#1E293B' },
  inputSelected: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  textArea: { height: 100, textAlignVertical: 'top', paddingLeft: 14 },

  resultsDropdown: { backgroundColor: '#FFF', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', elevation: 5 },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultText: { marginLeft: 10, color: '#1E293B', fontWeight: '500' },

  patientBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  patientBadgeText: { color: '#166534', fontWeight: 'bold', fontSize: 14 },
  patientSubText: { color: '#166534', fontSize: 12, opacity: 0.8 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

  medCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  medIndexBadge: { backgroundColor: '#EDE9FE', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  medIndexText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 14 },

  inputGroup: { marginBottom: 12 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 5, marginLeft: 4 },
  inputMed: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 12 },

  btnAddSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  btnAddSmallText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },

  btnSubmit: { backgroundColor: '#7C3AED', flexDirection: 'row', padding: 20, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 10 },
  btnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});