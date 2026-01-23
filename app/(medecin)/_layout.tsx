// app/(medecin)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MedecinLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3498db',
      headerShown: true, // On garde celui-là pour avoir "Accueil" écrit proprement
    }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Mes Patients', tabBarIcon: ({color}) => <Ionicons name="people" size={24} color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} /> }} />
      
      {/* CETTE LIGNE CACHE L'ONGLET AJOUT_ORDONNANCE DU MENU DU BAS */}
      <Tabs.Screen name="ajout_ordonnance" options={{ href: null }} /> 
    </Tabs>
  );
}