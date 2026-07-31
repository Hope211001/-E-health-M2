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
import { PasswordInput } from '../../../components/PasswordInput';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const schema = z.object({
  email: z.string().email("Email : format invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  tel: z.string().refine(
    (v) => /^0\d{9}$/.test(v.replace(/\s/g, '')),
    "Téléphone : 10 chiffres commençant par 0 (ex: 0341234567)",
  ),
  ordre: z.string().min(1, "Numéro d'ordre : requis"),
  specialite: z.string().min(2, "Spécialité : requise (2 caractères min)"),
});

export default function MedecinAddScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', tel: '', ordre: '', specialite: '',
  });
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

    setLoading(true);
    try {
      await authService.registerMedecin(
        form.email, form.password, form.tel,
        form.specialite.split(',').map(s => s.trim()).filter(Boolean),
        form.ordre,
      );
      Toast.show({ type: 'success', text1: 'Médecin créé' });
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
          <Field label="Numéro d'ordre" value={form.ordre} onChangeText={update('ordre')} />
          <Field
            label="Spécialités"
            hint="Séparer par des virgules (ex: cardiologie, généraliste)"
            value={form.specialite}
            onChangeText={update('specialite')}
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
