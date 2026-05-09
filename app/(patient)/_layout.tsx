import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestNotificationPermission } from '../../api/notificationLocal';

export default function PatientLayout() {
  useEffect(() => {
    requestNotificationPermission().catch((e) =>
      console.warn('Permission notifications refusée ou erreur:', e)
    );
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4F46E5',
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ordonnance"
        options={{
          title: 'Ordonnances',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rappels"
        options={{
          title: 'Rappels',
          tabBarIcon: ({ color }) => <Ionicons name="alarm" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
      {/* Écran caché du tab bar */}
      <Tabs.Screen name="detail-prescription" options={{ href: null }} />
    </Tabs>
  );
}
