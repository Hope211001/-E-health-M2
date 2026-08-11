/**
 * CarteProfilCompte
 *
 * Bloc « mon profil » réutilisé par les trois espaces (médecin, patient,
 * administration) : photo, prénom, nom et téléphone du compte connecté, en
 * lecture puis en édition.
 *
 * Le rôle et l'email ne sont pas modifiables : le premier fonde les droits, le
 * second est la clé d'authentification Firebase — les changer ici donnerait
 * l'illusion d'un compte modifiable alors que la connexion continuerait
 * d'utiliser l'ancienne valeur.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import AvatarUtilisateur from './AvatarUtilisateur';
import PhotoProfilPicker from './PhotoProfilPicker';
import SelecteurSexe from './SelecteurSexe';
import type { Sexe } from '@/types/collection';
import { authService } from '@/api/authService';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { iconeOrigine, origineCompte } from '@/utils/roles';

const schema = z.object({
  // `.trim()` AVANT `.min(1)` : sans lui, une suite d'espaces passe la
  // validation de longueur et enregistre un état civil vide.
  nom: z.string().trim().min(1, 'Nom requis'),
  prenom: z.string().trim().min(1, 'Prénom requis'),
  // Facultatif, mais s'il est renseigné il doit être exploitable : le backend
  // refuse les numéros qu'il ne sait pas normaliser.
  tel: z.string().trim().refine(
    (v) => v === '' || /^\+?\d{9,15}$/.test(v.replace(/[\s.-]/g, '')),
    'Téléphone invalide (ex: 0341234567)',
  ),
  // Facultative, et le vide est accepté : contrairement à l'état civil, c'est
  // une donnée qu'on peut légitimement vouloir retirer de son profil.
  adresse: z.string().trim().max(200, 'Adresse : 200 caractères maximum'),
});

type Props = {
  couleur?: string;
  fond?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  /** Libellé du rôle affiché sous le nom. */
  roleLabel?: string;
};

