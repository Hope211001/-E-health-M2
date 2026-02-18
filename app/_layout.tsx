// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Importe ton fichier de config firebase ici pour être sûr qu'il est initialisé au démarrage
import './../api/firebase'; 

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        {/* Écran d'entrée (Login/Landing) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Groupes de navigation (Tabs ou Stack internes) */}
        <Stack.Screen name="(medecin)" options={{ headerShown: false }} />
        <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}