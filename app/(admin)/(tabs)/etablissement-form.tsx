/**
 * etablissement-form.tsx
 *
 * Enrôlement et modification d'un établissement. Superadmin uniquement.
 *
 * Un seul écran pour les deux : `?id=<etablissementId>` bascule en édition. Les
 * champs sont identiques, et deux fichiers auraient divergé au premier ajout.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import {
  etablissementService,
  LIBELLE_TYPE_ETABLISSEMENT,
  SIGLE_TYPE_ETABLISSEMENT,
  TYPES_ETABLISSEMENT,
} from '@/api/etablissementService';
import SelecteurVille from '@/components/SelecteurVille';
import type { TypeEtablissement } from '@/types/collection';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

// `.trim()` avant les contrôles de longueur, comme partout ailleurs : une
// saisie faite d'espaces ne doit pas passer pour une valeur renseignée.
//
// Pas de champ `ville` ici : la localisation n'est plus saisie mais CHOISIE
// dans le référentiel (`villeId`). Un champ texte laissait coexister trois
// orthographes de la même commune, qu'aucun filtre ne pouvait plus regrouper.
const schema = z.object({
  nom: z.string().trim().min(1, "Nom : requis").max(150, 'Nom : 150 caractères maximum'),
  adresse: z.string().trim().max(200, 'Adresse : 200 caractères maximum'),
  telephone: z.string().trim().max(30, 'Téléphone : 30 caractères maximum'),
  email: z.string().trim().max(150, 'Email : 150 caractères maximum'),
});

export default function EtablissementFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);

  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '', email: '',
  });
  // Hors du schéma zod : c'est une référence choisie dans une modale, pas une
  // saisie texte à valider.
  const [villeId, setVilleId] = useState('');
  const [type, setType] = useState<TypeEtablissement>('CSB2');
  const [chargement, setChargement] = useState(edition);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  useEffect(() => {
    if (!id) return;
    let annule = false;
    (async () => {
      try {
        const e = await etablissementService.get(id);
        if (annule) return;
        setForm({
          nom: e.nom || '',
          adresse: e.adresse || '', telephone: e.telephone || '', email: e.email || '',
        });
        setVilleId(e.villeId || '');
        setType(e.type);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Chargement impossible',
          text2: error.response?.data?.error || 'Établissement introuvable',
        });
        router.back();
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    // Contrôlée à part du schéma : c'est une référence, pas un texte. Un
    // établissement sans ville n'apparaîtrait dans aucun filtre géographique
    // et fausserait la répartition nationale — d'où l'obligation.
    if (!villeId) {
      Toast.show({
        type: 'error',
        text1: 'Ville manquante',
        text2: 'Choisissez la ville de l’établissement.',
      });
      return;
    }

    setLoading(true);
    try {
      // `validation.data` et non `form` : les valeurs nettoyées, pas la saisie.
      const donnees = { ...validation.data, type, villeId };
      if (edition) {
        await etablissementService.modifier(id!, donnees);
        Toast.show({ type: 'success', text1: 'Établissement modifié' });
      } else {
        await etablissementService.creer(donnees);
        Toast.show({
          type: 'success',
          text1: 'Établissement enrôlé',
          text2: 'Créez-lui un administrateur pour qu’il puisse fonctionner.',
        });
      }
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Enregistrement impossible',
      });
    } finally {
      setLoading(false);
    }
  };

  if (chargement) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.adminAccent} />
      </View>
    );
  }

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
          <Text style={styles.title}>
            {edition ? "Modifier l'établissement" : 'Enrôler un établissement'}
          </Text>
          <Text style={styles.subtitle}>
            {edition
              ? 'Les comptes rattachés ne sont pas affectés'
              : 'Nouvelle structure de santé sur la plateforme'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Field
          label="Nom de l'établissement"
          value={form.nom}
          onChangeText={update('nom')}
          autoCapitalize="words"
          placeholder="Ex : CHU Joseph Ravoahangy Andrianavalona"
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.types}>
          {TYPES_ETABLISSEMENT.map((t) => {
            const choisi = t === type;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                activeOpacity={0.8}
                style={[styles.typeChip, choisi && styles.typeChipActif]}
              >
                <Text style={[styles.typeTxt, choisi && styles.typeTxtActif]}>
                  {SIGLE_TYPE_ETABLISSEMENT[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>{LIBELLE_TYPE_ETABLISSEMENT[type]}</Text>

        {/* Choisie dans le référentiel national, jamais saisie librement : le
            nom de la commune n'est stocké qu'à un seul endroit. */}
        <SelecteurVille
          valeur={villeId}
          onChange={setVilleId}
          label="Ville"
          peutAjouter
          couleur={Colors.adminAccent}
          fond={Colors.adminAccentBg}
        />
        <Text style={styles.hint}>
          Deux établissements ne peuvent pas porter le même nom dans la même ville.
        </Text>

        <Field
          label="Adresse"
          value={form.adresse}
          onChangeText={update('adresse')}
          autoCapitalize="sentences"
          placeholder="Facultative"
        />
        <Field
          label="Téléphone"
          value={form.telephone}
          onChangeText={update('telephone')}
          keyboardType="phone-pad"
          placeholder="Facultatif — standard de l'établissement"
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          keyboardType="email-address"
          placeholder="Facultatif — contact administratif"
        />

        {!edition && (
          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.infoTxt}>
              Un établissement ne fonctionne qu&apos;une fois qu&apos;il a un
              administrateur : c&apos;est lui qui y enregistrera les médecins, qui
              enregistreront à leur tour leurs patients.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.adminAccent, Colors.adminAccentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : (
                <Text style={styles.primaryBtnText}>
                  {edition ? 'Enregistrer' : "Enrôler l'établissement"}
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
  center: { justifyContent: 'center', alignItems: 'center' },
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
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  hint: {
    color: Colors.textMuted, fontSize: 12,
    marginTop: -6, marginBottom: Spacing.md, marginLeft: 4,
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  typeChipActif: { backgroundColor: Colors.adminAccentBg, borderColor: Colors.adminAccent },
  typeTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  typeTxtActif: { color: Colors.adminAccent },
  info: {
    flexDirection: 'row', gap: 8,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.infoBg,
    marginTop: Spacing.sm,
  },
  infoTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  primaryBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
