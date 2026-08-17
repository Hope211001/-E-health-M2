import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { authService } from '../../../api/authService';
import { InfoIdentifiants } from '../../../components/InfoIdentifiants';
import PhotoProfilPicker from '../../../components/PhotoProfilPicker';
import SelecteurSexe from '../../../components/SelecteurSexe';
import SelecteurVille from '../../../components/SelecteurVille';
import SelecteurEtablissement from '../../../components/SelecteurEtablissement';
import ChampDateNaissance from '../../../components/ChampDateNaissance';
import type { Sexe } from '../../../types/collection';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { versISO } from '@/utils/dateNaissance';
import { useAuth } from '../../../hooks/useAuth';

type RoleAdministration = 'admin' | 'superadmin';

/**
 * Les deux rôles créables ici. Le superadmin donne les mêmes droits que celui
 * qui le crée — d'où l'avertissement affiché : c'est une action sans retour
 * possible depuis l'application, un superadmin ne pouvant pas être rétrogradé.
 */
const ROLES: {
  cle: RoleAdministration;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    cle: 'admin',
    label: 'Administrateur',
    description: 'Consulte les comptes et les dossiers, gère les pharmacies de garde.',
    icon: 'shield-checkmark',
  },
  {
    cle: 'superadmin',
    label: 'Super administrateur',
    description: 'Tous les droits : création de comptes et activation/désactivation.',
    icon: 'key',
  },
];

// Pas de champ mot de passe : le backend en génère un et l'envoie par email au
// titulaire. Le superadmin qui crée le compte ne le connaît donc jamais — ce
// qui compte particulièrement ici, où le compte créé peut avoir ses propres
// pouvoirs.
//
// `.trim()` avant les contrôles de longueur : une saisie faite d'espaces ne
// doit pas passer pour une valeur renseignée.
const schema = z.object({
  email: z.string().trim().email("Email invalide"),
  tel: z.string().trim().min(8, "Téléphone invalide"),
  nom: z.string().trim().min(1, "Nom requis"),
  prenom: z.string().trim().min(1, "Prénom requis"),
  // Facultative : elle n'entre dans aucun traitement, seulement dans le profil.
  adresse: z.string().trim().max(200, "Adresse : 200 caractères maximum"),
});

