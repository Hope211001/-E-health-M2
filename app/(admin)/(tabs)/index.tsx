import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../../context/AuthContext';
import { authService } from '../../../api/authService';
import { APP_ROUTES } from '@/constants/routes';
import AppHeader from '../../../components/AppHeader';
import AvatarUtilisateur from '../../../components/AvatarUtilisateur';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ medecins: 0, patients: 0, admins: 0 });
  const [loading, setLoading] = useState(true);

  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => {
    // Garde contre la déconnexion : dès que l'utilisateur se déconnecte,
    // `user` passe à null et cet effet se redéclenche (isSuperadmin change de
    // valeur) — sans cette garde, il relance les requêtes sans token pendant
    // que l'écran finit de se démonter, ce qui affichait "Token manquant".
    if (!user) return;

    (async () => {
      try {
        // Seuls les compteurs nous intéressent ici : limit=1 évite de rapatrier
        // toutes les fiches, `total` porte le nombre réel de comptes.
        const [medecins, patients, admins] = await Promise.all([
          authService.listUsers('medecin', { limit: 1 }),
          authService.listUsers('patient', { limit: 1 }),
          isSuperadmin ? authService.listUsers('admin', { limit: 1 }) : Promise.resolve(null),
        ]);
        setStats({
          medecins: medecins.total,
          patients: patients.total,
          admins: admins?.total ?? 0,
        });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: error.response?.data?.error || 'Impossible de charger les stats',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isSuperadmin]);

  if (loading) return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Espace Administration" />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-slate-400 font-medium">Chargement...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Espace Administration" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* --- HEADER --- */}
        {/* Violet (accent admin) plutôt que vert : distinct du bandeau
            AppHeader (toujours vert) juste au-dessus. */}
        <View className="px-6 py-6 bg-violet-600 rounded-b-[50px] mb-8 shadow-2xl shadow-violet-200">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1 pr-3">
              <Text className="text-violet-100 font-bold text-xs uppercase tracking-[2px]">
                {isSuperadmin ? 'Super Administrateur' : 'Administrateur'}
              </Text>
              <Text className="text-3xl font-black text-white mt-1">Bonjour,</Text>
              <Text className="text-white text-2xl font-light opacity-90" numberOfLines={1}>
                {user?.prenom || user?.nom || user?.email || 'Admin'}
              </Text>
            </View>
            {/* Accès au profil : l'espace admin n'a pas d'onglet Paramètres,
                l'avatar est le point d'entrée attendu pour son propre compte. */}
            <TouchableOpacity
              onPress={() => router.push(APP_ROUTES.ADMIN.PROFIL as Href)}
              activeOpacity={0.8}
              accessibilityLabel="Mon profil"
            >
              {user?.photoURL ? (
                <AvatarUtilisateur
                  photoURL={user.photoURL}
                  prenom={user.prenom}
                  nom={user.nom}
                  email={user.email}
                  taille={56}
                />
              ) : (
                <View className="bg-white/20 w-14 h-14 rounded-2xl items-center justify-center border border-white/30">
                  <Ionicons name={isSuperadmin ? 'shield-checkmark' : 'shield'} size={26} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-violet-200 self-start px-4 py-2 rounded-full shadow-sm">
            <Text className="text-violet-950 font-black text-[10px] uppercase tracking-wider">
              {stats.medecins + stats.patients + stats.admins} compte{stats.medecins + stats.patients + stats.admins > 1 ? 's' : ''} géré{stats.medecins + stats.patients + stats.admins > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* --- STATS BENTO --- */}
        <View className="px-6 flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push(`${APP_ROUTES.ADMIN.UTILISATEURS}?role=medecin` as Href)}
            className="flex-1 bg-emerald-700 p-5 rounded-[30px] justify-between h-36 shadow-xl"
          >
            <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="medkit" size={20} color="white" />
            </View>
            <View>
              <Text className="text-white text-3xl font-black tracking-tighter">{String(stats.medecins).padStart(2, '0')}</Text>
              <Text className="text-emerald-200 font-bold text-[10px] uppercase">Médecins</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`${APP_ROUTES.ADMIN.UTILISATEURS}?role=patient` as Href)}
            className="flex-1 bg-sky-50 p-5 rounded-[30px] justify-between h-36 border border-sky-100"
          >
            <View className="bg-sky-600 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="people" size={20} color="white" />
            </View>
            <View>
              <Text className="text-sky-900 text-3xl font-black tracking-tighter">{String(stats.patients).padStart(2, '0')}</Text>
              <Text className="text-sky-500 font-bold text-[10px] uppercase">Patients</Text>
            </View>
          </TouchableOpacity>

          {isSuperadmin && (
            <TouchableOpacity
              onPress={() => router.push(`${APP_ROUTES.ADMIN.UTILISATEURS}?role=admin` as Href)}
              className="flex-1 bg-violet-50 p-5 rounded-[30px] justify-between h-36 border border-violet-100"
            >
              <View className="bg-violet-600 w-10 h-10 rounded-full items-center justify-center">
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </View>
              <View>
                <Text className="text-violet-900 text-3xl font-black tracking-tighter">{String(stats.admins).padStart(2, '0')}</Text>
                <Text className="text-violet-600 font-bold text-[10px] uppercase">Admins</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* --- ACCÈS RAPIDE --- */}
        <View className="px-6 mb-4 gap-4">
          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.ADMIN.MEDECIN_ADD as Href)}
            className="bg-emerald-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="person-add" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Ajouter un médecin</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">Créer un nouveau compte praticien</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.ADMIN.GRAPHES as Href)}
            className="bg-emerald-800 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-emerald-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="bar-chart" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Statistiques</Text>
              <Text className="text-emerald-100 text-xs font-bold mt-0.5">Statistiques des prescriptions</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>

          {/* Établissements : réservé au superadmin, et placé AVANT « ajouter un
              admin » parce que c'est l'ordre réel des opérations — un admin ne
              peut pas être créé sans établissement à lui confier. */}
          {isSuperadmin && (
            <TouchableOpacity
              onPress={() => router.push(APP_ROUTES.ADMIN.ETABLISSEMENTS as Href)}
              className="bg-violet-800 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-violet-100"
            >
              <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="business" size={30} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-lg">Établissements</Text>
                <Text className="text-violet-100 text-xs font-bold mt-0.5">Structures de santé enrôlées sur la plateforme</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="white" />
            </TouchableOpacity>
          )}

          {isSuperadmin && (
            <TouchableOpacity
              onPress={() => router.push(APP_ROUTES.ADMIN.ADMIN_ADD as Href)}
              className="bg-violet-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-violet-100"
            >
              <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="shield-half" size={30} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-lg">Ajouter un admin</Text>
                <Text className="text-violet-100 text-xs font-bold mt-0.5">Déléguer la gestion de la plateforme</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="white" />
            </TouchableOpacity>
          )}

          {/* Ouvert aux admins comme aux superadmins : les routes backend
              `/pharmacie-garde` et `/ocr` acceptent les deux rôles. */}
          <TouchableOpacity
            onPress={() => router.push(APP_ROUTES.ADMIN.PHARMACIE_GARDE as Href)}
            className="bg-cyan-600 p-6 rounded-[35px] flex-row items-center shadow-xl shadow-cyan-100"
          >
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="medical" size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Pharmacies de garde</Text>
              <Text className="text-cyan-100 text-xs font-bold mt-0.5">Publications visibles par les patients</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
