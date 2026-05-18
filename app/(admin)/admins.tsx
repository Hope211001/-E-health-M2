import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../api/authService';
import { User } from '../../types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export default function AdminsListScreen() {
  const router = useRouter();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await authService.listUsers('admin');
      setAdmins(list);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Accès refusé',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleToggle = async (uid: string) => {
    try {
      const { statut } = await authService.toggleUserStatut(uid);
      setAdmins((prev) => prev.map((a) => a.uid === uid ? { ...a, statut } : a));
      Toast.show({ type: 'success', text1: `Compte ${statut}` });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.admin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Administrateurs</Text>
          <Text style={styles.subtitle}>{admins.length} compte(s)</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(APP_ROUTES.ADMIN.ADMIN_ADD)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnTxt}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.admin}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun administrateur enregistré.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.admin} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {item.prenom || item.nom
                  ? `${item.prenom || ''} ${item.nom || ''}`.trim()
                  : item.email}
              </Text>
              <Text style={styles.cardSub}>{item.email}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.statut === 'actif' ? Colors.successBg : Colors.dangerBg },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: item.statut === 'actif' ? Colors.success : Colors.danger },
                ]} />
                <Text style={[
                  styles.statusTxt,
                  { color: item.statut === 'actif' ? Colors.success : Colors.danger },
                ]}>
                  {item.statut === 'actif' ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                { backgroundColor: item.statut === 'actif' ? Colors.dangerBg : Colors.successBg },
              ]}
              onPress={() => handleToggle(item.uid)}
            >
              <Text style={[
                styles.toggleTxt,
                { color: item.statut === 'actif' ? Colors.danger : Colors.success },
              ]}>
                {item.statut === 'actif' ? 'Désactiver' : 'Activer'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.admin,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: Radius.lg,
    marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.adminBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.md,
  },
  toggleTxt: { fontSize: 12, fontWeight: '700' },
});
