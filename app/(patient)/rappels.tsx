import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionService } from '../../api/prescriptionService';
import Toast from 'react-native-toast-message';

export default function Rappels() {
  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchAlertes = async () => {
    try {
      const data = await prescriptionService.getAlertesToday();
      setAlertes(data);
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger les rappels' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlertes(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlertes();
  };

  const handleMarkPris = async (alerteId: string) => {
    setMarkingId(alerteId);
    try {
      await prescriptionService.markAlertePrise(alerteId);
      // Mettre à jour localement
      setAlertes(prev =>
        prev.map(a => a.id === alerteId ? { ...a, statut: 'pris', prisLe: new Date().toISOString() } : a)
      );
      Toast.show({ type: 'success', text1: 'Médicament pris', text2: 'Bien noté !' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de valider' });
    } finally {
      setMarkingId(null);
    }
  };

  const isPassedHour = (heure: string) => {
    const now = new Date();
    const [h, m] = heure.split(':').map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  };

  const getStatutInfo = (alerte: any) => {
    if (alerte.statut === 'pris') {
      return { icon: 'checkmark-circle' as const, color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Pris' };
    }
    if (alerte.statut === 'manque') {
      return { icon: 'close-circle' as const, color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', label: 'Manqué' };
    }
    if (isPassedHour(alerte.heurePrevu)) {
      return { icon: 'warning' as const, color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', label: 'En retard' };
    }
    return { icon: 'time' as const, color: '#0EA5E9', bg: 'bg-sky-50', border: 'border-sky-200', label: 'À venir' };
  };

  // Compter les stats
  const totalPris = alertes.filter(a => a.statut === 'pris').length;
  const totalRestant = alertes.filter(a => a.statut !== 'pris').length;

  const renderItem = ({ item }: { item: any }) => {
    const info = getStatutInfo(item);
    const isPris = item.statut === 'pris';

    return (
      <View className={`bg-white rounded-3xl p-5 mb-4 border ${info.border} shadow-sm`}>
        <View className="flex-row items-center">
          {/* Heure */}
          <View className={`${info.bg} w-16 h-16 rounded-2xl items-center justify-center mr-4`}>
            <Text className="text-lg font-black" style={{ color: info.color }}>{item.heurePrevu}</Text>
          </View>

          {/* Info médicament */}
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base">{item.nomMedicament}</Text>
            <Text className="text-slate-400 text-xs mt-1">
              {item.dosage}{item.moment ? ` — ${item.moment.charAt(0).toUpperCase() + item.moment.slice(1)}` : ''}
            </Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name={info.icon} size={14} color={info.color} />
              <Text className="text-xs font-bold ml-1" style={{ color: info.color }}>{info.label}</Text>
              {isPris && item.prisLe && (
                <Text className="text-slate-400 text-[10px] ml-2">
                  à {new Date(item.prisLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>

          {/* Bouton Pris */}
          {!isPris && (
            <TouchableOpacity
              className="bg-sky-600 w-12 h-12 rounded-2xl items-center justify-center"
              onPress={() => handleMarkPris(item.id)}
              disabled={markingId === item.id}
            >
              {markingId === item.id ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          )}

          {/* Check si déjà pris */}
          {isPris && (
            <View className="bg-emerald-100 w-12 h-12 rounded-2xl items-center justify-center">
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-5 border-b border-slate-100">
        <View className="flex-row items-center mb-4">
          <View className="bg-sky-50 p-3 rounded-2xl mr-4">
            <Ionicons name="alarm" size={20} color="#0EA5E9" />
          </View>
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Aujourd'hui</Text>
            <Text className="text-xl font-black text-slate-900">Mes Rappels</Text>
          </View>
        </View>

        {/* Stats rapides */}
        {alertes.length > 0 && (
          <View className="flex-row gap-3">
            <View className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text className="text-emerald-700 font-bold text-xs ml-1">{totalPris} pris</Text>
            </View>
            <View className="bg-sky-50 px-4 py-2 rounded-full border border-sky-200 flex-row items-center">
              <Ionicons name="time" size={14} color="#0EA5E9" />
              <Text className="text-sky-700 font-bold text-xs ml-1">{totalRestant} restant{totalRestant > 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0EA5E9" size="large" />
        </View>
      ) : (
        <FlatList
          data={alertes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-slate-100 p-8 rounded-full mb-6">
                <Ionicons name="alarm-outline" size={50} color="#94A3B8" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">Aucun rappel aujourd'hui</Text>
              <Text className="text-slate-400 text-center mt-2">
                Vous n'avez aucun médicament à prendre aujourd'hui. Démarrez une ordonnance depuis l'onglet Ordonnances.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
