import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientService } from '../../../../api/patientService';
import { prescriptionService } from '../../../../api/prescriptionService';
import { Patient } from '../../../../types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { libelleAge } from '@/utils/dateNaissance';

export default function AjoutOrdonnance() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetchingPatient, setFetchingPatient] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [diagnostic, setDiagnostic] = useState('');
  // Ajout des quantités pour chaque moment de la journée
  const [medicaments, setMedicaments] = useState([
    { nomMedicament: '', dosage: '', qteMatin: '0', qteMidi: '0', qteSoir: '0', duree: '' }
  ]);



  useEffect(() => {
    if (params.patientId) {
      console.log("🚀 Lancement du chargement pour:", params.patientId);
      loadPatient(params.patientId as string);
    }
  }, [params.patientId]); // S'assure de relancer si l'ID change


  const loadPatient = async (id: string) => {
    try {
      setFetchingPatient(true);
      const p = await patientService.getPatientById(id);
      setSelectedPatient(p);
    } catch (e) {
      console.error("Erreur chargement patient:", e);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de trouver le patient' });
    } finally {
      setFetchingPatient(false);
    }
  };

  const addMed = () => setMedicaments([...medicaments, { nomMedicament: '', dosage: '', qteMatin: '0', qteMidi: '0', qteSoir: '0', duree: '' }]);

  const updateMed = (index: number, field: string, value: string) => {
    const newMeds = [...medicaments];
    (newMeds[index] as any)[field] = value;
    setMedicaments(newMeds);
  };

  const handleSave = async () => {
    const medsValides = medicaments.filter(m => m.nomMedicament.trim() !== '');

    if (!selectedPatient) return Toast.show({ type: 'error', text1: 'Erreur', text2: 'Aucun patient chargé' });
    if (!diagnostic.trim()) return Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Le diagnostic est obligatoire' });

    const isComplete = medsValides.length > 0 && medsValides.every(m =>
      m.dosage.trim() !== '' && m.duree.trim() !== '' &&
      (parseInt(m.qteMatin) > 0 || parseInt(m.qteMidi) > 0 || parseInt(m.qteSoir) > 0)
    );

    if (!isComplete) {
      return Toast.show({
        type: 'error',
        text1: 'Incomplet',
        text2: 'Vérifiez le nom, dosage, durée et les quantités (Matin/Midi/Soir)'
      });
    }

    setLoading(true);
    try {
      await prescriptionService.createPrescription({
        patientId: selectedPatient.userId || selectedPatient.id,
        diagnostic: diagnostic.trim(),
        medicaments: medsValides.map(m => ({
          nomMedicament: m.nomMedicament,
          dosage: m.dosage,
          frequence: `Matin: ${m.qteMatin}, Midi: ${m.qteMidi}, Soir: ${m.qteSoir}`,
          duree: m.duree
        })),
        duree: medsValides[0].duree
      });

      Toast.show({ type: 'success', text1: 'Ordonnance créée' });
      router.replace(APP_ROUTES.MEDECIN.HOME);
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur de sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPatient) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-slate-500">Chargement du patient...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <AppScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >

          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-xl font-black text-slate-800">Prescription</Text>
            <View className="w-10" />
          </View>

          {/* Patient Card */}
          {!selectedPatient ? (
            <View className="bg-red-50 p-6 rounded-[28px] mb-6 border border-red-100 items-center">
              <Ionicons name="alert-circle" size={32} color="#ef4444" />
              <Text className="text-red-600 font-bold mt-2">Patient introuvable</Text>
            </View>
          ) : (
            <View className="bg-emerald-600 p-6 rounded-[28px] mb-6 flex-row items-center shadow-lg shadow-emerald-200">
              <Ionicons name="person-circle" size={44} color="white" />
              <View className="ml-4 flex-1">
                <Text className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Patient sélectionné</Text>
                {/* Le nom en premier : le numéro seul ne permet pas de vérifier
                    qu'on prescrit au bon patient. */}
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  {`${selectedPatient.prenom || ''} ${selectedPatient.nom || ''}`.trim()
                    || selectedPatient.numeroPatient
                    || selectedPatient.email}
                </Text>
                {/* Sexe et âge sous les yeux au moment de choisir les doses :
                    c'est ici qu'ils servent, pas seulement dans la fiche. */}
                <Text className="text-emerald-100 text-xs font-bold mt-0.5" numberOfLines={1}>
                  {[
                    selectedPatient.numeroPatient,
                    selectedPatient.sexe === 'M' ? 'Masculin'
                      : selectedPatient.sexe === 'F' ? 'Féminin' : null,
                    libelleAge(selectedPatient.dateNaissance),
                  ].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            </View>
          )}

          {/* Diagnostic */}
          <View className="bg-white p-5 rounded-[28px] mb-6 shadow-sm border border-slate-100">
            <Text className="text-slate-800 font-bold mb-3">Diagnostic clinique</Text>
            <TextInput
              multiline
              className="bg-slate-50 p-4 rounded-2xl text-slate-900 min-h-[80px]"
              placeholder="Ex: Grippe saisonnière, tension élevée..."
              value={diagnostic}
              onChangeText={setDiagnostic}
            />
          </View>

          {/* Liste Médicaments */}
          {medicaments.map((med, index) => (
            <View key={index} className="bg-white p-6 rounded-[32px] mb-5 border border-slate-200 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-emerald-600 font-black">MÉDICAMENT #{index + 1}</Text>
                {medicaments.length > 1 && (
                  <TouchableOpacity onPress={() => setMedicaments(medicaments.filter((_, i) => i !== index))} className="bg-red-50 p-2 rounded-lg">
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                className="bg-slate-50 p-4 rounded-xl font-bold mb-4 border border-slate-100"
                placeholder="Nom du médicament"
                value={med.nomMedicament}
                onChangeText={(v) => updateMed(index, 'nomMedicament', v)}
              />

              {/* QUANTITÉS PAR MOMENT */}
              <Text className="text-slate-400 text-[10px] font-bold uppercase mb-3 ml-1">Quantité à prendre par prise</Text>
              <View className="flex-row gap-2 mb-4">
                {[
                  { id: 'qteMatin', label: 'Matin', color: '#fbbf24' },
                  { id: 'qteMidi', label: 'Midi', color: '#f59e0b' },
                  { id: 'qteSoir', label: 'Soir', color: '#1e293b' }
                ].map((moment) => (
                  <View key={moment.id} className="flex-1 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Text className="text-[10px] font-bold mb-2" style={{ color: moment.color }}>{moment.label}</Text>
                    <TextInput
                      keyboardType="numeric"
                      className="text-lg font-black text-slate-900"
                      value={(med as any)[moment.id]}
                      onChangeText={(v) => updateMed(index, moment.id, v)}
                    />
                  </View>
                ))}
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-bold mb-1">Dosage (mg/ml)</Text>
                  <TextInput className="bg-slate-50 p-3 rounded-xl font-bold" placeholder="500" value={med.dosage} onChangeText={(v) => updateMed(index, 'dosage', v)} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-bold mb-1">Durée (Jours)</Text>
                  <TextInput className="bg-slate-50 p-3 rounded-xl font-bold" placeholder="7" keyboardType="numeric" value={med.duree} onChangeText={(v) => updateMed(index, 'duree', v)} />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={addMed} className="flex-row items-center justify-center py-4 bg-emerald-50 rounded-2xl border-dashed border border-emerald-200 mb-6">
            <Ionicons name="add-circle" size={24} color="#059669" />
            <Text className="text-emerald-600 font-bold ml-2">Ajouter une ligne</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-6 rounded-[24px] items-center shadow-xl mb-20 ${loading ? 'bg-slate-400' : 'bg-emerald-600 shadow-emerald-300'}`}
            onPress={handleSave}
            disabled={loading || !selectedPatient}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text className="text-white font-black text-lg">Finaliser l'Ordonnance</Text>
            )}
          </TouchableOpacity>
      </AppScrollView>
    </SafeAreaView>
  );
}