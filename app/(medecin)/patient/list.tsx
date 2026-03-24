import React, { useState, useCallback } from 'react'; // Ajout de useCallback ici
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Href } from 'expo-router'; // Importation de useFocusEffect
import Toast from 'react-native-toast-message';

import { patientService } from '../../../api/patientService';
import { Patient } from '../../../types/collection';
import { APP_ROUTES } from '@/constants/routes';

export default function ListePatients() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. La fonction de récupération reste la même
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getMyPatients();
      setPatients(data);
    } catch (error: any) {
      console.error("Erreur Fetch :", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les patients'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. REMPLACEMENT DU useEffect PAR useFocusEffect
  // Cette fonction s'exécute à CHAQUE FOIS que l'écran devient actif (même après un router.back())
  useFocusEffect(
    useCallback(() => {
      fetchPatients();

      // Optionnel : cleanup si nécessaire
      return () => { };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, []);

  // --- LE RESTE DU CODE (renderItem, return, etc.) RESTE IDENTIQUE ---
  const renderPatientItem = ({ item }: { item: Patient }) => (
    <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
      <View className="flex-row items-center">
        <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center">
          <Ionicons name="person" size={24} color="#2563eb" />
        </View>

        <View className="flex-1 ml-4">
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ID: {item.numeroPatient}</Text>
          <Text className="text-slate-900 font-extrabold text-base">{item.email}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="call-outline" size={12} color="#64748b" />
            {/* Si tu as bien fait la modif backend, item.telephone sera affiché ici */}
            <Text className="text-slate-500 text-xs ml-1">{item.telephone || "Pas de numéro"}</Text>
          </View>
        </View>

        <View className="bg-green-100 px-3 py-1 rounded-lg">
          <Text className="text-green-700 text-[10px] font-black">ACTIF</Text>
        </View>
      </View>

      <View className="h-[1px] bg-slate-50 my-5" />

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-slate-100 h-12 rounded-2xl flex-row items-center justify-center"
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.HISTORY,
            params: { patientId: item.id }
          })}
        >
          <Ionicons name="folder-open-outline" size={18} color="#475569" />
          <Text className="text-slate-600 font-bold ml-2">Dossier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-blue-600 h-12 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200"
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT,
            params: { patientId: item.id }
          })}
        >
          <Ionicons name="medical-outline" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Prescrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pt-4 pb-8 rounded-b-[40px] shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-purple-600 font-bold text-xs tracking-widest">DOCTEUR</Text>
            <Text className="text-2xl font-black text-slate-900">Mes Patients</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 h-14">
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={patients.filter(p => {
            const search = searchQuery.toLowerCase();
            // Ajout d'une sécurité ?. sur les champs au cas où ils seraient nuls
            return (p.numeroPatient?.toLowerCase() || "").includes(search) ||
              (p.email?.toLowerCase() || "").includes(search);
          })}
          // CORRECTION ICI : On force le retour d'une string même si l'ID est absent
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderPatientItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        className="absolute bottom-10 right-8 bg-purple-600 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-purple-400"
        onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.ADD as Href)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}