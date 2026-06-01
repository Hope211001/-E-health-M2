import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_ROUTES } from '../../constants/routes';
import LogoutButton from '../../components/bouton/logoutBouton';
import { notificationService } from '../../api/notificationService';

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
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#059669" />
      <Text className="mt-4 text-slate-400 font-medium">Chargement du cabinet...</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* --- HEADER PREMIUM --- */}
        <View className="px-6 py-6 bg-emerald-600 rounded-b-[50px] mb-8 shadow-2xl shadow-emerald-200">
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
            <View>
              <Text className="text-emerald-100 font-bold text-xs uppercase tracking-[2px]">Espace Médical</Text>
              <Text className="text-3xl font-black text-white mt-1">Bonjour,</Text>
              <Text className="text-white text-2xl font-light opacity-90">Dr. {doctorData?.nom || "Spécialiste"}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              {/* Cloche de notifications */}
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
          <View className="bg-emerald-400 self-start px-4 py-2 rounded-full shadow-sm">
            <Text className="text-emerald-950 font-black text-[10px] uppercase tracking-wider">
              {doctorData?.specialite || "Médecin Généraliste"}
            </Text>
          </View>
        </View>

        {/* --- SECTION STATS BENTO --- */}
        <View className="px-6 flex-row gap-4 mb-8">
            {/* Stat Patients */}
            <TouchableOpacity 
                onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.LISTE as Href)}
                className="flex-1 bg-emerald-700 p-6 rounded-[35px] justify-between h-40 shadow-xl"
            >
                <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="people" size={20} color="white" />
                </View>
                <View>
                    <Text className="text-white text-4xl font-black tracking-tighter">{stats.patients}</Text>
                    <Text className="text-emerald-200 font-bold text-[10px] uppercase">Patients Actifs</Text>
                </View>
            </TouchableOpacity>

            {/* Stat Ordonnances */}
            <View className="flex-1 bg-emerald-50 p-6 rounded-[35px] justify-between h-40 border border-emerald-100">
                <View className="bg-emerald-600 w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="document-text" size={20} color="white" />
                </View>
                <View>
                    <Text className="text-emerald-900 text-4xl font-black tracking-tighter">{stats.ordonnances}</Text>
                    <Text className="text-emerald-500 font-bold text-[10px] uppercase">Ordonnances</Text>
                </View>
            </View>
        </View>

        {/* --- QUICK ACTIONS SECTION --- */}
        <View className="px-6 mb-8">
            <Text className="text-xl font-black text-slate-900 mb-5">Actions de Santé</Text>
            
            <View className="flex-row flex-wrap justify-between">
                {/* Gros Bouton Principal */}
                <BigAction 
                    title="Nouveau Patient" 
                    subtitle="Enregistrer un dossier" 
                    icon="person-add" 
                    color="#059669" 
                    onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.ADD as Href)} 
                />
                
                {/* Grille de petits boutons */}
                <View className="w-[48%] gap-4">
                    <SmallAction
                        title="Prescrire"
                        icon="medical"
                        color="#10B981"
                        bg="bg-emerald-50"
                        onPress={() => router.push(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href)}
                    />
                    <SmallAction
                        title="Messages"
                        icon="chatbubbles"
                        color="#059669"
                        bg="bg-emerald-50"
                        onPress={() => router.push('/(conversation)/list' as Href)}
                    />
                </View>
            </View>

            {/* Bouton Messages */}
            <TouchableOpacity
                onPress={() => router.push('/(conversation)/list' as Href)}
                className="bg-emerald-50 p-5 rounded-[30px] flex-row items-center mt-4 border border-emerald-100"
            >
                <View className="bg-emerald-600 p-3 rounded-xl mr-4">
                    <Ionicons name="chatbubbles" size={22} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">Messages</Text>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">Discuter avec vos patients</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#34D399" />
            </TouchableOpacity>
        </View>

        {/* --- LOGOUT SECTION --- */}
        <View className="px-6 mt-4">
            <LogoutButton />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Sous-composant pour les grandes actions (ex: Nouveau Patient)
 */
function BigAction({ title, subtitle, icon, color, onPress }: any) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            className="w-[48%] bg-white p-6 rounded-[40px] h-52 justify-between border border-slate-100 shadow-sm"
            style={{ elevation: 3 }}
        >
            <View className="bg-emerald-50 w-14 h-14 rounded-2xl items-center justify-center">
                <Ionicons name={icon} size={30} color={color} />
            </View>
            <View>
                <Text className="text-slate-900 font-black text-lg leading-6">{title}</Text>
                <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase">{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
}

/**
 * Sous-composant pour les petites actions (Prescrire, Paramètres)
 */
function SmallAction({ title, icon, color, bg, onPress }: any) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            className={`w-full ${bg} p-5 rounded-[30px] flex-row items-center`}
        >
            <View className="bg-white/60 p-2 rounded-xl mr-3">
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-slate-800 font-black text-xs">{title}</Text>
        </TouchableOpacity>
    );
}