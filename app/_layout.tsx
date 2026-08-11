import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { GardeMotDePasse } from '../components/GardeMotDePasse';
import { setupRappelResponseHandler } from '../api/notificationLocal';

// expo-keep-awake émet parfois « Unable to activate keep awake » au démarrage
// en mode dev (bug connu d'Expo, déclenché par le dev-client, pas par notre
// code). C'est bénin mais ça affiche un écran rouge qui recouvre l'app et
// bloque l'accès aux champs. On masque ce log précis.
LogBox.ignoreLogs(['Unable to activate keep awake']);

export default function RootLayout() {
  // Écoute le bouton « J'ai pris » des notifications pour couper l'alarme.
  useEffect(() => {
    const cleanup = setupRappelResponseHandler();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          {/* Redirige vers le choix du mot de passe définitif tant que le
              compte utilise le code reçu par email — y compris quand la session
              est restaurée sans repasser par l'écran de connexion. */}
          <GardeMotDePasse />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
