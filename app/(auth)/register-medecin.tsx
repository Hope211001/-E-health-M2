import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export default function RegisterInfoScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="information-circle" size={32} color="white" />
          </View>
          <Text style={styles.title}>Créer un compte</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.icon}>👨‍⚕️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Vous êtes médecin ?</Text>
              <Text style={styles.rowText}>
                Les comptes médecins sont créés par un administrateur du réseau Salama.
                Contactez votre administrateur pour obtenir vos identifiants.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.icon}>👤</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Vous êtes patient ?</Text>
              <Text style={styles.rowText}>
                Votre médecin traitant doit créer votre compte. Demandez-lui vos identifiants
                lors de votre prochaine consultation.
              </Text>
            </View>
          </View>

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
              <Text style={styles.primaryBtnText}>Aller à la connexion</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: 64 },
  iconWrap: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primaryDark },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { fontSize: 32 },
  rowContent: { flex: 1 },
  rowTitle: {
    fontSize: 16, fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 6,
  },
  rowText: {
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  divider: {
    height: 1, backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  primaryBtn: {
    borderRadius: Radius.md, overflow: 'hidden',
    marginTop: Spacing.lg,
    ...Shadows.primary,
  },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});
