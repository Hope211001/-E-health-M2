import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionService } from '../../api/prescriptionService';
import Toast from 'react-native-toast-message';
import { APP_ROUTES } from '@/constants/routes';

export default function PatientOrdonnance() {
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      if (patientId) {
        const data = await prescriptionService.getPrescriptionsByPatient(patientId as string);
        setPrescriptions(data);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger l’historique' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <View className="flex-row mb-1">
      {/* Colonne Timeline (Ligne et Point) */}
      <View className="items-center mr-4 w-5">
        <View className="w-3 h-3 rounded-full bg-purple-600 z-10 mt-6" />
        {index !== prescriptions.length - 1 && (
          <View className="w-[2px] flex-1 bg-slate-200 -mt-1" />
        )}
      </View>

      {/* Carte Ordonnance */}
      <TouchableOpacity 
        className="flex-1 bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-100"
        onPress={() => router.push({ pathname: APP_ROUTES.MEDECIN.ORDONNANCE.DETAIL, params: { id: item.id } })}
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-purple-600 font-bold text-sm">
            {new Date(item.dateCreation).toLocaleDateString('fr-FR', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#A78BFA" />
        </View>

        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Diagnostic</Text>
        <Text className="text-slate-900 text-base leading-6 mb-4" numberOfLines={2}>
            {item.diagnostic || "Non renseigné"}
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {item.medicaments?.slice(0, 2).map((med: any, i: number) => (
            <View key={i} className="bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
              <Text className="text-purple-700 text-[10px] font-bold">{med.nomMedicament}</Text>
            </View>
          ))}
          {item.medicaments?.length > 2 && (
            <Text className="text-slate-400 text-[10px] self-center">+{item.medicaments.length - 2} autres</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Moderne Tailwind */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-slate-50 p-3 rounded-2xl mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">Historique de</Text>
          <Text className="text-xl font-black text-slate-900">{patientName || "Dossier Patient"}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-slate-100 p-8 rounded-full mb-6">
                <Ionicons name="document-text-outline" size={50} color="#94A3B8" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">Aucune ordonnance</Text>
              <Text className="text-slate-400 text-center mt-2">
                Ce patient n'a pas encore d'historique médical enregistré.
              </Text>
              <TouchableOpacity 
                className="mt-8 bg-purple-600 px-8 py-4 rounded-2xl"
                onPress={() => router.push({ pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT, params: { patientId } })}
              >
                <Text className="text-white font-bold">Créer une ordonnance</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}