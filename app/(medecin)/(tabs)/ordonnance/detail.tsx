import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionService } from '../../../../api/prescriptionService';
import Toast from 'react-native-toast-message';
import { imprimerOrdonnance, partagerOrdonnancePdf } from '@/utils/printOrdonnance';
import { getMedecinLabel, getPatientEntete } from '@/utils/ordonnanceLabels';

export default function DetailPrescription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ord, setOrd] = useState<any>(null);
  const [printing, setPrinting] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await prescriptionService.getPrescriptionById(id as string);
      setOrd(data);
    } catch (error: any) {
      console.error("Erreur fetch:", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || "Impossible de charger l'ordonnance"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchDetail(); }, [id]);

  /**
   * Imprime (dialogue système) ou exporte l'ordonnance en PDF partageable.
   * Les noms patient/médecin sont résolus au moment de l'action : le backend
   * ne renvoie que les identifiants.
   */
  const handleExport = async (mode: 'print' | 'share') => {
    try {
      setPrinting(true);
      const [patient, medecinLabel] = await Promise.all([
        getPatientEntete(ord.patientId),
        getMedecinLabel(ord.medecinId),
      ]);
      const document = {
        ...ord,
        patientLabel: patient.label,
        patientDetail: patient.details,
        medecinLabel,
      };
      await (mode === 'print' ? imprimerOrdonnance(document) : partagerOrdonnancePdf(document));
    } catch (error: any) {
      // L'annulation du dialogue système lève aussi une erreur : on reste discret
      if (!/cancel/i.test(error?.message || '')) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: "Export impossible" });
      }
    } finally {
      setPrinting(false);
    }
  };

  // Fonction utilitaire pour formater les dates venant du Backend
 const formatDate = (dateInput: any) => {
  if (!dateInput) return "Date non définie";

  // Si c'est déjà une chaîne ISO ou un objet Date
  let date = new Date(dateInput);

  // Cas particulier : Si jamais le backend envoie encore l'objet {_seconds...}
  if (isNaN(date.getTime()) && dateInput?._seconds) {
    date = new Date(dateInput._seconds * 1000);
  }

  // Si après tout ça la date est toujours invalide
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }

  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
};

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-slate-50">
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );



  if (!ord) return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
      <Text>Ordonnance introuvable ou erreur de connexion.</Text>
      <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-emerald-600 p-3 rounded-xl">
        <Text className="text-white">Retour</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Tailwind */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-50 p-3 rounded-2xl mr-4">
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-slate-900 flex-1">Détails Ordonnance</Text>

        {/* Actions : export PDF partageable + impression */}
        <TouchableOpacity
          onPress={() => handleExport('share')}
          disabled={printing}
          className="bg-slate-50 p-3 rounded-2xl mr-2"
        >
          <Ionicons name="share-outline" size={20} color="#1e293b" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleExport('print')}
          disabled={printing}
          className="bg-slate-900 p-3 rounded-2xl"
        >
          {printing
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="print-outline" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

        {/* Info Statut & Date */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date d'émission</Text>
            <Text className="text-slate-900 font-extrabold text-base">{formatDate(ord.dateCreation)}</Text>
          </View>
          <View className="bg-green-100 px-4 py-2 rounded-full border border-green-200">
            <Text className="text-green-700 font-black text-[10px]">{ord.statut?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Section Diagnostic */}
        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-emerald-100 p-2 rounded-lg">
              <Ionicons name="pulse" size={18} color="#059669" />
            </View>
            <Text className="ml-3 font-bold text-slate-900 text-base">Diagnostic</Text>
          </View>
          <Text className="text-slate-600 leading-6 text-sm italic">
            "{ord.diagnostic || "Aucune observation particulière."}"
          </Text>
        </View>

        {/* Traitements */}
        <Text className="text-lg font-black text-slate-900 mb-5 ml-1">Traitements prescrits</Text>

        {ord.medicaments?.map((med: any, index: number) => (
          <View key={index} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 flex-row items-center shadow-sm">
            <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="medical" size={24} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-black text-base mb-2">{med.nomMedicament}</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Dosage</Text>
                  <Text className="text-slate-700 font-medium text-xs">{med.dosage}</Text>
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Fréquence</Text>
                  <Text className="text-slate-700 font-medium text-xs">{med.frequence}</Text>
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Durée</Text>
                  <Text className="text-slate-700 font-medium text-xs">{med.duree} Jrs</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Footer info période */}
        <View className="flex-row items-center justify-center my-10 bg-slate-100 py-4 rounded-2xl">
          <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
          <Text className="ml-2 text-slate-500 text-[11px] font-medium italic">
            Traitement prévu du {formatDate(ord.dateDebut)} au {formatDate(ord.dateFin)}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}