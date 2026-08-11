import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../../api/authService';
import AppHeader from '../../../components/AppHeader';
import { AppScrollView } from '../../../components/AppScrollView';
import CarteProfilCompte from '../../../components/CarteProfilCompte';
import { useAuth } from '../../../hooks/useAuth';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Profil du compte d'administration. L'espace admin n'en avait aucun : le
 * superadmin ne pouvait donc ni corriger son état civil ni ajouter sa photo,
 * alors qu'il peut le faire pour tous les autres comptes.
 */
export default function ProfilAdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  const couleur = isSuperadmin ? Colors.adminAccent : Colors.admin;
  const fond = isSuperadmin ? Colors.adminAccentBg : Colors.adminBg;

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Mon profil" />

      <AppScrollView contentContainerStyle={styles.scroll} bottomOffset={20}>
        <Text style={styles.titre}>Mon profil</Text>

        <CarteProfilCompte
          couleur={couleur}
          fond={fond}
          icone={isSuperadmin ? 'key' : 'shield-checkmark'}
          roleLabel={isSuperadmin ? 'Super administrateur' : 'Administrateur'}
        />

        <View style={styles.info}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoTxt}>
            Le rôle et l&apos;adresse email ne sont pas modifiables : le premier
            détermine vos droits, la seconde sert à vous connecter.
          </Text>
        </View>

        <TouchableOpacity style={styles.deconnexion} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.deconnexionTxt}>Se déconnecter</Text>
        </TouchableOpacity>
      </AppScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  titre: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  info: {
    flexDirection: 'row', gap: 8,
    marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  infoTxt: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  deconnexion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing['2xl'],
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1, borderColor: Colors.danger,
  },
  deconnexionTxt: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});