import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_ROUTES } from '../../constants/routes';
import LogoutButton from '../../components/bouton/logoutBouton';

export default function MedecinDashboard() {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [stats, setStats] = useState({ patients: 0, ordonnances: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
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
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text className="mt-4 text-slate-400 font-medium">Chargement du cabinet...</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* --- HEADER PREMIUM --- */}
        <View className="px-6 py-6 bg-purple-700 rounded-b-[50px] mb-8 shadow-2xl shadow-purple-300">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-purple-200 font-bold text-xs uppercase tracking-[2px]">Espace Médical</Text>
              <Text className="text-3xl font-black text-white mt-1">Bonjour,</Text>
              <Text className="text-white text-2xl font-light opacity-90">Dr. {doctorData?.nom || "Spécialiste"}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(APP_ROUTES.MEDECIN.PARAMETRE.PROFIL as Href)}
              className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
            >
              <Ionicons name="person-outline" size={26} color="white" />
            </TouchableOpacity>
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
                className="flex-1 bg-slate-900 p-6 rounded-[35px] justify-between h-40 shadow-xl"
            >
                <View className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="people" size={20} color="#A78BFA" />
                </View>
                <View>
                    <Text className="text-white text-4xl font-black tracking-tighter">{stats.patients}</Text>
                    <Text className="text-slate-400 font-bold text-[10px] uppercase">Patients Actifs</Text>
                </View>
            </TouchableOpacity>

            {/* Stat Ordonnances */}
            <View className="flex-1 bg-purple-50 p-6 rounded-[35px] justify-between h-40 border border-purple-100">
                <View className="bg-purple-600 w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="document-text" size={20} color="white" />
                </View>
                <View>
                    <Text className="text-purple-900 text-4xl font-black tracking-tighter">{stats.ordonnances}</Text>
                    <Text className="text-purple-400 font-bold text-[10px] uppercase">Ordonnances</Text>
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
                    color="#7C3AED" 
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
                        title="Paramètres" 
                        icon="settings-sharp" 
                        color="#64748B" 
                        bg="bg-slate-100" 
                        onPress={() => router.push(APP_ROUTES.MEDECIN.PARAMETRE.PROFIL as Href)} 
                    />
                </View>
            </View>
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
            <View className="bg-purple-50 w-14 h-14 rounded-2xl items-center justify-center">
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