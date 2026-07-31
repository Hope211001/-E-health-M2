import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent, { DrawerMenuItem } from '../../components/CustomDrawerContent';
import { APP_ROUTES } from '../../constants/routes';

const PATIENT_MENU: DrawerMenuItem[] = [
  { label: 'Accueil', icon: 'home', route: APP_ROUTES.PATIENT.HOME },
  { label: 'Mes Ordonnances', icon: 'document-text', route: '/(patient)/(tabs)/ordonnance' },
  { label: 'Rappels', icon: 'alarm', route: APP_ROUTES.PATIENT.MES_RAPPELS },
  { label: 'Pharmacies de garde', icon: 'medical', route: APP_ROUTES.PATIENT.PHARMACIES_GARDE },
  { label: 'Carte des pharmacies', icon: 'map', route: APP_ROUTES.PATIENT.PHARMACIES_MAP },
  { label: 'Messages', icon: 'chatbubbles', route: '/(conversation)/list' },
  { label: 'Notifications', icon: 'notifications', route: '/(notification)/list' },
  { label: 'Paramètres', icon: 'settings', route: '/(patient)/(tabs)/parametres' },
];

export default function PatientLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: '80%', maxWidth: 300 } }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} subtitle="Espace Patient" menuItems={PATIENT_MENU} />
      )}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Accueil', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="detail-prescription" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="pharmacies-map" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
