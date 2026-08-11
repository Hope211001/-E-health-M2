import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../context/AuthContext';
import { Colors } from '@/constants/theme';

export default function AdminTabsLayout() {
  const { user } = useContext(AuthContext);
  const isSuperadmin = user?.role === 'superadmin';
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.admin,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        height: 64 + insets.bottom,
        paddingBottom: 8 + insets.bottom,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
        }}
      />

      {/* Un seul onglet pour les comptes : l'écran expose lui-même un bouton
          par type (médecins / patients / admins selon le rôle). */}
      <Tabs.Screen
        name="utilisateurs"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="graphes"
        options={{
          title: 'Statistiques',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="pharmacie-garde"
        options={{
          title: 'Pharmacies',
          tabBarIcon: ({ color }) => <Ionicons name="medical" size={22} color={color} />,
          href: isSuperadmin ? undefined : null,
        }}
      />

      {/* Profil accessible depuis l'avatar du tableau de bord plutôt que par un
          onglet : à cinq, les libellés de la barre deviennent illisibles. */}
      <Tabs.Screen name="profil" options={{ href: null }} />

      <Tabs.Screen name="medecin-add" options={{ href: null }} />
      <Tabs.Screen name="patient-add" options={{ href: null }} />
      <Tabs.Screen name="admin-add" options={{ href: null }} />
      <Tabs.Screen name="pharmacie-garde-form" options={{ href: null }} />
      <Tabs.Screen name="pharmacie-garde-detail" options={{ href: null }} />
      <Tabs.Screen name="ocr" options={{ href: null }} />
      <Tabs.Screen name="dossier-patient" options={{ href: null }} />
      <Tabs.Screen name="dossier-medecin" options={{ href: null }} />
    </Tabs>
  );
}
