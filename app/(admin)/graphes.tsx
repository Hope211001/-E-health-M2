import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { statsService, Periode, PrescriptionsParPeriode, PrescriptionsParMedecin, DiagnosticsFrequents } from '../../api/statsService';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import AppHeader from '../../components/AppHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PERIODES: { key: Periode; label: string }[] = [
  { key: 'semaine', label: '7 jours' },
  { key: 'mois', label: 'Mois' },
  { key: 'annee', label: 'Années' },
];

export default function GraphesScreen() {
  const [periode, setPeriode] = useState<Periode>('semaine');
  const [prescriptionsStats, setPrescriptionsStats] = useState<PrescriptionsParPeriode | null>(null);
  const [parMedecin, setParMedecin] = useState<PrescriptionsParMedecin | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsFrequents | null>(null);
  const [loadingPeriode, setLoadingPeriode] = useState(true);
  const [loadingMedecin, setLoadingMedecin] = useState(true);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true);

  const loadPeriode = useCallback(async (p: Periode) => {
    setLoadingPeriode(true);
    try {
      setPrescriptionsStats(await statsService.getPrescriptionsParPeriode(p));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger les statistiques',
      });
    } finally {
      setLoadingPeriode(false);
    }
  }, []);

  const loadParMedecin = useCallback(async (p: Periode) => {
    setLoadingMedecin(true);
    try {
      setParMedecin(await statsService.getPrescriptionsParMedecin(p));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger les statistiques',
      });
    } finally {
      setLoadingMedecin(false);
    }
  }, []);

  const loadDiagnostics = useCallback(async (p: Periode) => {
    setLoadingDiagnostics(true);
    try {
      setDiagnostics(await statsService.getDiagnosticsFrequents(p));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger les statistiques',
      });
    } finally {
      setLoadingDiagnostics(false);
    }
  }, []);

  useEffect(() => {
    setScrollX(0);
    loadPeriode(periode);
  }, [periode, loadPeriode]);

  // "Prescriptions par médecin" et "Diagnostics" suivent la même période que
  // le graphique du haut — se redéclenche au changement de période ET à
  // chaque retour sur l'écran (ex: après création d'une prescription ailleurs).
  useFocusEffect(useCallback(() => {
    loadParMedecin(periode);
    loadDiagnostics(periode);
  }, [periode, loadParMedecin, loadDiagnostics]));

  const chartWidth = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg * 2;
  // Largeur minimale par barre pour garder les libellés lisibles ; au-delà de
  // ce que l'écran peut afficher (le cas "Mois", 12 barres), le graphique
  // devient défilable horizontalement.
  const MIN_BAR_WIDTH = 46;
  const barCount = prescriptionsStats?.data.length ?? 0;
  const chartRenderWidth = Math.max(chartWidth, barCount * MIN_BAR_WIDTH);
  const needsScroll = chartRenderWidth > chartWidth;
  const maxScrollX = chartRenderWidth - chartWidth;
  const maxMedecinTotal = parMedecin?.data.length ? Math.max(...parMedecin.data.map((m) => m.total)) : 0;
  const maxDiagnosticTotal = diagnostics?.data.length ? Math.max(...diagnostics.data.map((d) => d.total)) : 0;

  // Le défilement du graphique se fait par boutons plutôt que par geste tactile :
  // un ScrollView horizontal glissable entrait en conflit avec le geste de
  // balayage du drawer (les deux réagissent aux mouvements horizontaux).
  const chartScrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const scrollByPage = (direction: 1 | -1) => {
    const nextX = Math.max(0, Math.min(maxScrollX, scrollX + direction * chartWidth * 0.9));
    chartScrollRef.current?.scrollTo({ x: nextX, animated: true });
    setScrollX(nextX);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Statistiques" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Prescriptions créées</Text>

        {/* Sélecteur de période */}
        <View style={styles.periodeRow}>
          {PERIODES.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriode(p.key)}
              style={[styles.periodeBtn, periode === p.key && styles.periodeBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodeTxt, periode === p.key && styles.periodeTxtActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Carte total */}
        {prescriptionsStats && !loadingPeriode && (
          <View style={styles.totalCard}>
            <Text style={styles.totalValue}>{prescriptionsStats.total}</Text>
            <Text style={styles.totalLabel}>
              prescription{prescriptionsStats.total > 1 ? 's' : ''} — {PERIODES.find((p) => p.key === periode)?.label.toLowerCase()}
            </Text>
          </View>
        )}

        {/* Graphique */}
        <View style={styles.card}>
          {loadingPeriode ? (
            <ActivityIndicator color={Colors.admin} style={{ marginVertical: 60 }} />
          ) : prescriptionsStats && chartWidth > 0 ? (
            <View>
              <ScrollView
                ref={chartScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={needsScroll ? undefined : { width: '100%' }}
              >
                <BarChart
                  data={{
                    labels: prescriptionsStats.data.map((d) => d.label),
                    datasets: [{ data: prescriptionsStats.data.map((d) => d.total) }],
                  }}
                  width={chartRenderWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  chartConfig={{
                    backgroundColor: Colors.surface,
                    backgroundGradientFrom: Colors.surface,
                    backgroundGradientTo: Colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                    barPercentage: 0.6,
                    propsForLabels: { fontSize: 10 },
                  }}
                  style={{ borderRadius: Radius.lg, marginLeft: -Spacing.lg }}
                />
              </ScrollView>

              {needsScroll && (
                <View style={styles.chartNav}>
                  <TouchableOpacity
                    onPress={() => scrollByPage(-1)}
                    disabled={scrollX <= 0}
                    style={[styles.chartNavBtn, scrollX <= 0 && styles.chartNavBtnDisabled]}
                  >
                    <Ionicons name="chevron-back" size={18} color={scrollX <= 0 ? Colors.textMuted : 'white'} />
                  </TouchableOpacity>
                  <Text style={styles.chartNavHint}>Faites défiler avec les flèches</Text>
                  <TouchableOpacity
                    onPress={() => scrollByPage(1)}
                    disabled={scrollX >= maxScrollX}
                    style={[styles.chartNavBtn, scrollX >= maxScrollX && styles.chartNavBtnDisabled]}
                  >
                    <Ionicons name="chevron-forward" size={18} color={scrollX >= maxScrollX ? Colors.textMuted : 'white'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Prescriptions par médecin */}
        <Text style={styles.pageTitle}>
          Prescriptions par médecin <Text style={styles.pageTitlePeriode}>— {PERIODES.find((p) => p.key === periode)?.label.toLowerCase()}</Text>
        </Text>
        <View style={styles.card}>
          {loadingMedecin ? (
            <ActivityIndicator color={Colors.admin} style={{ marginVertical: 40 }} />
          ) : !parMedecin || parMedecin.data.length === 0 ? (
            <Text style={styles.empty}>Aucune prescription enregistrée.</Text>
          ) : (
            parMedecin.data.map((m) => (
              <View key={m.medecinId} style={styles.medecinRow}>
                <View style={styles.medecinHeader}>
                  <Text style={styles.medecinNom} numberOfLines={1}>{m.nom}</Text>
                  <Text style={styles.medecinTotal}>{m.total}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${maxMedecinTotal > 0 ? (m.total / maxMedecinTotal) * 100 : 0}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Diagnostics les plus fréquents */}
        <Text style={styles.pageTitle}>
          Diagnostics les plus fréquents <Text style={styles.pageTitlePeriode}>— {PERIODES.find((p) => p.key === periode)?.label.toLowerCase()}</Text>
        </Text>
        <View style={styles.card}>
          {loadingDiagnostics ? (
            <ActivityIndicator color={Colors.adminAccent} style={{ marginVertical: 40 }} />
          ) : !diagnostics || diagnostics.data.length === 0 ? (
            <Text style={styles.empty}>Aucun diagnostic enregistré.</Text>
          ) : (
            <View>
              <Text style={styles.diagnosticsHint}>
                {diagnostics.diagnosticsDistincts} diagnostic{diagnostics.diagnosticsDistincts > 1 ? 's' : ''} distinct{diagnostics.diagnosticsDistincts > 1 ? 's' : ''}
                {diagnostics.diagnosticsDistincts > 10 ? ' · top 10 affiché, le reste dans "Autres"' : ''}
              </Text>
              {diagnostics.data.map((d) => (
                <View key={d.label} style={styles.medecinRow}>
                  <View style={styles.medecinHeader}>
                    <Text style={styles.medecinNom} numberOfLines={1}>{d.label}</Text>
                    <Text style={styles.diagnosticTotal}>{d.total}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFillAccent,
                        { width: `${maxDiagnosticTotal > 0 ? (d.total / maxDiagnosticTotal) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  pageTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.lg },
  pageTitlePeriode: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  periodeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  periodeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  periodeBtnActive: { backgroundColor: Colors.admin, ...Shadows.sm },
  periodeTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  periodeTxtActive: { color: 'white' },
  totalCard: {
    backgroundColor: Colors.admin,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  totalValue: { fontSize: 40, fontWeight: '900', color: 'white' },
  totalLabel: { fontSize: 12, fontWeight: '700', color: 'white', opacity: 0.85, marginTop: 2, textTransform: 'uppercase' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  empty: { textAlign: 'center', color: Colors.textMuted, paddingVertical: Spacing.xl },
  chartNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  chartNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.admin,
    alignItems: 'center', justifyContent: 'center',
  },
  chartNavBtnDisabled: { backgroundColor: Colors.surfaceAlt },
  chartNavHint: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  medecinRow: { marginBottom: Spacing.lg },
  medecinHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  medecinNom: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginRight: Spacing.sm },
  medecinTotal: { fontSize: 13, fontWeight: '800', color: Colors.admin },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.admin },
  barFillAccent: { height: '100%', borderRadius: 4, backgroundColor: Colors.adminAccent },
  diagnosticTotal: { fontSize: 13, fontWeight: '800', color: Colors.adminAccentDark },
  diagnosticsHint: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.md },
});
