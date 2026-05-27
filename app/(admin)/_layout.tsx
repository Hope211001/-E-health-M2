import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Colors } from '@/constants/theme';

export default function AdminLayout() {
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

      <Tabs.Screen
        name="medecins"
        options={{
          title: 'Médecins',
          tabBarIcon: ({ color }) => <Ionicons name="medkit" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="admins"
        options={{
          title: 'Admins',
          tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={22} color={color} />,
          href: isSuperadmin ? undefined : null,
        }}
      />

      <Tabs.Screen name="medecin-add" options={{ href: null }} />
      <Tabs.Screen name="admin-add" options={{ href: null }} />
    </Tabs>
  );
}
