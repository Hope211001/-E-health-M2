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

export default function MedecinsListScreen() {
  const router = useRouter();
  const [medecins, setMedecins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await authService.listUsers('medecin');
      setMedecins(list);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger',
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
      setMedecins((prev) => prev.map((m) => m.uid === uid ? { ...m, statut } : m));
      Toast.show({ type: 'success', text1: `Compte ${statut}` });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Action impossible',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Médecins</Text>
          <Text style={styles.subtitle}>{medecins.length} compte(s)</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(APP_ROUTES.ADMIN.MEDECIN_ADD)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnTxt}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={medecins}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun médecin enregistré.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="medkit" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.email}</Text>
              {item.telephone ? (
                <Text style={styles.cardSub}>{item.telephone}</Text>
              ) : null}
              <View style={[
                styles.statusBadge,
                item.statut === 'actif' ? styles.statusActive : styles.statusInactive,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.primary,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing['3xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusActive: { backgroundColor: Colors.successBg },
  statusInactive: { backgroundColor: Colors.dangerBg },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  toggleTxt: { fontSize: 12, fontWeight: '700' },
});
