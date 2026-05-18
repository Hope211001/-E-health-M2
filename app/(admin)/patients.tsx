import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../api/authService';
import { User } from '../../types/collection';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function PatientsListScreen() {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await authService.listUsers('patient');
      setPatients(list);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.patient} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>{patients.length} compte(s) enregistré(s)</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.patient}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun patient enregistré.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={Colors.patient} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {item.prenom || item.nom
                  ? `${item.prenom || ''} ${item.nom || ''}`.trim()
                  : item.email}
              </Text>
              <Text style={styles.cardSub}>{item.email}</Text>
              {item.telephone ? (
                <Text style={styles.cardSub}>{item.telephone}</Text>
              ) : null}
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
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
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
    backgroundColor: Colors.patientBg,
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
});
