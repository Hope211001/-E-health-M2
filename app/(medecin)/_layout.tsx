import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent, { DrawerMenuItem } from '../../components/CustomDrawerContent';
import { APP_ROUTES } from '@/constants/routes';

const MEDECIN_MENU: DrawerMenuItem[] = [
  { label: 'Accueil', icon: 'home', route: APP_ROUTES.MEDECIN.HOME },
  { label: 'Mes Patients', icon: 'people', route: APP_ROUTES.MEDECIN.PATIENT.LISTE },
  { label: 'Ajouter un patient', icon: 'person-add', route: APP_ROUTES.MEDECIN.PATIENT.ADD },
  { label: 'Nouvelle ordonnance', icon: 'medical', route: APP_ROUTES.MEDECIN.ORDONNANCE.ADD },
  { label: 'Historique ordonnances', icon: 'document-text', route: APP_ROUTES.MEDECIN.ORDONNANCE.HISTORY },
  { label: 'Messages', icon: 'chatbubbles', route: '/(conversation)/list' },
  { label: 'Notifications', icon: 'notifications', route: '/(notification)/list' },
  { label: 'Mon profil', icon: 'person', route: APP_ROUTES.MEDECIN.PARAMETRE.PROFIL },
  { label: 'Changer mon mot de passe', icon: 'key', route: APP_ROUTES.AUTH.CHANGER_MOT_DE_PASSE },
];

export default function MedecinLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: '80%', maxWidth: 300 } }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} subtitle="Espace Médical" menuItems={MEDECIN_MENU} />
      )}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Accueil', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
