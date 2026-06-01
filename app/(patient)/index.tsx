import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { APP_ROUTES } from '../../constants/routes';
import LogoutButton from '../../components/bouton/logoutBouton';
import { notificationService } from '../../api/notificationService';

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
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#0EA5E9" />
      <Text className="mt-4 text-slate-400 font-medium">Chargement...</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* --- HEADER --- */}
        <View className="px-6 py-6 bg-sky-500 rounded-b-[50px] mb-8 shadow-2xl shadow-sky-200">
          {/* Logo Mediora */}
          <View className="flex-row items-center mb-5">
            <View className="bg-white rounded-xl p-1">
              <Image
                source={require('../../assets/images/icon.png')}
                style={{ width: 30, height: 30, borderRadius: 8 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-white text-xl font-black ml-2 tracking-tight">Mediora</Text>
          </View>

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
                onPress={() => router.push('/(patient)/parametres' as Href)}
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

        {/* --- STATS BENTO --- */}
        <View className="px-6 flex-row gap-4 mb-8">
          <TouchableOpacity
            className="flex-1 bg-sky-700 p-6 rounded-[35px] justify-between h-40 shadow-xl"
            onPress={() => router.push('/(patient)/ordonnance' as Href)}
          >
            <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="document-text" size={20} color="white" />
            </View>
            <View>
              <Text className="text-white text-4xl font-black tracking-tighter">{String(stats.totalPrescriptions).padStart(2, '0')}</Text>
              <Text className="text-sky-200 font-bold text-[10px] uppercase">Prescriptions</Text>
            </View>
          </TouchableOpacity>

          <View className="flex-1 bg-sky-50 p-6 rounded-[35px] justify-between h-40 border border-sky-100">
            <View className="bg-sky-600 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="medkit" size={20} color="white" />
            </View>
            <View>
              <Text className="text-sky-900 text-4xl font-black tracking-tighter">{String(stats.actives).padStart(2, '0')}</Text>
              <Text className="text-sky-500 font-bold text-[10px] uppercase">Actives</Text>
            </View>
          </View>
        </View>

        {/* --- ACTIONS --- */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-black text-slate-900 mb-5">Accès rapide</Text>
          <View className="flex-row justify-between gap-4">
            <TouchableOpacity
              className="flex-1 bg-white p-6 rounded-[40px] h-52 border border-slate-100 shadow-sm justify-between"
              style={{ elevation: 3 }}
              onPress={() => router.push('/(patient)/ordonnance' as Href)}
            >
              <View className="bg-sky-50 w-14 h-14 rounded-2xl items-center justify-center">
                <Ionicons name="document-text" size={28} color="#0EA5E9" />
              </View>
              <View>
                <Text className="text-slate-900 font-black text-lg leading-6">Mes Ordonnances</Text>
                <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Voir l'historique</Text>
              </View>
            </TouchableOpacity>

            <View className="flex-1 gap-4">
              <SmallAction
                title="Rappels"
                icon="alarm"
                bg="bg-sky-50"
                color="#0EA5E9"
                onPress={() => router.push(APP_ROUTES.PATIENT.MES_RAPPELS as Href)}
              />
              <SmallAction
                title="Messages"
                icon="chatbubbles"
                bg="bg-cyan-50"
                color="#0891B2"
                onPress={() => router.push('/(conversation)/list' as Href)}
              />
            </View>
          </View>
        </View>

        {/* --- MESSAGES --- */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={() => router.push('/(conversation)/list' as Href)}
            className="bg-sky-50 p-5 rounded-[30px] flex-row items-center border border-sky-100"
          >
            <View className="bg-sky-600 p-3 rounded-xl mr-4">
              <Ionicons name="chatbubbles" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-black text-base">Messages</Text>
              <Text className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">Discuter avec votre médecin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#38BDF8" />
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

function SmallAction({ title, icon, bg, color, onPress }: any) {
  return (
    <TouchableOpacity
      className={`w-full ${bg} p-5 rounded-[30px] flex-row items-center`}
      onPress={onPress}
    >
      <View className="bg-white/60 p-2 rounded-xl mr-3">
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-slate-800 font-black text-xs">{title}</Text>
    </TouchableOpacity>
  );
}
