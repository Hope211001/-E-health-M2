import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMedicamentsManques } from '../../../hooks/useCompteursNonPris';
import { Colors } from '@/constants/theme';

/**
 * Pastille rouge du compteur « médicament non pris ». Sans surcharge, React
 * Navigation la colore avec la teinte active de l'onglet — verte ici — ce qui
 * la ferait passer pour une information neutre au lieu d'une alerte.
 */
const BADGE_ROUGE = {
  backgroundColor: Colors.danger,
  color: Colors.textInverse,
  fontSize: 10,
  fontWeight: '800' as const,
};

export default function MedecinTabsLayout() {
  const insets = useSafeAreaInsets();

  // Oublis de prise signalés par les patients, non encore lus. La pastille est
  // portée par « Accueil » : c'est l'onglet qui contient la cloche de
  // notifications, donc là où le médecin ira les consulter.
  const manques = useMedicamentsManques();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
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
          title: "Accueil",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
          // Au-delà de 99, le nombre déborderait de la pastille.
          tabBarBadge: manques > 0 ? (manques > 99 ? '99+' : manques) : undefined,
          tabBarBadgeStyle: BADGE_ROUGE,
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
