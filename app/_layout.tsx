import React, { useEffect } from 'react';
import { Stack, useRouter } from "expo-router";
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { GardeMotDePasse } from '../components/GardeMotDePasse';
import {
  setupRappelResponseHandler,
  transmettrePrisesEnAttente,
} from '../api/notificationLocal';
import { APP_ROUTES } from '@/constants/routes';

// expo-keep-awake émet parfois « Unable to activate keep awake » au démarrage
// en mode dev (bug connu d'Expo, déclenché par le dev-client, pas par notre
// code). C'est bénin mais ça affiche un écran rouge qui recouvre l'app et
// bloque l'accès aux champs. On masque ce log précis.
LogBox.ignoreLogs(['Unable to activate keep awake']);

export default function RootLayout() {
  const router = useRouter();

  // Réponses aux notifications de rappel : « J'ai pris » déclare la prise au
  // serveur, un appui sur le corps ouvre la liste du jour.
  useEffect(() => {
    const cleanup = setupRappelResponseHandler(
      () => router.push(APP_ROUTES.PATIENT.MES_RAPPELS),
    );
    return cleanup;
  }, [router]);

  // Rejoue les prises déclarées alors que le téléphone était hors ligne. Au
  // démarrage plutôt qu'à intervalle régulier : c'est le moment où le réseau
  // est le plus probablement revenu, et une file vide ne coûte rien.
  useEffect(() => { transmettrePrisesEnAttente(); }, []);

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
