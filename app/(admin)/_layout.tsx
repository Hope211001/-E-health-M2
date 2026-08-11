import { useContext } from 'react';
import { Drawer } from 'expo-router/drawer';
import { AuthContext } from '../../context/AuthContext';
import CustomDrawerContent, { DrawerMenuItem } from '../../components/CustomDrawerContent';
import { APP_ROUTES } from '@/constants/routes';

export default function AdminLayout() {
  const { user } = useContext(AuthContext);
  const isSuperadmin = user?.role === 'superadmin';

  // Les listes médecins / patients / admins sont regroupées dans l'écran
  // "Utilisateurs", qui expose un onglet par type de compte selon le rôle.
  const ADMIN_MENU: DrawerMenuItem[] = [
    { label: 'Tableau de bord', icon: 'grid', route: APP_ROUTES.ADMIN.HOME },
    { label: 'Utilisateurs', icon: 'people', route: APP_ROUTES.ADMIN.UTILISATEURS },
    { label: 'Statistiques', icon: 'bar-chart', route: APP_ROUTES.ADMIN.GRAPHES },
    { label: 'Ajouter un médecin', icon: 'person-add', route: APP_ROUTES.ADMIN.MEDECIN_ADD },
    { label: 'Ajouter un patient', icon: 'people-circle', route: APP_ROUTES.ADMIN.PATIENT_ADD },
    ...(isSuperadmin ? [
      { label: 'Ajouter un admin', icon: 'shield-half' as const, route: APP_ROUTES.ADMIN.ADMIN_ADD },
      { label: 'Pharmacies de garde', icon: 'medical' as const, route: APP_ROUTES.ADMIN.PHARMACIE_GARDE },
    ] : []),
    { label: 'Changer mon mot de passe', icon: 'key', route: APP_ROUTES.AUTH.CHANGER_MOT_DE_PASSE },
  ];

  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: '80%', maxWidth: 300 } }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} subtitle="Espace Administration" menuItems={ADMIN_MENU} />
      )}
    >
      {/* Tous les écrans admin vivent désormais dans (tabs) — le drawer n'a
          plus qu'un seul enfant, et sa liste de liens est dessinée par
          CustomDrawerContent à partir de ADMIN_MENU. */}
      <Drawer.Screen name="(tabs)" options={{ title: 'Tableau de bord', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
