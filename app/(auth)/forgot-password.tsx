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
import { authService } from '../../api/authService';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const schema = z.object({
  email: z.string().email({ message: "Format email invalide" }),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const validation = schema.safeParse({ email });
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Email invalide',
        text2: validation.error.issues[0]?.message || '',
      });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch {
      // Réponse générique pour ne pas révéler si l'email existe
    } finally {
      setSent(true);
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Email envoyé',
        text2: 'Si cet email existe, vous recevrez un lien',
      });
    }
  };

  return (
    <AppScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color="white" />
        </View>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Saisissez votre email, nous vous enverrons un lien de réinitialisation.
        </Text>
      </View>

      <View style={styles.card}>
        {sent ? (
          <>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successText}>
              📬 Si un compte est associé à <Text style={styles.emailBold}>{email}</Text>,
              un lien de réinitialisation vient d&apos;être envoyé. Vérifie aussi tes spams.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace(APP_ROUTES.AUTH.LOGIN)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Retour à la connexion</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
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
                  : <Text style={styles.primaryBtnText}>Envoyer le lien</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backTxt}>
                Retour à la <Text style={styles.backTxtBold}>connexion</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </AppScrollView>
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
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: Spacing.xl,
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
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
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
  backBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  backTxt: {
    color: Colors.textSecondary,
  },
  backTxtBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  emailBold: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
