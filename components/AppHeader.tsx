import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Colors } from '@/constants/theme';

/**
 * Bandeau Mediora commun : logo + nom + bouton menu (☰).
 * Placé en dehors de tout ScrollView pour rester fixe à l'écran ; couleur
 * verte de marque (Colors.primary) constante sur tous les écrans patient.
 * Le bouton ☰ ouvre le drawer natif (@react-navigation/drawer) le plus proche —
 * DrawerActions.openDrawer() remonte automatiquement jusqu'au Drawer ancêtre,
 * même appelé depuis un écran imbriqué dans le Tabs navigator.
 */
export default function AppHeader({ subtitle }: { subtitle?: string }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  return (
    <View style={{ backgroundColor: Colors.primary, paddingTop: insets.top + 10 }} className="px-5 pb-4 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="bg-white rounded-xl p-1">
          <Image
            source={require('../assets/images/icon-sante.png')}
            style={{ width: 26, height: 26, borderRadius: 6 }}
            resizeMode="contain"
          />
        </View>
        <View className="ml-3">
          <Text className="text-white text-base font-black tracking-tight">Mediora</Text>
          {subtitle ? <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{subtitle}</Text> : null}
        </View>
      </View>

      <TouchableOpacity
        className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 items-center justify-center"
        onPress={openDrawer}
      >
        <Ionicons name="menu" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}
