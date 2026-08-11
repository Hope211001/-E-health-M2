import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { requestNotificationPermission } from '../../../api/notificationLocal';
import { auth, db } from '../../../api/firebase';
import { useAlertesNonPrises } from '../../../hooks/useCompteursNonPris';
import { Colors } from '@/constants/theme';

/**
 * Pastille rouge des compteurs « non pris ». Sans surcharge, React Navigation
 * la colore avec la teinte active de l'onglet — verte pour le patient — ce qui
 * la ferait passer pour une information neutre au lieu d'une alerte.
 */
const BADGE_ROUGE = {
  backgroundColor: Colors.danger,
  color: Colors.textInverse,
  fontSize: 10,
  fontWeight: '800' as const,
};

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();
  const [enAttenteCount, setEnAttenteCount] = useState(0);

  // Prises du jour pas encore validées — pastille rouge sur « Rappels ».
  const nonPrises = useAlertesNonPrises();

  useEffect(() => {
    requestNotificationPermission().catch((e) =>
      console.warn('Permission notifications refusée ou erreur:', e)
    );
  }, []);

  // Badge de l'onglet Ordonnances : nombre de prescriptions en attente de démarrage.
  // onSnapshot (plutôt qu'un fetch ponctuel) car ce layout reste monté pendant
  // toute la navigation entre onglets, donc un simple useFocusEffect ne se
  // redéclencherait pas quand le patient démarre une prescription puis revient.
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSnapshot?.();
      if (!user) {
        setEnAttenteCount(0);
        return;
      }
      const q = query(
        collection(db, 'prescriptions'),
        where('patientId', '==', user.uid),
        where('statut', '==', 'en_attente')
      );
      unsubscribeSnapshot = onSnapshot(q, (snap) => setEnAttenteCount(snap.size));
    });

    return () => {
      unsubscribeSnapshot?.();
      unsubscribeAuth();
    };
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.patient,
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
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ordonnance"
        options={{
          title: 'Ordonnances',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
          tabBarBadge: enAttenteCount > 0 ? enAttenteCount : undefined,
        }}
      />
      <Tabs.Screen
        name="rappels"
        options={{
          title: 'Rappels',
          tabBarIcon: ({ color }) => <Ionicons name="alarm" size={22} color={color} />,
          // Au-delà de 99, le nombre déborderait de la pastille.
          tabBarBadge: nonPrises > 0 ? (nonPrises > 99 ? '99+' : nonPrises) : undefined,
          tabBarBadgeStyle: BADGE_ROUGE,
        }}
      />
      <Tabs.Screen
        name="pharmacies"
        options={{
          title: 'Garde',
          tabBarIcon: ({ color }) => <Ionicons name="medical" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
