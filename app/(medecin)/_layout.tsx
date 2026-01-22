import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes

export default function MedecinTabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3498db', // Couleur de l'onglet actif (bleu)
      headerShown: true,               // Afficher le titre en haut
    }}>
      
      {/* Premier onglet : Dashboard */}
      <Tabs.Screen
        name="index" // Correspond au fichier index.tsx
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      {/* Deuxième onglet : Patients */}
      <Tabs.Screen
        name="patients" // Correspond au fichier patients.tsx
        options={{
          title: 'Mes Patients',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />

      {/* Troisième onglet : Profil */}
      <Tabs.Screen
        name="profil" // Correspond au fichier profil.tsx
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}