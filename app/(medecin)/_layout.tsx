import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#7C3AED',
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="patient/list"
        options={{
          title: "Mes Patients",
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ordonnance/history"
        options={{
          title: "Ordonnances",
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="parametre/profil"
        options={{
          title: "Mon Profil",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

      {/* Cacher les sous-écrans du tab bar */}
      <Tabs.Screen name="patient/add" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/add" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/add-by-patient" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/detail" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/list" options={{ href: null }} />
    </Tabs>
  );
}