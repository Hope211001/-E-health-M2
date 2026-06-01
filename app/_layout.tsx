import React from 'react';
import { Stack } from "expo-router";
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';

// expo-keep-awake émet parfois « Unable to activate keep awake » au démarrage
// en mode dev (bug connu d'Expo, déclenché par le dev-client, pas par notre
// code). C'est bénin mais ça affiche un écran rouge qui recouvre l'app et
// bloque l'accès aux champs. On masque ce log précis.
LogBox.ignoreLogs(['Unable to activate keep awake']);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
