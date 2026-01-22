import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: '#3498db' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      {/* Tu peux définir des titres spécifiques par route ici si besoin */}
      <Stack.Screen name="index" options={{ title: 'Connexion' }} />
      <Stack.Screen name="medecin_home" options={{ title: 'Tableau de bord' }} />
    </Stack>
  );
}