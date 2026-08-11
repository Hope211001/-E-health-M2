import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { authService } from '../../api/authService';
import { PasswordInput } from '../../components/PasswordInput';
import { useAuth } from '../../hooks/useAuth';

/**
 * Proposé une seule fois, à la première connexion d'un compte créé par un tiers.
 *
 * Le mot de passe reçu par email (préfixe de rôle + 8 chiffres) est un mot de
 * passe à part entière, pas un code provisoire : le refus est une réponse
 * légitime, pas un report. D'où deux issues explicites plutôt qu'un blocage —
 * et dans les deux cas `proposerChangementMotDePasse` retombe à false, pour
 * que la question ne revienne pas à chaque ouverture.
 */
const schema = z.object({
  motDePasse: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  confirmation: z.string(),
}).refine((d) => d.motDePasse === d.confirmation, {
  message: "Les deux mots de passe ne correspondent pas",
  path: ['confirmation'],
});

/** Destination après la réponse, selon le rôle. */
function accueilDuRole(role?: string) {
  switch (role) {
    case 'medecin': return APP_ROUTES.MEDECIN.HOME;
    case 'patient': return APP_ROUTES.PATIENT.HOME;
    case 'admin':
    case 'superadmin': return APP_ROUTES.ADMIN.HOME;
    default: return APP_ROUTES.AUTH.LOGIN;
  }
}

export default function ChangerMotDePasseScreen() {
  const router = useRouter();
  const { user, majLocale } = useAuth();
  const [form, setForm] = useState({ motDePasse: '', confirmation: '' });
  /** Le formulaire n'apparaît qu'après un choix : l'écran s'ouvre sur la question. */
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  /**
   * Quitte l'écran vers l'espace du rôle, après que le serveur a confirmé la
   * réponse (changement ou conservation).
   *
   * La mise à jour du profil est faite EN MÉMOIRE et non par `rafraichir()`,
   * qui relirait Firestore : GardeMotDePasse réagit à la fois au profil et à la
   * route, et si la route changeait avant l'arrivée de la lecture réseau, il
   * verrait encore `proposerChangementMotDePasse: true` sur le tableau de bord
   * et renverrait aussitôt sur cet écran. La navigation dépendait donc d'une
   * latence — d'où le retour en boucle sur « Garder celui que j'ai reçu ».
   */
  const continuer = () => {
    majLocale({ proposerChangementMotDePasse: false });
    router.replace(accueilDuRole(user?.role));
  };

  const handleConserver = async () => {
    setLoading(true);
    try {
      await authService.conserverMotDePasse();
      Toast.show({
        type: 'success',
        text1: 'Mot de passe conservé',
        text2: 'Vous gardez celui reçu par email.',
      });
      continuer();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || "Votre choix n'a pas pu être enregistré",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChanger = async () => {
    const validation = schema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Mot de passe refusé',
        text2: validation.error.issues[0]?.message,
      });
      return;
    }

    setLoading(true);
    try {
      await authService.changerMotDePasse(validation.data.motDePasse);
      Toast.show({ type: 'success', text1: 'Nouveau mot de passe enregistré' });
      continuer();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || "Le mot de passe n'a pas pu être modifié",
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.icone}>
          <Ionicons name="key-outline" size={34} color={Colors.primary} />
        </View>

        <Text style={styles.titre}>Votre mot de passe</Text>
        <Text style={styles.sousTitre}>
          Vous vous êtes connecté avec le mot de passe reçu par email. Souhaitez-vous
          en définir un autre, plus facile à retenir&nbsp;?
        </Text>

        <View style={styles.carte}>
          {!saisieOuverte ? (
            <>
              <TouchableOpacity
                style={styles.bouton}
                onPress={() => setSaisieOuverte(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.boutonFond}
                >
                  <Text style={styles.boutonTxt}>Choisir un nouveau mot de passe</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.boutonSecondaire}
                onPress={handleConserver}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={Colors.textSecondary} />
                  : <Text style={styles.boutonSecondaireTxt}>Garder celui que j&apos;ai reçu</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <PasswordInput
                placeholder="••••••••"
                value={form.motDePasse}
                onChangeText={update('motDePasse')}
                autoFocus
              />
              <Text style={styles.aide}>8 caractères minimum</Text>

              <Text style={styles.label}>Confirmer</Text>
              <PasswordInput
                placeholder="••••••••"
                value={form.confirmation}
                onChangeText={update('confirmation')}
              />

              <TouchableOpacity
                style={styles.bouton}
                onPress={handleChanger}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.boutonFond}
                >
                  {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.boutonTxt}>Enregistrer</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.boutonSecondaire}
                onPress={() => setSaisieOuverte(false)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.boutonSecondaireTxt}>Retour</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.noteTxt}>
            Cette question ne vous sera posée qu&apos;une fois. Quel que soit votre
            choix, vous pourrez toujours vous connecter avec Google si vous utilisez
            la même adresse email.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: 72, flexGrow: 1 },
  icone: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  titre: {
    fontSize: 24, fontWeight: '800', color: Colors.textPrimary,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  sousTitre: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: Spacing.xl,
  },
  carte: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  aide: {
    color: Colors.textMuted, fontSize: 12,
    marginTop: -6, marginBottom: Spacing.md, marginLeft: 4,
  },
  bouton: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.primary },
  boutonFond: { padding: 16, alignItems: 'center' },
  boutonTxt: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  boutonSecondaire: { marginTop: Spacing.md, padding: 14, alignItems: 'center' },
  boutonSecondaireTxt: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  note: {
    flexDirection: 'row', gap: 8,
    marginTop: Spacing.xl, paddingHorizontal: 4,
  },
  noteTxt: { flex: 1, color: Colors.textMuted, fontSize: 12, lineHeight: 17 },
});