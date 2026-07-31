import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, Href } from 'expo-router';
import { authService } from '../api/authService';
import { APP_ROUTES } from '../constants/routes';
import { Colors } from '@/constants/theme';

export type DrawerMenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

interface Props extends DrawerContentComponentProps {
  subtitle: string;
  menuItems: DrawerMenuItem[];
}

/**
 * Contenu du drawer natif (@react-navigation/drawer) commun aux 3 espaces
 * (patient, médecin, admin). Le drawer lui-même (overlay, geste de balayage,
 * animation) est géré nativement par la lib — ce composant ne fait que
 * dessiner l'en-tête, la liste de liens et le bouton de déconnexion.
 */
export default function CustomDrawerContent({ subtitle, menuItems, navigation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const navigate = (route: string) => {
    navigation.closeDrawer();
    router.push(route as Href);
  };

  const doLogout = async () => {
    navigation.closeDrawer();
    try {
      await authService.logout();
    } catch (e) {
      console.error('Erreur déconnexion:', e);
    } finally {
      // Vers la page de connexion (pas juste '/') : redirige explicitement
      // hors de l'espace du rôle précédent.
      router.replace(APP_ROUTES.AUTH.LOGIN as Href);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* En-tête du menu */}
      <View style={{ backgroundColor: Colors.primary, paddingTop: insets.top + 16 }} className="px-6 pb-6">
        <View className="flex-row items-center">
          <View className="bg-white rounded-xl p-1">
            <Image
              source={require('../assets/images/icon.png')}
              style={{ width: 30, height: 30, borderRadius: 8 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-white text-lg font-black ml-3 tracking-tight">Mediora</Text>
        </View>
        <Text className="text-white/80 text-xs font-bold uppercase tracking-[2px] mt-3">{subtitle}</Text>
      </View>

      <ScrollView className="flex-1 px-3 pt-4" showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          // usePathname() renvoie le chemin résolu, sans les segments de groupe
          // ((patient), (tabs)...) — on les retire aussi de item.route pour comparer.
          const strippedRoute = item.route.replace(/\/\([^)]+\)/g, '') || '/';
          const active = pathname === strippedRoute;
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => navigate(item.route)}
              className={`flex-row items-center px-4 py-3 rounded-2xl mb-1 ${active ? 'bg-emerald-50' : ''}`}
            >
              <Ionicons name={item.icon} size={20} color={active ? Colors.primary : '#64748B'} />
              <Text className={`ml-4 font-bold text-sm ${active ? 'text-emerald-700' : 'text-slate-600'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center px-4 py-3 rounded-2xl bg-red-50 border border-red-100"
        >
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text className="ml-4 font-bold text-sm text-red-600">Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
