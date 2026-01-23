// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* On cache le header pour l'écran de login */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* ON CACHE LE HEADER ICI pour ne plus voir la flèche et "(medecin)" */}
      <Stack.Screen name="(medecin)" options={{ headerShown: false }} />
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
    </Stack>
  );
}