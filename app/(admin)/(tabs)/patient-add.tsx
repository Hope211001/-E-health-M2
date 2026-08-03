import React, { useState, useEffect } from 'react';
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
import { User } from '../../../types/collection';
import { PasswordInput } from '../../../components/PasswordInput';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const schema = z.object({
  email: z.string().email("Email : format invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  tel: z.string().refine(
    (v) => /^0\d{9}$/.test(v.replace(/\s/g, '')),
    "Téléphone : 10 chiffres commençant par 0 (ex: 0341234567)",
  ),
  medecinId: z.string().min(1, "Médecin traitant : à sélectionner"),
});

/** Nom affichable d'un médecin, avec repli sur l'email. */
const nomMedecin = (m: User) =>
  (m.prenom || m.nom) ? `Dr. ${m.prenom || ''} ${m.nom || ''}`.trim() : m.email;

/**
 * Création d'un patient par l'administration.
 *
 * Différence avec l'écran équivalent côté médecin : l'admin n'est pas le
 * médecin traitant, il doit donc en désigner un explicitement.
 */
export default function PatientAddScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', tel: '', nom: '', prenom: '', medecinId: '',
  });
  const [medecins, setMedecins] = useState<User[]>([]);
  const [chargementMedecins, setChargementMedecins] = useState(true);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  useEffect(() => {
    (async () => {
      try {
        // `all` : le sélecteur doit proposer TOUS les médecins. Avec la
        // pagination par défaut, seuls les 20 premiers apparaîtraient et le
        // médecin manquant passerait pour une donnée absente.
        const page = await authService.listUsers('medecin', { all: true });
        // Un compte désactivé ne doit pas se voir attribuer de nouveaux patients.
        setMedecins(page.data.filter((m) => m.statut === 'actif'));
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: error.response?.data?.error || 'Impossible de charger les médecins',
        });
      } finally {
        setChargementMedecins(false);
      }
    })();
  }, []);

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

    setLoading(true);
    try {
      await authService.registerPatient(form.email, form.password, form.tel, {
        medecinId: form.medecinId,
        nom: form.nom,
        prenom: form.prenom,
      });
      Toast.show({ type: 'success', text1: 'Patient créé' });
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
        <Text style={styles.title}>Ajouter un patient</Text>
      </View>

      <View style={styles.card}>
        <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />

        <Text style={styles.label}>Mot de passe</Text>
        <PasswordInput
          placeholder="••••••••"
          value={form.password}
          onChangeText={update('password')}
        />
        <Text style={styles.hint}>8 caractères minimum</Text>

        <Field
          label="Téléphone"
          hint="10 chiffres commençant par 0 (ex: 0341234567)"
          value={form.tel}
          onChangeText={update('tel')}
          keyboardType="phone-pad"
          placeholder="0341234567"
        />

        <Field
          label="Prénom"
          hint="Facultatif — sert à identifier le patient dans les listes"
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

        {/* Médecin traitant : obligatoire ici, alors qu'il est implicite quand
            c'est le médecin lui-même qui crée le patient. */}
        <Text style={styles.label}>Médecin traitant</Text>
        {chargementMedecins ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : medecins.length === 0 ? (
          <Text style={styles.vide}>
            Aucun médecin actif. Créez d&apos;abord un compte médecin.
          </Text>
        ) : (
          <View style={styles.medecins}>
            {medecins.map((m) => {
              const choisi = form.medecinId === m.uid;
              return (
                <TouchableOpacity
                  key={m.uid}
                  style={[styles.medecinRow, choisi && styles.medecinRowChoisi]}
                  onPress={() => update('medecinId')(m.uid)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={choisi ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={choisi ? Colors.primary : Colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.medecinNom, choisi && { color: Colors.primaryDark }]} numberOfLines={1}>
                      {nomMedecin(m)}
                    </Text>
                    <Text style={styles.medecinMail} numberOfLines={1}>{m.email}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={loading || medecins.length === 0}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.patient, '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.primaryBtnText}>Créer le patient</Text>}
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
    color: Colors.textMuted, fontSize: 12,
    marginTop: -6, marginBottom: Spacing.md, marginLeft: 4,
  },
  vide: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: Spacing.md },
  medecins: { gap: 6, marginBottom: Spacing.md },
  medecinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  medecinRowChoisi: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  medecinNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  medecinMail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  primaryBtn: {
    borderRadius: Radius.md, overflow: 'hidden',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
