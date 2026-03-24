import React from 'react';
import { TouchableOpacity, Text, View, Alert } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { authService } from '../../api/authService'; // Vérifie bien ce chemin
import { Ionicons } from '@expo/vector-icons';
import { APP_ROUTES } from '../../constants/routes';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment quitter la session ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
              // On redirige vers la page de LOGIN qui existe bien dans APP_ROUTES
              router.replace(APP_ROUTES.AUTH.LOGIN as Href);
            } catch (error) {
              console.error("Erreur logout:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handleLogout}
      activeOpacity={0.7}
      className="flex-row items-center justify-center p-5 bg-red-50 rounded-[24px] border border-red-100 shadow-sm"
    >
      <View className="bg-red-100 p-2 rounded-xl mr-3">
        <Ionicons name="log-out" size={20} color="#EF4444" />
      </View>
      <Text className="text-red-600 font-black text-base italic">Déconnexion sécurisée</Text>
    </TouchableOpacity>
  );
}