export default function AdminAddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: '', tel: '', nom: '', prenom: '', adresse: '',
  });
  const [sexe, setSexe] = useState<Sexe | ''>('');
  // Référence vers le référentiel `villes` ; facultative sur un compte.
  const [villeId, setVilleId] = useState('');
  const [etablissementId, setEtablissementId] = useState('');
  // Hors du formulaire zod : la saisie 'JJ/MM/AAAA' n'est convertie qu'à
  // l'envoi, une date en cours de frappe n'ayant pas de forme ISO.
  const [naissance, setNaissance] = useState('');
  const [role, setRole] = useState<RoleAdministration>('admin');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(false);

  const roleChoisi = ROLES.find((r) => r.cle === role)!;
  const accent = role === 'superadmin' ? Colors.adminAccent : Colors.admin;
  const accentSombre = role === 'superadmin' ? Colors.adminAccentDark : Colors.adminDark;
  const accentFond = role === 'superadmin' ? Colors.adminAccentBg : Colors.adminBg;

  const update = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    const validation = schema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: validation.error.issues[0]?.message,
      });
      return;
    }

    const dateNaissance = versISO(naissance);
    if (dateNaissance === null) {
      Toast.show({
        type: 'error',
        text1: 'Date de naissance invalide',
        text2: 'Format attendu : JJ/MM/AAAA',
      });
      return;
    }

    // Un administrateur EST un périmètre : le créer sans établissement
    // reviendrait à créer un compte qui ne peut rien administrer, et qui serait
    // refusé par le serveur à la première création d'utilisateur. Le
    // superadmin, lui, est national et n'en reçoit aucun.
    if (role === 'admin' && !etablissementId) {
      Toast.show({
        type: 'error',
        text1: 'Établissement requis',
        text2: "Choisissez l'établissement que cet administrateur va gérer.",
      });
      return;
    }

    setLoading(true);
    try {
      const propre = validation.data;
      const cree = await authService.registerAdmin(
        propre.email, propre.tel, propre.nom, propre.prenom,
        { role, photo, sexe, dateNaissance, adresse: propre.adresse, etablissementId, villeId },
      );

      // Le compte existe quoi qu'il arrive : seul l'email a pu échouer.
      Toast.show(
        cree.emailEnvoye === false
          ? {
            type: 'error',
            text1: 'Compte créé, email non envoyé',
            text2: "Utilisez « Renvoyer les identifiants » depuis la liste des comptes.",
          }
          : {
            type: 'success',
            text1: role === 'superadmin' ? 'Super administrateur créé' : 'Admin créé',
            text2: `Identifiants envoyés à ${propre.email}`,
          },
      );
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Création impossible',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ajouter un compte d&apos;administration</Text>
            <Text style={styles.subtitle}>Action réservée au superadmin</Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* Type de compte : un superadmin peut se donner un pair, ce qui est
              le seul moyen d'en créer un second après l'amorçage par script. */}
          <Text style={styles.label}>Type de compte</Text>
          <View style={styles.roles}>
            {ROLES.map((r) => {
              const choisi = r.cle === role;
              const couleur = r.cle === 'superadmin' ? Colors.adminAccent : Colors.admin;
              const fond = r.cle === 'superadmin' ? Colors.adminAccentBg : Colors.adminBg;
              return (
                <TouchableOpacity
                  key={r.cle}
                  style={[
                    styles.roleRow,
                    choisi && { backgroundColor: fond, borderColor: couleur },
                  ]}
                  onPress={() => setRole(r.cle)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={choisi ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={choisi ? couleur : Colors.textMuted}
                  />
                  <Ionicons name={r.icon} size={18} color={choisi ? couleur : Colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleLabel, choisi && { color: couleur }]}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {role === 'superadmin' && (
            <View style={styles.avertissement}>
              <Ionicons name="warning-outline" size={16} color={Colors.warning} />
              <Text style={styles.avertissementTxt}>
                Ce compte aura les mêmes pouvoirs que le vôtre sur l&apos;ensemble
                du pays, tous établissements confondus, y compris celui de
                désactiver d&apos;autres comptes. Le rôle ne pourra pas être modifié ensuite.
              </Text>
            </View>
          )}

          {/* Masqué pour un superadmin créé : sa portée est nationale, il n'est
              rattaché à aucun établissement. Afficher un sélecteur inopérant
              laisserait croire le contraire. */}
          <SelecteurEtablissement
            valeur={etablissementId}
            onChange={setEtablissementId}
            role={user?.role}
            couleur={accent}
            fond={accentFond}
            masque={role === 'superadmin'}
          />

          <PhotoProfilPicker
            valeur={photo}
            onChange={setPhoto}
            couleur={accent}
            fond={accentFond}
            icone={roleChoisi.icon}
            prenom={form.prenom}
            nom={form.nom}
          />

          <Field label="Prénom" value={form.prenom} onChangeText={update('prenom')} autoCapitalize="words" />
          <Field label="Nom" value={form.nom} onChangeText={update('nom')} autoCapitalize="words" />
          <Field
            label="Adresse"
            value={form.adresse}
            onChangeText={update('adresse')}
            autoCapitalize="sentences"
            placeholder="Facultative — ex : Lot II M 45 bis, Antananarivo"
          />

          <SelecteurSexe
            valeur={sexe}
            onChange={setSexe}
            couleur={accent}
            fond={accentFond}
          />

          {/* Ville de résidence : choisie dans le référentiel national, jamais
              saisie librement — deux orthographes de la même commune la
              rendraient impossible à regrouper dans les statistiques. */}
          <SelecteurVille
            valeur={villeId}
            onChange={setVilleId}
            label="Ville"
            facultatif
          />

          <ChampDateNaissance
            valeur={naissance}
            onChange={setNaissance}
            couleur={accent}
          />
          <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />

          <InfoIdentifiants couleur={accent} fond={accentFond} />

          <Field label="Téléphone" value={form.tel} onChangeText={update('tel')} keyboardType="phone-pad" />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[accent, accentSombre]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : (
                  <Text style={styles.primaryBtnText}>
                    {role === 'superadmin'
                      ? 'Créer le super administrateur'
                      : "Créer l'administrateur"}
                  </Text>
                )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        </View>
    </AppScrollView>
  );
}

function Field({
  label, ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        {...props}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  label: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 6, marginLeft: 4, fontSize: 14 },
  roles: { gap: 8, marginBottom: Spacing.md },
  roleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  roleDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  avertissement: {
    flexDirection: 'row', gap: 8,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.warningBg,
    marginBottom: Spacing.md,
  },
  avertissementTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  primaryBtn: {
    borderRadius: Radius.md, overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
