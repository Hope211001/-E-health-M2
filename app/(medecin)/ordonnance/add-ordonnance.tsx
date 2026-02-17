import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../../api/firebase';
import { patientService } from '../../../api/patientService';
import { prescriptionController } from '../../../controller/prescriptionController';
import { Patient, Medicament } from '../../../types/collection';

export default function AjoutOrdonnance() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  // LOGIQUE DE RECHERCHE (Debounce de 500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled" // Important pour cliquer sur les résultats
      >
        <Text style={styles.title}>Nouvelle Ordonnance</Text>

        {/* SECTION PATIENT */}
        <View style={styles.sectionCard}>
          <Text style={styles.label}>Patient (Recherche par N° de dossier)</Text>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput 
              style={[styles.input, selectedPatient && styles.inputSelected]} 
              placeholder="Ex: PAT-2024..." 
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                if (selectedPatient) setSelectedPatient(null);
              }}
            />
            {isSearching && <ActivityIndicator style={styles.loader} size="small" color="#7C3AED" />}
          </View>

          {/* LISTE DES RÉSULTATS (SELECT2 STYLE) */}
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
              <Text style={styles.patientBadgeText}>Patient confirmé : {selectedPatient.email}</Text>
            </View>
          )}
        </View>

        {/* SECTION DIAGNOSTIC */}
        <View style={styles.sectionCard}>
          <Text style={styles.label}>Diagnostic / Observations</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Saisissez le diagnostic..." 
            multiline
            numberOfLines={3}
            value={diagnostic}
            onChangeText={setDiagnostic}
          />
        </View>

        {/* SECTION MÉDICAMENTS */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={styles.sectionTitle}>Médicaments</Text>
            <TouchableOpacity onPress={addMed} style={styles.btnAddSmall}>
                <Ionicons name="add" size={20} color="#7C3AED" />
                <Text style={styles.btnAddSmallText}>Ajouter</Text>
            </TouchableOpacity>
        </View>

        {medicaments.map((med, index) => (
          <View key={index} style={styles.medCard}>
            <View style={styles.medHeader}>
                <Text style={styles.medNumber}>Médicament #{index + 1}</Text>
                {medicaments.length > 1 && (
                    <TouchableOpacity onPress={() => removeMed(index)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Nom du médicament (ex: Paracétamol)" 
              value={med.nomMedicament}
              onChangeText={(v) => updateMed(index, 'nomMedicament', v)}
            />
            
            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.subLabel}>Dosage</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="500mg" 
                  value={med.dosage}
                  onChangeText={(v) => updateMed(index, 'dosage', v)}
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.subLabel}>Fréquence</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="3x / jour" 
                  value={med.frequence}
                  onChangeText={(v) => updateMed(index, 'frequence', v)}
                />
              </View>
            </View>

            <Text style={styles.subLabel}>Durée du traitement (jours)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="7" 
              keyboardType="numeric"
              value={med.duree}
              onChangeText={(v) => updateMed(index, 'duree', v)}
            />
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.btnSubmit, loading && {opacity: 0.7}]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="document-text" size={20} color="#FFF" style={{marginRight: 10}} />
              <Text style={styles.btnSubmitText}>Générer l'ordonnance</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{height: 50}} /> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  sectionCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  subLabel: { fontSize: 12, color: '#64748B', marginBottom: 4, marginTop: 4 },
  searchWrapper: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: { backgroundColor: '#F1F5F9', padding: 12, paddingLeft: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15 },
  inputSelected: { borderColor: '#10B981', backgroundColor: '#F0FDF4', color: '#065F46' },
  textArea: { height: 80, textAlignVertical: 'top', paddingLeft: 12 },
  loader: { position: 'absolute', right: 12 },
  
  // Styles Dropdown Select2
  resultsDropdown: { backgroundColor: '#FFF', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultText: { marginLeft: 10, color: '#1E293B', fontWeight: '500' },
  
  patientBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8 },
  patientBadgeText: { marginLeft: 6, color: '#10B981', fontWeight: '600', fontSize: 13 },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  medCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EDE9FE', borderLeftWidth: 5, borderLeftColor: '#7C3AED' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  medNumber: { fontWeight: 'bold', color: '#7C3AED' },
  row: { flexDirection: 'row', marginBottom: 5 },
  
  btnAddSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', padding: 8, borderRadius: 8 },
  btnAddSmallText: { color: '#7C3AED', fontWeight: 'bold', marginLeft: 4 },
  
  btnSubmit: { backgroundColor: '#7C3AED', flexDirection: 'row', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4 },
  btnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});