export default function CarteProfilCompte({
  couleur = Colors.primary,
  fond = Colors.primaryBg,
  icone = 'person',
  roleLabel,
}: Props) {
  const { user, rafraichir } = useAuth();

  const [edition, setEdition] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', tel: '', adresse: '' });
  const [photo, setPhoto] = useState('');
  const [sexe, setSexe] = useState<Sexe | ''>('');

  if (!user) {
    return (
      <View style={[styles.carte, styles.centre]}>
        <ActivityIndicator color={couleur} />
      </View>
    );
  }

  const nomComplet = `${user.prenom || ''} ${user.nom || ''}`.trim();

  const ouvrirEdition = () => {
    // L'état du formulaire est (re)construit à l'ouverture : repartir du profil
    // courant évite de réafficher une saisie abandonnée précédemment.
    setForm({
      nom: user.nom || '',
      prenom: user.prenom || '',
      tel: user.telephone || '',
      adresse: user.adresse || '',
    });
    setSexe(user.sexe || '');
    setPhoto(user.photoURL || '');
    setEdition(true);
  };

  const enregistrer = async () => {
    const validation = schema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: validation.error.issues[0]?.message,
      });
      return;
    }

    setEnregistrement(true);
    try {
      // `validation.data` et non `form` : ce sont les valeurs nettoyées par
      // zod qui doivent partir, pas la saisie brute avec ses espaces.
      await authService.updateProfile(user.uid, {
        nom: validation.data.nom,
        prenom: validation.data.prenom,
        tel: validation.data.tel,
        sexe,
        adresse: validation.data.adresse,
        // Envoyée seulement si elle a changé : réexpédier l'URL actuelle
        // ferait un aller-retour inutile, et l'omettre la laisse en place.
        ...(photo !== (user.photoURL || '') ? { photo } : {}),
      });
      await rafraichir();
      Toast.show({ type: 'success', text1: 'Profil mis à jour' });
      setEdition(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Enregistrement impossible',
      });
    } finally {
      setEnregistrement(false);
    }
  };

  if (!edition) {
    return (
      <View style={styles.carte}>
        <View style={styles.ligne}>
          <AvatarUtilisateur
            photoURL={user.photoURL}
            prenom={user.prenom}
            nom={user.nom}
            email={user.email}
            taille={64}
            couleur={couleur}
            fond={fond}
            icone={icone}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.nom} numberOfLines={1}>
              {nomComplet || 'Profil incomplet'}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>{user.email}</Text>
            {user.telephone ? (
              <Text style={styles.detail} numberOfLines={1}>{user.telephone}</Text>
            ) : null}
            {user.sexe ? (
              <Text style={styles.detail}>
                {user.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </Text>
            ) : null}
            {user.adresse ? (
              <Text style={styles.detail} numberOfLines={2}>{user.adresse}</Text>
            ) : null}
            {roleLabel ? (
              <View style={[styles.badge, { backgroundColor: fond }]}>
                <Ionicons name={icone} size={11} color={couleur} />
                <Text style={[styles.badgeTxt, { color: couleur }]}>{roleLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Origine et identifiant : utiles quand l'utilisateur contacte le
            support, et pour qu'il sache qui a ouvert son compte. */}
        <View style={styles.technique}>
          <View style={styles.techniqueLigne}>
            <Ionicons name={iconeOrigine(user)} size={13} color={Colors.textMuted} />
            <Text style={styles.techniqueTxt}>{origineCompte(user)}</Text>
          </View>
          <View style={styles.techniqueLigne}>
            <Ionicons name="finger-print-outline" size={13} color={Colors.textMuted} />
            <Text style={[styles.techniqueTxt, styles.techniqueId]} selectable>
              {user.uid}
            </Text>
          </View>
        </View>

        {!nomComplet && (
          <Text style={styles.rappel}>
            Renseignez votre nom : sans lui, votre compte n&apos;apparaît que par son
            email dans le reste de l&apos;application.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.boutonSecondaire, { borderColor: couleur }]}
          onPress={ouvrirEdition}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color={couleur} />
          <Text style={[styles.boutonSecondaireTxt, { color: couleur }]}>
            Modifier mon profil
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.carte}>
      <PhotoProfilPicker
        valeur={photo}
        onChange={setPhoto}
        couleur={couleur}
        fond={fond}
        icone={icone}
        prenom={form.prenom}
        nom={form.nom}
        hint="JPEG ou PNG, recadrée en carré"
        disabled={enregistrement}
      />

      <Text style={styles.label}>Prénom</Text>
      <TextInput
        style={styles.input}
        value={form.prenom}
        onChangeText={(v) => setForm({ ...form, prenom: v })}
        placeholder="Prénom"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={form.nom}
        onChangeText={(v) => setForm({ ...form, nom: v })}
        placeholder="Nom"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Téléphone</Text>
      <TextInput
        style={styles.input}
        value={form.tel}
        onChangeText={(v) => setForm({ ...form, tel: v })}
        placeholder="0341234567"
        placeholderTextColor={Colors.textMuted}
        keyboardType="phone-pad"
      />

      <SelecteurSexe
        valeur={sexe}
        onChange={setSexe}
        couleur={couleur}
        fond={fond}
        disabled={enregistrement}
      />

      <Text style={styles.label}>Adresse</Text>
      <TextInput
        style={styles.input}
        value={form.adresse}
        onChangeText={(v) => setForm({ ...form, adresse: v })}
        placeholder="Facultative — ex : Lot II M 45 bis, Antananarivo"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="sentences"
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.boutonAnnuler}
          onPress={() => setEdition(false)}
          disabled={enregistrement}
        >
          <Text style={styles.boutonAnnulerTxt}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boutonPrincipal, { backgroundColor: couleur }]}
          onPress={enregistrer}
          disabled={enregistrement}
          activeOpacity={0.85}
        >
          {enregistrement
            ? <ActivityIndicator color="white" />
            : <Text style={styles.boutonPrincipalTxt}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  centre: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  nom: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  detail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  technique: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  techniqueLigne: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  techniqueTxt: { flex: 1, fontSize: 11, color: Colors.textMuted },
  techniqueId: { fontFamily: Fonts?.mono, letterSpacing: 0.2 },
  rappel: {
    marginTop: Spacing.md,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.warningBg,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  boutonSecondaire: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  boutonSecondaireTxt: { fontWeight: '700', fontSize: 14 },
  boutonPrincipal: {
    flex: 2, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center',
  },
  boutonPrincipalTxt: { color: Colors.textInverse, fontWeight: '700', fontSize: 15 },
  boutonAnnuler: {
    flex: 1, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  boutonAnnulerTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
});