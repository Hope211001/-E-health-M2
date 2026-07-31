import { useContext } from 'react';
import { Drawer } from 'expo-router/drawer';
import { AuthContext } from '../../context/AuthContext';
import CustomDrawerContent, { DrawerMenuItem } from '../../components/CustomDrawerContent';
import { APP_ROUTES } from '@/constants/routes';

export default function AdminLayout() {
  const { user } = useContext(AuthContext);
  const isSuperadmin = user?.role === 'superadmin';

  const ADMIN_MENU: DrawerMenuItem[] = [
    { label: 'Tableau de bord', icon: 'grid', route: APP_ROUTES.ADMIN.HOME },
    { label: 'Médecins', icon: 'medkit', route: APP_ROUTES.ADMIN.MEDECINS },
    { label: 'Ajouter un médecin', icon: 'person-add', route: APP_ROUTES.ADMIN.MEDECIN_ADD },
    { label: 'Patients', icon: 'people', route: APP_ROUTES.ADMIN.PATIENTS },
    { label: 'Statistiques', icon: 'bar-chart', route: APP_ROUTES.ADMIN.GRAPHES },
    ...(isSuperadmin ? [
      { label: 'Admins', icon: 'shield-checkmark' as const, route: APP_ROUTES.ADMIN.ADMINS },
      { label: 'Ajouter un admin', icon: 'shield-half' as const, route: APP_ROUTES.ADMIN.ADMIN_ADD },
      { label: 'Pharmacies de garde', icon: 'medical' as const, route: APP_ROUTES.ADMIN.PHARMACIE_GARDE },
    ] : []),
  ];

  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: '80%', maxWidth: 300 } }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} subtitle="Espace Administration" menuItems={ADMIN_MENU} />
      )}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Tableau de bord', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="graphes" options={{ title: 'Statistiques', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
