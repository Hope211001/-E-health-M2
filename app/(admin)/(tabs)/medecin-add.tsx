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
import ChampDateNaissance from '../../../components/ChampDateNaissance';
import type { Sexe } from '../../../types/collection';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { versISO } from '@/utils/dateNaissance';

// Pas de champ mot de passe : le backend en génère un et l'envoie au médecin
// par email. Personne d'autre que lui ne le connaît, pas même le superadmin
// qui crée le compte.
//
// `.trim()` systématique AVANT les contrôles de longueur : sans lui, un champ
// rempli d'espaces passe la validation et enregistre une valeur vide.
const schema = z.object({
  email: z.string().trim().email("Email : format invalide"),
  tel: z.string().trim().refine(
    (v) => /^0\d{9}$/.test(v.replace(/\s/g, '')),
    "Téléphone : 10 chiffres commençant par 0 (ex: 0341234567)",
  ),
  // Exigés : un médecin est désigné par son nom partout dans l'app (listes de
  // patients, ordonnances, messagerie). Sans état civil, il n'apparaîtrait que
  // par son email, y compris auprès de ses propres patients.
  nom: z.string().trim().min(1, "Nom : requis"),
  prenom: z.string().trim().min(1, "Prénom : requis"),
  ordre: z.string().trim().min(1, "Numéro d'ordre : requis"),
  specialite: z.string().trim().min(2, "Spécialité : requise (2 caractères min)"),
  // Facultative : elle n'entre dans aucun traitement, seulement dans le dossier.
  adresse: z.string().trim().max(200, "Adresse : 200 caractères maximum"),
});

export default function MedecinAddScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', tel: '', nom: '', prenom: '', ordre: '', specialite: '', adresse: '',
  });
  const [photo, setPhoto] = useState('');
  const [sexe, setSexe] = useState<Sexe | ''>('');
  // Hors du formulaire zod : la saisie 'JJ/MM/AAAA' n'est convertie qu'à
  // l'envoi, une date en cours de frappe n'ayant pas de forme ISO.
  const [naissance, setNaissance] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      // Valeurs nettoyées par zod, pas la saisie brute.
      const propre = validation.data;
      const cree = await authService.registerMedecin(
        propre.email, propre.tel,
        propre.specialite.split(',').map(s => s.trim()).filter(Boolean),
        propre.ordre,
        {
          nom: propre.nom, prenom: propre.prenom, photo, sexe,
          dateNaissance, adresse: propre.adresse,
        },
      );

      // Le compte existe dans tous les cas ; seul l'acheminement de l'email
      // peut avoir échoué. L'annoncer, sinon le médecin serait attendu sur une
      // plateforme dont il n'a jamais reçu le mot de passe.
      Toast.show(
        cree.emailEnvoye === false
          ? {
            type: 'error',
            text1: 'Médecin créé, email non envoyé',
            text2: "Utilisez « Renvoyer les identifiants » depuis la liste des comptes.",
          }
          : {
            type: 'success',
            text1: 'Médecin créé',
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
          <Text style={styles.title}>Ajouter un médecin</Text>
        </View>

        <View style={styles.card}>
          <PhotoProfilPicker
            valeur={photo}
            onChange={setPhoto}
            couleur={Colors.primary}
            fond={Colors.primaryBg}
            icone="medkit"
            prenom={form.prenom}
            nom={form.nom}
          />

          <Field
            label="Prénom"
            value={form.prenom}
            onChangeText={update('prenom')}
            autoCapitalize="words"
          />
          <Field
            label="Nom"
            value={form.nom}
            onChangeText={update('nom')}
            autoCapitalize="words"
          />

          <SelecteurSexe valeur={sexe} onChange={setSexe} />

          <ChampDateNaissance valeur={naissance} onChange={setNaissance} />

          <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />

          <InfoIdentifiants />

          <Field
            label="Téléphone"
            hint="10 chiffres commençant par 0 (ex: 0341234567)"
            value={form.tel}
            onChangeText={update('tel')}
            keyboardType="phone-pad"
            placeholder="0341234567"
          />
          <Field label="Numéro d'ordre" value={form.ordre} onChangeText={update('ordre')} />
          <Field
            label="Spécialités"
            hint="Séparer par des virgules (ex: cardiologie, généraliste)"
            value={form.specialite}
            onChangeText={update('specialite')}
          />
          <Field
            label="Adresse"
            hint="Facultative — cabinet ou adresse professionnelle"
            value={form.adresse}
            onChangeText={update('adresse')}
            autoCapitalize="sentences"
            placeholder="Ex : Lot II M 45 bis, Antananarivo"
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.primaryBtnText}>Créer le médecin</Text>}
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
  label, hint, ...props
}: { label: string; hint?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  label: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 6, marginLeft: 4, fontSize: 14 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: -6,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  primaryBtn: {
    borderRadius: Radius.md, overflow: 'hidden',
    marginTop: Spacing.lg,
    ...Shadows.primary,
  },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
