import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { authService } from '../../api/authService';
import { PasswordInput } from '../../components/PasswordInput';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  tel: z.string().min(8, "Téléphone invalide"),
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
});

export default function AdminAddScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', tel: '', nom: '', prenom: '',
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
      await authService.registerAdmin(form.email, form.password, form.tel, form.nom, form.prenom);
      Toast.show({ type: 'success', text1: 'Admin créé' });
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ajouter un admin</Text>
            <Text style={styles.subtitle}>Action réservée au superadmin</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Prénom" value={form.prenom} onChangeText={update('prenom')} />
          <Field label="Nom" value={form.nom} onChangeText={update('nom')} />
          <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />

          <Text style={styles.label}>Mot de passe</Text>
          <PasswordInput
            containerClassName=""
            placeholder="••••••••"
            value={form.password}
            onChangeText={update('password')}
          />

          <Field label="Téléphone" value={form.tel} onChangeText={update('tel')} keyboardType="phone-pad" />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.admin, Colors.adminDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.primaryBtnText}>Créer l&apos;admin</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
