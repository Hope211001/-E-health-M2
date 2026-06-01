import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../../api/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

export default function PatientOrdonnance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const prescSnap = await getDocs(
        query(collection(db, "prescriptions"), where("patientId", "==", user.uid))
      );
      const data = prescSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(a.dateCreation);
        const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(b.dateCreation);
        return dateB.getTime() - dateA.getTime();
      });
      setPrescriptions(data);
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger vos ordonnances' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'en_cours': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'En cours' };
      case 'active': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' };
      case 'terminee': return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'Terminée' };
      case 'annulee': return { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', label: 'Annulée' };
      default: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'En attente' };
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const statut = getStatutStyle(item.statut);
    const canStart = item.statut === 'en_attente' || item.statut === 'active';

    return (
      <View className="flex-row mb-1">
        {/* Timeline */}
        <View className="items-center mr-4 w-5">
          <View className={`w-3 h-3 rounded-full z-10 mt-6 ${item.statut === 'en_cours' ? 'bg-blue-600' : 'bg-sky-600'}`} />
          {index !== prescriptions.length - 1 && (
            <View className="w-[2px] flex-1 bg-slate-200 -mt-1" />
          )}
        </View>

        {/* Carte — toutes cliquables, navigation vers détail */}
        <TouchableOpacity
          className={`flex-1 bg-white rounded-3xl p-5 mb-5 shadow-sm border ${canStart ? 'border-sky-200' : 'border-slate-100'}`}
          onPress={() => router.push({ pathname: '/(patient)/detail-prescription', params: { id: item.id } } as any)}
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sky-600 font-bold text-sm">{formatDate(item.dateCreation)}</Text>
            <View className={`${statut.bg} px-3 py-1 rounded-full border ${statut.border}`}>
              <Text className={`${statut.text} font-bold text-[10px] uppercase`}>{statut.label}</Text>
            </View>
          </View>

          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Diagnostic</Text>
          <Text className="text-slate-900 text-base leading-6 mb-4" numberOfLines={2}>
            {item.diagnostic || "Non renseigné"}
          </Text>

          {/* Médicaments en résumé */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {item.medicaments?.slice(0, 3).map((med: any, i: number) => (
              <View key={i} className="bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                <Text className="text-sky-700 text-[10px] font-bold">{med.nomMedicament}</Text>
              </View>
            ))}
            {item.medicaments?.length > 3 && (
              <Text className="text-slate-400 text-[10px] self-center">+{item.medicaments.length - 3}</Text>
            )}
          </View>

          {/* Footer : indication selon statut */}
          <View className="flex-row items-center justify-between mt-1">
            {canStart ? (
              <View className="flex-row items-center">
                <Ionicons name="play-circle" size={16} color="#0EA5E9" />
                <Text className="text-sky-600 font-bold text-[11px] ml-1">Appuyez pour voir le détail</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text className="text-slate-400 text-[11px] ml-1">{formatDate(item.dateDebut)} → {formatDate(item.dateFin)}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <View className="bg-sky-50 p-3 rounded-2xl mr-4">
          <Ionicons name="document-text" size={20} color="#0EA5E9" />
        </View>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">Mes</Text>
          <Text className="text-xl font-black text-slate-900">Ordonnances</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0EA5E9" size="large" />
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
                Vous n'avez pas encore d'ordonnance. Votre médecin en créera une lors de votre consultation.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
