import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestNotificationPermission } from '../../api/notificationLocal';
import { Colors } from '@/constants/theme';

export default function PatientLayout() {
  useEffect(() => {
    requestNotificationPermission().catch((e) =>
      console.warn('Permission notifications refusée ou erreur:', e)
    );
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.patient,
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
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ordonnance"
        options={{
          title: 'Ordonnances',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rappels"
        options={{
          title: 'Rappels',
          tabBarIcon: ({ color }) => <Ionicons name="alarm" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
        }}
      />
      {/* Écran caché du tab bar */}
      <Tabs.Screen name="detail-prescription" options={{ href: null }} />
    </Tabs>
  );
}
