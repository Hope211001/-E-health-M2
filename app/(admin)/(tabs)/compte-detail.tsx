/**
 * Fiche d'un compte d'administration (admin ou superadmin).
 *
 * Les médecins et les patients ont un dossier — file de patients, ordonnances,
 * observance. Un compte d'administration n'a rien de tout cela : il n'a qu'une
 * identité. D'où cet écran plus court, et non un troisième dossier qui
 * afficherait des sections vides.
 *
 * Il porte aussi la photo du compte : les listes ne la chargent délibérément
 * pas — une vignette par ligne, c'est autant de requêtes Cloudinary au
 * défilement — et cet écran, ouvert à la demande, n'en déclenche qu'une.
 *
 * Lecture seule. La modification passe par `PATCH /auth/profile/:uid`, que le
 * titulaire fait depuis son propre profil ; un admin ne peut de toute façon
 * pas éditer un pair ni un superadmin.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../../api/authService';
import { User } from '../../../types/collection';
import AppHeader from '../../../components/AppHeader';
import AvatarUtilisateur from '../../../components/AvatarUtilisateur';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  iconeEtablissement, iconeOrigine, libelleEtablissement, origineCompte,
} from '@/utils/roles';
import { dateNaissanceAvecAge } from '@/utils/dateNaissance';

/** Ligne « libellé / valeur ». Masquée quand la valeur est absente. */
function Info({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValeur}>{valeur}</Text>
    </View>
  );
}

export default function CompteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [compte, setCompte] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      (async () => {
        if (!id) return;
        try {
          const data = await authService.getProfile(id);
          if (actif) setCompte(data);
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: error.response?.data?.error || 'Compte introuvable',
          });
        } finally {
          if (actif) setLoading(false);
        }
      })();
      return () => { actif = false; };
    }, [id]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Fiche du compte" />
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.adminAccent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!compte) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Fiche du compte" />
        <View style={styles.centre}>
          <Text style={styles.vide}>Compte introuvable.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retour}>
            <Text style={styles.retourTxt}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isSuperadmin = compte.role === 'superadmin';
  const couleur = isSuperadmin ? Colors.adminAccent : Colors.admin;
  const fond = isSuperadmin ? Colors.adminAccentBg : Colors.adminBg;
  const nomComplet = `${compte.prenom || ''} ${compte.nom || ''}`.trim();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Fiche du compte" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* La photo n'est chargée que sur cet écran, jamais dans la liste. */}
          <AvatarUtilisateur
            photoURL={compte.photoURL}
            prenom={compte.prenom}
            nom={compte.nom}
            email={compte.email}
            taille={72}
            couleur={couleur}
            fond={fond}
            icone={isSuperadmin ? 'key' : 'shield-checkmark'}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.titre} numberOfLines={1}>
              {nomComplet || compte.email}
            </Text>
            <View style={[styles.badge, { backgroundColor: fond }]}>
              <Ionicons
                name={isSuperadmin ? 'key' : 'shield-checkmark'}
                size={11}
                color={couleur}
              />
              <Text style={[styles.badgeTxt, { color: couleur }]}>
                {isSuperadmin ? 'Super administrateur' : 'Administrateur'}
              </Text>
            </View>
          </View>

          <View style={[
            styles.statutBadge,
            { backgroundColor: compte.statut === 'actif' ? Colors.successBg : Colors.dangerBg },
          ]}>
            <Text style={[
              styles.statutTxt,
              { color: compte.statut === 'actif' ? Colors.success : Colors.danger },
            ]}>
              {compte.statut === 'actif' ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>Identité</Text>
        <View style={styles.carte}>
          <Info label="Email" valeur={compte.email} />
          <Info label="Téléphone" valeur={compte.telephone} />
          <Info
            label="Sexe"
            valeur={compte.sexe === 'M' ? 'Masculin' : compte.sexe === 'F' ? 'Féminin' : null}
          />
          <Info label="Naissance" valeur={dateNaissanceAvecAge(compte.dateNaissance)} />
          <Info label="Adresse" valeur={compte.adresse} />
        </View>

        <Text style={styles.section}>Compte</Text>
        <View style={styles.carte}>
          {/* Portée du compte : l'établissement pour un admin, le pays entier
              pour un superadmin. C'est la première chose à vérifier quand un
              administrateur signale qu'il « ne voit pas » un utilisateur. */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Portée</Text>
            <View style={styles.origine}>
              <Ionicons
                name={iconeEtablissement(compte.etablissement, compte.role)}
                size={13}
                color={Colors.textMuted}
              />
              <Text style={styles.infoValeur}>
                {libelleEtablissement(compte.etablissement, compte.role)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Origine</Text>
            <View style={styles.origine}>
              <Ionicons name={iconeOrigine(compte)} size={13} color={Colors.textMuted} />
              <Text style={styles.infoValeur}>{origineCompte(compte)}</Text>
            </View>
          </View>
          <Info
            label="Connexion"
            valeur={compte.authProvider === 'google' ? 'Google' : 'Mot de passe'}
          />
          {/* Signale un email d'identifiants qui n'est jamais parti : le compte
              existe mais son titulaire ne peut pas encore se connecter. */}
          {compte.identifiantsEnvoyes === false ? (
            <View style={styles.alerte}>
              <Ionicons name="mail-unread-outline" size={14} color={Colors.danger} />
              <Text style={styles.alerteTxt}>
                L&apos;email d&apos;identifiants n&apos;a pas pu être envoyé. Utilisez
                « Renvoyer les identifiants » depuis la liste des comptes.
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Identifiant</Text>
            <Text style={[styles.infoValeur, styles.identifiant]} selectable>
              {compte.uid}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: { padding: 4 },
  titre: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statutTxt: { fontSize: 11, fontWeight: '800' },
  section: {
    fontSize: 13, fontWeight: '800', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Spacing.sm, marginLeft: 4,
  },
  carte: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: 7,
  },
  infoLabel: { fontSize: 13, color: Colors.textMuted },
  infoValeur: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right' },
  identifiant: { fontFamily: Fonts?.mono, fontSize: 11, letterSpacing: 0.2 },
  origine: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  alerte: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginTop: Spacing.sm, padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg,
  },
  alerteTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  vide: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  retour: { paddingHorizontal: Spacing.xl, paddingVertical: 10 },
  retourTxt: { color: Colors.adminAccent, fontWeight: '700' },
});
