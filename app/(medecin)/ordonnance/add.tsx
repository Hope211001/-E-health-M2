import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { patientService } from '../../../api/patientService';
import { prescriptionService } from '../../../api/prescriptionService';
import { Patient } from '../../../types/collection';

// Schéma de validation Zod
const prescriptionSchema = z.object({
  diagnostic: z.string().min(5, { message: "Le diagnostic est trop court" }),
  medicaments: z.array(z.object({
    nomMedicament: z.string().min(2, { message: "Nom du médicament requis" }),
    dosage: z.string().min(1, { message: "Dosage requis" }),
    frequence: z.string().min(1, { message: "Fréquence requise" }),
    duree: z.string().min(1, { message: "Durée requise" }),
  })).min(1, { message: "Ajoutez au moins un médicament" })
});

export default function AjoutOrdonnance() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Recherche Patient
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Formulaire
  const [diagnostic, setDiagnostic] = useState('');
  const [medicaments, setMedicaments] = useState<any[]>([
    { nomMedicament: '', dosage: '', matin: '0', midi: '0', soir: '0', duree: '' }
  ]);

  const buildFrequence = (m: any) =>
    `Matin: ${parseInt(m.matin) || 0}, Midi: ${parseInt(m.midi) || 0}, Soir: ${parseInt(m.soir) || 0}`;

  // LOGIQUE DE RECHERCHE (Debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3 && !selectedPatient) {
        setIsSearching(true);
        try {
          const pts = await patientService.searchPatients(searchQuery);
          setResults(pts);
        } catch (e) { console.error(e); }
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedPatient]);

  const addMed = () => setMedicaments([...medicaments, { nomMedicament: '', dosage: '', matin: '0', midi: '0', soir: '0', duree: '' }]);
  
  const removeMed = (index: number) => {
    if (medicaments.length > 1) setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  const updateMed = (index: number, field: string, value: string) => {
    const newMeds = [...medicaments];
    newMeds[index][field] = value;
    setMedicaments(newMeds);
  };

  const handleSave = async () => {
    if (!selectedPatient) return Toast.show({ type: 'error', text1: 'Patient requis' });

    const medicamentsAvecFrequence = medicaments.map((m) => ({
      nomMedicament: m.nomMedicament,
      dosage: m.dosage,
      frequence: buildFrequence(m),
      duree: m.duree,
    }));

    const totalParJour = (m: any) => (parseInt(m.matin) || 0) + (parseInt(m.midi) || 0) + (parseInt(m.soir) || 0);
    const medSansPrise = medicaments.find((m) => totalParJour(m) === 0);
    if (medSansPrise) {
      return Toast.show({ type: 'error', text1: 'Posologie requise', text2: 'Renseignez au moins une prise (matin, midi ou soir)' });
    }

    const validation = prescriptionSchema.safeParse({ diagnostic, medicaments: medicamentsAvecFrequence });
    if (!validation.success) {
      return Toast.show({ type: 'error', text1: 'Erreur', text2: validation.error.issues[0].message });
    }

    setLoading(true);
    try {
      await prescriptionService.createPrescription({
        patientId: selectedPatient.userId,
        diagnostic,
        medicaments: medicamentsAvecFrequence,
        duree: medicaments[0].duree // Durée globale basée sur le 1er médoc
      });
      Toast.show({ type: 'success', text1: 'Ordonnance créée !' });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.response?.data?.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <AppScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
          
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => router.back()} className="bg-white p-3 rounded-2xl shadow-sm">
              <Ionicons name="arrow-back" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-2xl font-black ml-4 text-slate-900">Prescription</Text>
          </View>

          {/* RECHERCHE PATIENT */}
          <View className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 mb-6">
            <Text className="text-slate-700 font-bold mb-3 ml-1">Rechercher un Patient</Text>
            <View className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput 
                className={`flex-1 ml-3 ${selectedPatient ? 'text-green-600 font-bold' : 'text-slate-900'}`}
                placeholder="N° de dossier (ex: PAT...)" 
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (selectedPatient) setSelectedPatient(null);
                }}
              />
              {isSearching && <ActivityIndicator size="small" color="#059669" />}
            </View>

            {/* Dropdown Résultats */}
            {results.length > 0 && (
              <View className="bg-white mt-2 rounded-2xl border border-slate-100 overflow-hidden shadow-lg">
                {results.map((p) => (
                  <TouchableOpacity 
                    key={p.userId} 
                    className="p-4 border-b border-slate-50 flex-row items-center"
                    onPress={() => { setSelectedPatient(p); setSearchQuery(p.numeroPatient); setResults([]); }}
                  >
                    <Ionicons name="person-circle" size={20} color="#059669" />
                    <Text className="ml-3 text-slate-700 font-medium">{p.numeroPatient} - {p.email}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedPatient && (
              <View className="mt-4 flex-row items-center bg-green-50 p-3 rounded-xl border border-green-100">
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text className="ml-2 text-green-700 font-bold text-xs">Patient sélectionné : {selectedPatient.email}</Text>
              </View>
            )}
          </View>

          {/* DIAGNOSTIC */}
          <View className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 mb-6">
            <Text className="text-slate-700 font-bold mb-3 ml-1">Diagnostic</Text>
            <TextInput 
              className="bg-slate-50 p-4 rounded-2xl text-slate-900 min-h-[100px]"
              placeholder="Saisissez vos observations..." 
              multiline
              value={diagnostic}
              onChangeText={setDiagnostic}
            />
          </View>

          {/* MÉDICAMENTS */}
          <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-lg font-black text-slate-900">Traitements</Text>
              <TouchableOpacity onPress={addMed} className="bg-emerald-600 px-4 py-2 rounded-xl">
                  <Text className="text-white font-bold">+ Ajouter</Text>
              </TouchableOpacity>
          </View>

          {medicaments.map((med, index) => (
            <View key={index} className="bg-white p-5 rounded-[32px] mb-4 border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-emerald-600 font-black">MÉDICAMENT #{index + 1}</Text>
                  {medicaments.length > 1 && (
                      <TouchableOpacity onPress={() => removeMed(index)} className="bg-red-50 p-2 rounded-lg">
                          <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                  )}
              </View>

              <TextInput 
                className="bg-slate-50 p-4 rounded-xl mb-3 font-bold"
                placeholder="Nom (ex: Paracétamol)" 
                value={med.nomMedicament}
                onChangeText={(v) => updateMed(index, 'nomMedicament', v)}
              />
              
              <TextInput
                className="bg-slate-50 p-4 rounded-xl mb-3"
                placeholder="Dosage (ex: 500mg)"
                value={med.dosage}
                onChangeText={(v) => updateMed(index, 'dosage', v)}
              />

              {/* POSOLOGIE — nb de comprimés par moment */}
              <Text className="text-slate-700 font-bold text-xs mb-2 ml-1">POSOLOGIE (nombre de comprimés)</Text>
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1 bg-amber-50 rounded-xl p-3 items-center border border-amber-200">
                  <Ionicons name="sunny" size={20} color="#F59E0B" />
                  <Text className="text-amber-700 text-[10px] font-bold uppercase mt-1 mb-2">Matin</Text>
                  <TextInput
                    className="bg-white px-3 py-2 rounded-lg text-center text-xl font-black text-slate-900 w-16 border border-amber-200"
                    keyboardType="numeric"
                    maxLength={2}
                    value={med.matin}
                    onChangeText={(v) => updateMed(index, 'matin', v.replace(/[^0-9]/g, ''))}
                  />
                </View>
                <View className="flex-1 bg-orange-50 rounded-xl p-3 items-center border border-orange-200">
                  <Ionicons name="partly-sunny" size={20} color="#F97316" />
                  <Text className="text-orange-700 text-[10px] font-bold uppercase mt-1 mb-2">Midi</Text>
                  <TextInput
                    className="bg-white px-3 py-2 rounded-lg text-center text-xl font-black text-slate-900 w-16 border border-orange-200"
                    keyboardType="numeric"
                    maxLength={2}
                    value={med.midi}
                    onChangeText={(v) => updateMed(index, 'midi', v.replace(/[^0-9]/g, ''))}
                  />
                </View>
                <View className="flex-1 bg-indigo-50 rounded-xl p-3 items-center border border-indigo-200">
                  <Ionicons name="moon" size={20} color="#6366F1" />
                  <Text className="text-indigo-700 text-[10px] font-bold uppercase mt-1 mb-2">Soir</Text>
                  <TextInput
                    className="bg-white px-3 py-2 rounded-lg text-center text-xl font-black text-slate-900 w-16 border border-indigo-200"
                    keyboardType="numeric"
                    maxLength={2}
                    value={med.soir}
                    onChangeText={(v) => updateMed(index, 'soir', v.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>

              <TextInput
                className="bg-slate-50 p-4 rounded-xl"
                placeholder="Durée (en jours)"
                keyboardType="numeric"
                value={med.duree}
                onChangeText={(v) => updateMed(index, 'duree', v)}
              />
            </View>
          ))}

          <TouchableOpacity 
            className={`bg-emerald-600 p-5 rounded-2xl items-center shadow-xl shadow-emerald-200 mb-10 ${loading ? 'opacity-50' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <View className="flex-row items-center">
                <Ionicons name="document-text" size={20} color="white" />
                <Text className="text-white font-black text-lg ml-2">Générer l'ordonnance</Text>
              </View>
            )}
          </TouchableOpacity>
      </AppScrollView>
    </SafeAreaView>
  );
}