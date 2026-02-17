import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function MedecinLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#7C3AED', 
      tabBarInactiveTintColor: '#94A3B8',
      headerShown: true,
      headerShadowVisible: false, // Enlève la ligne de séparation moche
      headerStyle: {
        backgroundColor: '#F5F3FF', // Même couleur que le fond de ton écran
      },
      headerTitleStyle: {
        fontWeight: 'bold',
        color: '#1E293B',
      },
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Tableau de bord',
          headerTitle: 'Mon Espace', // Titre en haut
          headerLeft: () => null,    // <--- SUPPRIME LA FLÈCHE DE RETOUR ICI
          tabBarLabel: 'Accueil',
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="patient/list-patient" 
        options={{ 
          title: 'Mes Patients', 
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ) 
        }} 
      />

      <Tabs.Screen 
        name="profil" 
        options={{ 
          title: 'Profil', 
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ) 
        }} 
      />
      
      {/* On cache cet écran de la barre du bas */}
      <Tabs.Screen name="ordonnance/add-ordonnance" options={{ href: null }} /> 
    </Tabs>
  );
}