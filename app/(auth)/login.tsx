import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { APP_ROUTES } from '@/constants/routes';
import { APP, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { authService } from '../../api/authService';
import { User } from '../../types/collection';

const loginSchema = z.object({
  email: z.string().email({ message: "Format email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit faire au moins 6 caractères" }),
});

function redirectByRole(router: ReturnType<typeof useRouter>, user: User) {
  switch (user.role) {
    case 'medecin':
      router.replace(APP_ROUTES.MEDECIN.HOME); break;
    case 'patient':
      router.replace(APP_ROUTES.PATIENT.HOME); break;
    case 'admin':
    case 'superadmin':
      router.replace(APP_ROUTES.ADMIN.HOME); break;
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: validation.error.issues[0]?.message || "Erreur de validation",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email, password);
      Toast.show({ type: 'success', text1: 'Bienvenue', text2: `Espace ${user.role}` });
      redirectByRole(router, user);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: error.response?.data?.error || "Identifiants incorrects",
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
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="heart" size={32} color="white" />
        </View>
        <Text style={styles.appName}>{APP.name}</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@exemple.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push(APP_ROUTES.AUTH.FORGOT_PASSWORD)}
        >
          <Text style={styles.forgotTxt}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleLogin}
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
              : <Text style={styles.primaryBtnText}>Se connecter</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Comptes créés par votre administrateur ou votre médecin traitant.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -1,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing['2xl'],
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  label: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  passwordWrap: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotTxt: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  primaryBtnGradient: {
    padding: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 16,
  },
  note: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
});
