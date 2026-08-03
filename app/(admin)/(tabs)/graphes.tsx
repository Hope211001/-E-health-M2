import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { statsService, Periode, PrescriptionsParPeriode, PrescriptionsParMedecin, DiagnosticsFrequents } from '../../../api/statsService';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import AppHeader from '../../../components/AppHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PERIODES: { key: Periode; label: string }[] = [
  { key: 'semaine', label: '7 jours' },
  { key: 'mois', label: 'Mois' },
  { key: 'annee', label: 'Années' },
];

/** Raccourcit un libellé trop long pour tenir sous un point du graphique. */
const tronquer = (texte: string, max = 10) => (texte.length > max ? `${texte.slice(0, max - 1)}…` : texte);

/**
 * Habillage commun aux deux courbes de l'écran : trait fin, aplat dégradé sous
 * la courbe, points cerclés de la couleur du fond, grille horizontale discrète.
 * Seule la teinte de la série change — les textes gardent les couleurs du thème
 * (jamais la couleur de la série) pour rester lisibles.
 */
const buildCourbeConfig = (hex: string, rgb: string) => ({
  backgroundColor: Colors.surface,
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.surface,
  decimalPlaces: 0,
  strokeWidth: 2,
  color: (opacity = 1) => `rgba(${rgb}, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  fillShadowGradient: hex,
  fillShadowGradientFromOpacity: 0.18,
  fillShadowGradientToOpacity: 0,
  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.surface },
  propsForBackgroundLines: { stroke: Colors.border, strokeWidth: 1 },
});

const COURBE_CHART_CONFIG = {
  admin: { ...buildCourbeConfig(Colors.admin, '5, 150, 105'), propsForLabels: { fontSize: 10 } },
  accent: { ...buildCourbeConfig(Colors.adminAccent, '124, 58, 237'), propsForLabels: { fontSize: 9 } },
  bleu: { ...buildCourbeConfig(Colors.chartBlue, '37, 99, 235'), propsForLabels: { fontSize: 9 } },
};

/**
 * Défilement horizontal d'un graphique piloté par boutons plutôt que par geste
 * tactile : un ScrollView glissable entrait en conflit avec le geste de balayage
 * du drawer (les deux réagissent aux mouvements horizontaux).
 */
function useChartScroll(chartWidth: number, chartRenderWidth: number) {
  const ref = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const maxScrollX = Math.max(0, chartRenderWidth - chartWidth);
  const needsScroll = maxScrollX > 0;

  const reset = useCallback(() => {
    ref.current?.scrollTo({ x: 0, animated: false });
    setScrollX(0);
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const nextX = Math.max(0, Math.min(maxScrollX, scrollX + direction * chartWidth * 0.9));
    ref.current?.scrollTo({ x: nextX, animated: true });
    setScrollX(nextX);
  };

  return { ref, scrollX, maxScrollX, needsScroll, scrollByPage, reset };
}

/** Flèches de navigation affichées sous un graphique plus large que l'écran. */
function ChartNav({ scrollX, maxScrollX, onScroll, color }: {
  scrollX: number;
  maxScrollX: number;
  onScroll: (direction: 1 | -1) => void;
  color: string;
}) {
  const atStart = scrollX <= 0;
  const atEnd = scrollX >= maxScrollX;
  return (
    <View style={styles.chartNav}>
      <TouchableOpacity
        onPress={() => onScroll(-1)}
        disabled={atStart}
        style={[styles.chartNavBtn, { backgroundColor: color }, atStart && styles.chartNavBtnDisabled]}
      >
        <Ionicons name="chevron-back" size={18} color={atStart ? Colors.textMuted : 'white'} />
      </TouchableOpacity>
      <Text style={styles.chartNavHint}>Faites défiler avec les flèches</Text>
      <TouchableOpacity
        onPress={() => onScroll(1)}
        disabled={atEnd}
        style={[styles.chartNavBtn, { backgroundColor: color }, atEnd && styles.chartNavBtnDisabled]}
      >
        <Ionicons name="chevron-forward" size={18} color={atEnd ? Colors.textMuted : 'white'} />
      </TouchableOpacity>
    </View>
  );
}

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
  // Largeur minimale par point pour garder les libellés lisibles ; au-delà de
  // ce que l'écran peut afficher (le cas "Mois", 12 points), le graphique
  // devient défilable horizontalement.
  const MIN_STEP_WIDTH = 52;
  const pointCount = prescriptionsStats?.data.length ?? 0;
  const chartRenderWidth = Math.max(chartWidth, pointCount * MIN_STEP_WIDTH);
  const prescriptionScroll = useChartScroll(chartWidth, chartRenderWidth);

  // Un seul chiffre est écrit directement sur la courbe — le pic. Annoter tous
  // les points rendrait le graphique illisible.
  const maxPeriodeTotal = pointCount ? Math.max(...prescriptionsStats!.data.map((d) => d.total)) : 0;
  const indexPic = maxPeriodeTotal > 0
    ? prescriptionsStats!.data.findIndex((d) => d.total === maxPeriodeTotal)
    : -1;

  // Les deux classements (médecins, maladies) sont déjà limités au top 10 côté
  // API. Pour les maladies on écarte en plus la ligne agrégée "Autres", qui
  // n'est pas un diagnostic mais un cumul et écraserait l'échelle.
  const topMedecins = parMedecin?.data ?? [];
  const topDiagnostics = diagnostics?.data.filter((d) => !d.estAutres) ?? [];

  // Plus large qu'un point de la courbe du haut : noms de médecins et de
  // maladies sont bien plus longs qu'un libellé de date.
  const MIN_POINT_WIDTH = 74;
  const medecinRenderWidth = Math.max(chartWidth, topMedecins.length * MIN_POINT_WIDTH);
  const medecinScroll = useChartScroll(chartWidth, medecinRenderWidth);
  const courbeRenderWidth = Math.max(chartWidth, topDiagnostics.length * MIN_POINT_WIDTH);
  const courbeScroll = useChartScroll(chartWidth, courbeRenderWidth);

  const { reset: resetPrescriptionScroll } = prescriptionScroll;
  const { reset: resetMedecinScroll } = medecinScroll;
  const { reset: resetCourbeScroll } = courbeScroll;
  // Chaque courbe repart du début au changement de période.
  useEffect(() => { resetPrescriptionScroll(); }, [periode, resetPrescriptionScroll]);
  useEffect(() => { resetMedecinScroll(); }, [periode, resetMedecinScroll]);
  useEffect(() => { resetCourbeScroll(); }, [periode, resetCourbeScroll]);

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
                ref={prescriptionScroll.ref}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={prescriptionScroll.needsScroll ? undefined : { width: '100%' }}
              >
                <LineChart
                  data={{
                    labels: prescriptionsStats.data.map((d) => d.label),
                    datasets: [{ data: prescriptionsStats.data.map((d) => d.total) }],
                  }}
                  width={chartRenderWidth}
                  height={230}
                  fromZero
                  bezier
                  withVerticalLines={false}
                  chartConfig={COURBE_CHART_CONFIG.admin}
                  style={{ borderRadius: Radius.lg, marginLeft: -Spacing.lg }}
                  renderDotContent={({ x, y, index }) =>
                    index === indexPic ? (
                      <Text key={`pic-${index}`} style={[styles.pointPic, { left: x - 20, top: y - 26 }]}>
                        {maxPeriodeTotal}
                      </Text>
                    ) : null
                  }
                />
              </ScrollView>

              {prescriptionScroll.needsScroll && (
                <ChartNav
                  scrollX={prescriptionScroll.scrollX}
                  maxScrollX={prescriptionScroll.maxScrollX}
                  onScroll={prescriptionScroll.scrollByPage}
                  color={Colors.admin}
                />
              )}
            </View>
          ) : null}
        </View>

        {/* Médecins les plus prescripteurs — courbe du top 10 */}
        <Text style={styles.pageTitle}>
          Médecins les plus prescripteurs <Text style={styles.pageTitlePeriode}>— {PERIODES.find((p) => p.key === periode)?.label.toLowerCase()}</Text>
        </Text>
        <View style={styles.card}>
          {loadingMedecin ? (
            <ActivityIndicator color={Colors.chartBlue} style={{ marginVertical: 40 }} />
          ) : topMedecins.length === 0 ? (
            <Text style={styles.empty}>Aucune prescription enregistrée.</Text>
          ) : (
            <View>
              <Text style={styles.diagnosticsHint}>
                Top {topMedecins.length} des médecins les plus prescripteurs
                {parMedecin && parMedecin.medecinsDistincts > topMedecins.length
                  ? ` · sur ${parMedecin.medecinsDistincts} médecins actifs`
                  : ''}.
              </Text>

              <ScrollView
                ref={medecinScroll.ref}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={medecinScroll.needsScroll ? undefined : { width: '100%' }}
              >
                <LineChart
                  data={{
                    // Libellés tronqués sous la courbe ; les noms complets sont
                    // repris dans la légende juste en dessous.
                    labels: topMedecins.map((m) => tronquer(m.nom)),
                    datasets: [{ data: topMedecins.map((m) => m.total) }],
                  }}
                  width={medecinRenderWidth}
                  height={230}
                  fromZero
                  bezier
                  withVerticalLines={false}
                  chartConfig={COURBE_CHART_CONFIG.bleu}
                  style={{ borderRadius: Radius.lg, marginLeft: -Spacing.lg }}
                />
              </ScrollView>

              {medecinScroll.needsScroll && (
                <ChartNav
                  scrollX={medecinScroll.scrollX}
                  maxScrollX={medecinScroll.maxScrollX}
                  onScroll={medecinScroll.scrollByPage}
                  color={Colors.chartBlue}
                />
              )}

              {/* Légende : le nom complet de chaque point de la courbe. */}
              <View style={styles.legende}>
                {topMedecins.map((m, index) => (
                  <View key={m.medecinId} style={styles.legendeRow}>
                    <Text style={[styles.legendeRang, styles.legendeRangBleu]}>{index + 1}</Text>
                    <Text style={styles.legendeNom} numberOfLines={1}>{m.nom}</Text>
                    <Text style={styles.medecinTotal}>{m.total}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Maladies les plus fréquentes — courbe du top 10 */}
        <Text style={styles.pageTitle}>
          Maladies les plus fréquentes <Text style={styles.pageTitlePeriode}>— {PERIODES.find((p) => p.key === periode)?.label.toLowerCase()}</Text>
        </Text>

        <View style={styles.card}>
          {loadingDiagnostics ? (
            <ActivityIndicator color={Colors.adminAccent} style={{ marginVertical: 40 }} />
          ) : topDiagnostics.length === 0 ? (
            <Text style={styles.empty}>Aucun diagnostic enregistré.</Text>
          ) : (
            <View>
              <Text style={styles.diagnosticsHint}>
                Top {topDiagnostics.length} des maladies les plus prescrites, de la plus fréquente à la moins fréquente
                {diagnostics && diagnostics.diagnosticsDistincts > topDiagnostics.length
                  ? ` · sur ${diagnostics.diagnosticsDistincts} diagnostics distincts`
                  : ''}.
              </Text>

              <ScrollView
                ref={courbeScroll.ref}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={courbeScroll.needsScroll ? undefined : { width: '100%' }}
              >
                <LineChart
                  data={{
                    // Libellés tronqués sous la courbe ; les noms complets sont
                    // repris dans la légende juste en dessous.
                    labels: topDiagnostics.map((d) => tronquer(d.label)),
                    datasets: [{ data: topDiagnostics.map((d) => d.total) }],
                  }}
                  width={courbeRenderWidth}
                  height={230}
                  fromZero
                  bezier
                  withVerticalLines={false}
                  chartConfig={COURBE_CHART_CONFIG.accent}
                  style={{ borderRadius: Radius.lg, marginLeft: -Spacing.lg }}
                />
              </ScrollView>

              {courbeScroll.needsScroll && (
                <ChartNav
                  scrollX={courbeScroll.scrollX}
                  maxScrollX={courbeScroll.maxScrollX}
                  onScroll={courbeScroll.scrollByPage}
                  color={Colors.adminAccent}
                />
              )}

              {/* Légende : le nom complet de chaque point de la courbe. */}
              <View style={styles.legende}>
                {topDiagnostics.map((d, index) => (
                  <View key={d.label} style={styles.legendeRow}>
                    <Text style={styles.legendeRang}>{index + 1}</Text>
                    <Text style={styles.legendeNom} numberOfLines={1}>{d.label}</Text>
                    <Text style={styles.diagnosticTotal}>{d.total}</Text>
                  </View>
                ))}
              </View>
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
  // Valeur écrite au-dessus du point le plus haut de la courbe.
  pointPic: {
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.adminDark,
  },
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
  medecinTotal: { fontSize: 13, fontWeight: '800', color: Colors.chartBlueDark },
  diagnosticTotal: { fontSize: 13, fontWeight: '800', color: Colors.adminAccentDark },
  diagnosticsHint: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.md },
  legende: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  legendeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  legendeRang: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.adminAccentSoft,
    color: Colors.adminAccentDark,
    fontSize: 11, fontWeight: '800',
    textAlign: 'center', lineHeight: 22,
    marginRight: Spacing.sm,
  },
  legendeRangBleu: { backgroundColor: Colors.chartBlueSoft, color: Colors.chartBlueDark },
  legendeNom: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginRight: Spacing.sm },
});
