import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { auth, db } from '../../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { APP_ROUTES } from '../../../constants/routes';
import LogoutButton from '../../../components/bouton/logoutBouton';
import { notificationService } from '../../../api/notificationService';
import AppHeader from '../../../components/AppHeader';

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState<any>(null);
  const [stats, setStats] = useState({ totalPrescriptions: 0, actives: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchUnreadCount = useCallback(async () => {
    try { setUnreadCount(await notificationService.getUnreadCount()); }
    catch (e) { console.error(e); }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) setPatientData(userSnap.data());

      const patientSnap = await getDoc(doc(db, "patients", user.uid));
      if (patientSnap.exists()) {
        const prescSnap = await getDocs(
          query(collection(db, "prescriptions"), where("patientId", "==", user.uid))
        );
        const prescriptions = prescSnap.docs.map(d => d.data());
        const actives = prescriptions.filter(p => p.statut === 'active' || p.statut === 'en_cours').length;
        setStats({ totalPrescriptions: prescSnap.size, actives });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recharge stats + compteur à chaque retour sur l'écran
  useFocusEffect(useCallback(() => {
    fetchDashboard();
    fetchUnreadCount();
  }, [fetchDashboard, fetchUnreadCount]));

  if (loading) return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Espace Patient" />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-4 text-slate-400 font-medium">Chargement...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <AppHeader subtitle="Espace Patient" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* --- HEADER --- */}
        <View className="px-6 py-6 bg-sky-500 rounded-b-[50px] mb-8 shadow-2xl shadow-sky-200">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1 pr-3">
              <Text className="text-sky-100 font-bold text-xs uppercase tracking-[2px]">Espace Patient</Text>
              <Text className="text-3xl font-black text-white mt-1">Bonjour,</Text>
              <Text className="text-white text-2xl font-light opacity-90" numberOfLines={1}>
                {patientData?.prenom || patientData?.nom || "Patient"}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
                onPress={() => router.push('/(notification)/list' as Href)}
              >
                <Ionicons name="notifications-outline" size={24} color="white" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 min-w-[20px] h-5 rounded-full items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
                onPress={() => router.push('/(patient)/(tabs)/parametres' as Href)}
              >
                <Ionicons name="person-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badge statut traitement */}
          <View className="bg-sky-300 self-start px-4 py-2 rounded-full flex-row items-center">
            <Ionicons name="shield-checkmark" size={14} color="#082F49" />
            <Text className="text-sky-950 font-black text-[10px] uppercase tracking-wider ml-2">
              {stats.actives > 0 ? 'Traitement actif' : 'Aucun traitement'}
            </Text>
          </View>
        </View>

        {/* --- ORDONNANCES, PHARMACIE DE GARDE & MESSAGES --- */}
        <View className="px-6 mb-8 gap-4">
          <TouchableOpacity
            onPress={() => router.push('/(patient)/(tabs)/ordonnance' as Href)}
            className="bg-sky-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-sky-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="document-text" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Mes Ordonnances</Text>
              <Text className="text-sky-100 text-xs font-bold mt-0.5">
                {String(stats.totalPrescriptions).padStart(2, '0')} au total · Voir l'historique
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.PATIENT.PHARMACIES_GARDE as Href)}
            className="bg-emerald-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="medical" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Pharmacies de garde</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">Trouvez une pharmacie ouverte près de vous</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.PATIENT.PHARMACIES_MAP as Href)}
            className="bg-emerald-500 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="map" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Carte des pharmacies</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">Toute Madagascar · autour de moi</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(conversation)/list' as Href)}
            className="bg-cyan-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-cyan-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="chatbubbles" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Messages</Text>
              <Text className="text-cyan-100 text-xs font-bold mt-0.5">Discuter avec votre médecin</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* --- LOGOUT --- */}
        <View className="px-6 mt-4">
          <LogoutButton />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
