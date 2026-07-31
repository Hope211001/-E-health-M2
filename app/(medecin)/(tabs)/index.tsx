import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_ROUTES } from '../../../constants/routes';
import LogoutButton from '../../../components/bouton/logoutBouton';
import { notificationService } from '../../../api/notificationService';
import AppHeader from '../../../components/AppHeader';

export default function MedecinDashboard() {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [stats, setStats] = useState({ patients: 0, ordonnances: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (e) { console.error(e); }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docSnap = await getDoc(doc(db, "medecins", user.uid));
      if (docSnap.exists()) setDoctorData(docSnap.data());
      const pSnap = await getDocs(query(collection(db, "patients"), where("medecinTraitantId", "==", user.uid)));
      const oSnap = await getDocs(query(collection(db, "prescriptions"), where("medecinId", "==", user.uid)));
      setStats({ patients: pSnap.size, ordonnances: oSnap.size });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Recharger les totaux + le nom + le compteur à CHAQUE retour sur l'écran
  // (après ajout d'un patient/ordonnance), pas seulement au premier montage.
  useFocusEffect(useCallback(() => {
    fetchDashboard();
    fetchUnreadCount();
  }, [fetchDashboard, fetchUnreadCount]));

  if (loading) return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Espace Médical" />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-slate-400 font-medium">Chargement du cabinet...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <AppHeader subtitle="Espace Médical" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* --- HEADER --- */}
        {/* Indigo plutôt que vert : distinct du bandeau AppHeader (toujours
            vert) juste au-dessus, pour éviter que les deux fusionnent visuellement. */}
        <View className="px-6 py-6 bg-indigo-600 rounded-b-[50px] mb-8 shadow-2xl shadow-indigo-200">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1 pr-3">
              <Text className="text-indigo-100 font-bold text-xs uppercase tracking-[2px]">Espace Médical</Text>
              <Text className="text-3xl font-black text-white mt-1">Bonjour,</Text>
              <Text className="text-white text-2xl font-light opacity-90" numberOfLines={1}>
                Dr. {doctorData?.nom || "Spécialiste"}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.push('/(notification)/list' as Href)}
                className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
              >
                <Ionicons name="notifications-outline" size={24} color="white" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 min-w-[20px] h-5 rounded-full items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(APP_ROUTES.MEDECIN.PARAMETRE.PROFIL as Href)}
                className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
              >
                <Ionicons name="person-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badge Spécialité */}
          <View className="bg-indigo-400 self-start px-4 py-2 rounded-full shadow-sm">
            <Text className="text-indigo-950 font-black text-[10px] uppercase tracking-wider">
              {doctorData?.specialite || "Médecin Généraliste"}
            </Text>
          </View>
        </View>

        {/* --- PATIENTS, ORDONNANCES & MESSAGES --- */}
        <View className="px-6 mb-8 gap-4">
          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
            className="bg-emerald-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="people" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Mes Patients</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">
                {String(stats.patients).padStart(2, '0')} patient{stats.patients > 1 ? 's' : ''} suivi{stats.patients > 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.ADD as Href)}
            className="bg-sky-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-sky-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="person-add" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Nouveau Patient</Text>
              <Text className="text-sky-100 text-xs font-bold mt-0.5">Enregistrer un nouveau dossier</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href)}
            className="bg-emerald-700 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="medical" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Prescrire</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">Créer une nouvelle ordonnance</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.MEDECIN.ORDONNANCE.HISTORY as Href)}
            className="bg-emerald-500 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="document-text" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Historique Ordonnances</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">
                {String(stats.ordonnances).padStart(2, '0')} ordonnance{stats.ordonnances > 1 ? 's' : ''} émise{stats.ordonnances > 1 ? 's' : ''}
              </Text>
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
              <Text className="text-cyan-100 text-xs font-bold mt-0.5">Discuter avec vos patients</Text>
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
