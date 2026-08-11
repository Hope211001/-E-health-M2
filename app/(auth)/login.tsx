import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image,
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
  // Première connexion avec le mot de passe reçu par email : on lui propose
  // d'en définir un avant d'entrer dans son espace. GardeMotDePasse produirait
  // le même résultat, mais après un affichage éclair du tableau de bord.
  if (user.proposerChangementMotDePasse) {
    router.replace(APP_ROUTES.AUTH.CHANGER_MOT_DE_PASSE);
    return;
  }

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/images/icon-sante.png')}
            style={{ width: 44, height: 44, borderRadius: 10 }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>{APP.name}</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={Colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.inputFlex}
            placeholder="email@exemple.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            cursorColor={Colors.primary}
            selectionColor={Colors.primary}
          />
        </View>

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={Colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.inputFlex}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            cursorColor={Colors.primary}
            selectionColor={Colors.primary}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
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
  inputWrap: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  inputFlex: {
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
