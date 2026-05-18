import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function MedecinLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="patient/list"
        options={{
          title: "Mes patients",
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ordonnance/history"
        options={{
          title: "Ordonnances",
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="parametre/profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />

      <Tabs.Screen name="patient/add" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/add" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/add-by-patient" options={{ href: null }} />
      <Tabs.Screen name="ordonnance/detail" options={{ href: null }} />
    </Tabs>
  );
}
