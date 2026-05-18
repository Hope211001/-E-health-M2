import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ medecins: 0, patients: 0, admins: 0 });
  const [loading, setLoading] = useState(true);

  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => {
    (async () => {
      try {
        const [medecins, patients, admins] = await Promise.all([
          authService.listUsers('medecin'),
          authService.listUsers('patient'),
          isSuperadmin ? authService.listUsers('admin') : Promise.resolve([]),
        ]);
        setStats({
          medecins: medecins.length,
          patients: patients.length,
          admins: admins.length,
        });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: error.response?.data?.error || 'Impossible de charger les stats',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuperadmin]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace(APP_ROUTES.AUTH.LOGIN);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.admin, Colors.adminDark]}
        style={styles.headerBg}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.prenom || user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name={isSuperadmin ? 'shield-checkmark' : 'shield'}
                size={12}
                color={Colors.admin}
              />
              <Text style={styles.roleTxt}>{user?.role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.admin} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              label="Médecins"
              value={stats.medecins}
              icon="medkit"
              color={Colors.primary}
              onPress={() => router.push(APP_ROUTES.ADMIN.MEDECINS)}
            />
            <StatCard
              label="Patients"
              value={stats.patients}
              icon="people"
              color={Colors.patient}
              onPress={() => router.push(APP_ROUTES.ADMIN.PATIENTS)}
            />
            {isSuperadmin && (
              <StatCard
                label="Admins"
                value={stats.admins}
                icon="shield-checkmark"
                color={Colors.admin}
                onPress={() => router.push(APP_ROUTES.ADMIN.ADMINS)}
              />
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Actions rapides</Text>

        <ActionButton
          icon="person-add"
          label="Ajouter un médecin"
          color={Colors.primary}
          onPress={() => router.push(APP_ROUTES.ADMIN.MEDECIN_ADD)}
        />
        <ActionButton
          icon="medkit-outline"
          label="Voir tous les médecins"
          color={Colors.primary}
          onPress={() => router.push(APP_ROUTES.ADMIN.MEDECINS)}
        />
        {isSuperadmin && (
          <>
            <ActionButton
              icon="shield-half"
              label="Ajouter un admin"
              color={Colors.admin}
              onPress={() => router.push(APP_ROUTES.ADMIN.ADMIN_ADD)}
            />
            <ActionButton
              icon="shield-checkmark-outline"
              label="Voir tous les admins"
              color={Colors.admin}
              onPress={() => router.push(APP_ROUTES.ADMIN.ADMINS)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label, value, icon, color, onPress,
}: {
  label: string; value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  icon, label, color, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
  },
  scroll: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  hello: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  userName: {
    fontSize: 24, fontWeight: '800',
    color: 'white', marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleTxt: {
    color: Colors.admin,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  statIcon: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24, fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
