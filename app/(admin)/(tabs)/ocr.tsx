import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ocrService, ResultatOcr } from '../../../api/ocrService';
import { pharmacieGardeService } from '../../../api/pharmacieGardeService';
import { PharmacieGarde } from '../../../types/collection';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import AppHeader from '../../../components/AppHeader';
import { ZoomableImageViewer } from '../../../components/ZoomableImageViewer';

/** Formate une date Firestore ({_seconds}/{seconds}) en "JJ/MM/AAAA à HH:MM". */
function formatDate(ts: any): string | null {
  if (!ts) return null;
  const seconds = typeof ts === 'object' ? (ts._seconds ?? ts.seconds) : null;
  const d = seconds != null ? new Date(seconds * 1000) : null;
  if (!d || isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Écran OCR d'une publication de pharmacies de garde.
 *
 * Affiche le contenu de la table `ocr` pour cette publication et permet de
 * (re)lancer l'analyse. L'appel à Groq est fait par le backend : la clé API ne
 * transite jamais par l'application.
 */
export default function OcrScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [publication, setPublication] = useState<PharmacieGarde | null>(null);
  const [resultat, setResultat] = useState<ResultatOcr | null>(null);
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState(false);
  // Affiche ouverte en plein écran (pincer / double-tap pour zoomer).
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const charger = useCallback(async (pharmacieGardeId: string) => {
    try {
      // Les deux appels sont indépendants : on les lance ensemble.
      const [pub, ocr] = await Promise.all([
        pharmacieGardeService.getById(pharmacieGardeId),
        ocrService.getPourPharmacieGarde(pharmacieGardeId),
      ]);
      setPublication(pub);
      setResultat(ocr);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger la publication',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (id) charger(id);
    else setLoading(false);
  }, [id, charger]));

  const lancerOcr = async () => {
    if (!id || generation) return;
    setGeneration(true);
    try {
      const nouveau = await ocrService.generer(id);
      setResultat(nouveau);
      Toast.show({
        type: nouveau ? 'success' : 'error',
        text1: nouveau ? 'OCR terminé' : 'Aucun résultat',
        text2: nouveau
          ? `${nouveau.nbPharmacies} pharmacie(s) extraite(s)`
          : "Le workflow n'a rien enregistré pour cette publication.",
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'OCR impossible',
        // L'appel au webhook n8n n'est pas une requête axios : le message utile
        // est dans error.message, pas dans error.response.
        text2: error.response?.data?.error || error.message || "L'analyse de l'image a échoué",
      });
    } finally {
      setGeneration(false);
    }
  };

  const supprimer = () => {
    if (!id) return;
    Alert.alert(
      'Supprimer le résultat',
      "Le contenu OCR de cette publication sera effacé de la table. L'affiche, elle, n'est pas touchée.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ocrService.remove(id);
              setResultat(null);
              Toast.show({ type: 'success', text1: 'Résultat supprimé' });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: error.response?.data?.error || 'Suppression impossible',
              });
            }
          },
        },
      ],
    );
  };

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="OCR" />
        <View style={styles.center}>
          <Text style={styles.empty}>Aucune publication sélectionnée.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="OCR" />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.adminAccent} />
        </View>
      </SafeAreaView>
    );
  }

  const images = publication?.attachement ?? [];
  const sansImage = images.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="OCR" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* En-tête : retour + publication concernée */}
        <View style={styles.head}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>OCR de l&apos;affiche</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Publication #{publication?.idpost ?? id}
            </Text>
          </View>
        </View>

        {/* Affiches analysées */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Affiche{images.length > 1 ? 's' : ''} source</Text>
          {sansImage ? (
            <Text style={styles.empty}>
              Cette publication n&apos;a aucune image : il n&apos;y a rien à analyser.
            </Text>
          ) : (
            <>
              <Text style={styles.imagesHint}>
                {images.length} affiche{images.length > 1 ? 's' : ''} · appuyez pour agrandir et zoomer
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {images.map((url, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => setZoomUri(url)}>
                    <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                    <View style={styles.loupe}>
                      <Ionicons name="search" size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Bouton de génération */}
        <TouchableOpacity
          style={[styles.genererBtn, (sansImage || generation) && styles.genererBtnDisabled]}
          onPress={lancerOcr}
          disabled={sansImage || generation}
          activeOpacity={0.85}
        >
          {generation ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={styles.genererTxt}>Analyse en cours…</Text>
            </>
          ) : (
            <>
              <Ionicons name="scan" size={20} color="white" />
              <Text style={styles.genererTxt}>
                {resultat ? "Relancer l'OCR" : "Générer l'OCR"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {generation && (
          <Text style={styles.hint}>
            Le workflow analyse les affiches une par une — comptez plusieurs dizaines de secondes
            si la publication en contient plusieurs.
          </Text>
        )}

        {/* Contenu de la table ocr pour cette publication */}
        <Text style={styles.sectionHeading}>Table « ocr »</Text>

        {!resultat ? (
          <View style={styles.card}>
            <Text style={styles.empty}>
              Aucun résultat enregistré pour cette publication.
              {!sansImage ? ' Lancez une analyse pour en créer un.' : ''}
            </Text>
          </View>
        ) : (
          <>
            {/* Métadonnées de l'enregistrement */}
            <View style={styles.card}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Pharmacies extraites</Text>
                <Text style={styles.metaValeur}>{resultat.nbPharmacies}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Images analysées</Text>
                <Text style={styles.metaValeur}>{resultat.images.length}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Lien publication</Text>
                <Text style={styles.metaValeurPetite} numberOfLines={1}>
                  {resultat.pharmacieGardeId}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Créé le</Text>
                <Text style={styles.metaValeurPetite}>{formatDate(resultat.dateCreation) ?? '—'}</Text>
              </View>
              {formatDate(resultat.dateModification) !== formatDate(resultat.dateCreation) && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Ré-analysé le</Text>
                  <Text style={styles.metaValeurPetite}>{formatDate(resultat.dateModification)}</Text>
                </View>
              )}
              <View style={[styles.metaRow, styles.metaRowLast]}>
                <Text style={styles.metaLabel}>Modèle</Text>
                <Text style={styles.metaValeurPetite} numberOfLines={1}>{resultat.modele}</Text>
              </View>

              {resultat.erreurs.length > 0 && (
                <Text style={styles.erreur}>
                  {resultat.erreurs.length} image(s) non lisible(s) — résultat partiel.
                </Text>
              )}
            </View>

            {/* Pharmacies extraites */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Pharmacies</Text>
              {resultat.pharmacies.length === 0 ? (
                <Text style={styles.empty}>
                  Aucune pharmacie n&apos;a pu être identifiée sur cette affiche.
                </Text>
              ) : (
                resultat.pharmacies.map((p, i) => (
                  <View key={`${p.nom}-${i}`}>
                    {/* En-tête de ville, au premier élément et à chaque
                        changement : l'affiche est découpée en blocs par ville. */}
                    {!!p.ville && p.ville !== resultat.pharmacies[i - 1]?.ville && (
                      <View style={styles.villeRow}>
                        <Ionicons name="business-outline" size={13} color={Colors.adminAccentDark} />
                        <Text style={styles.villeTxt}>{p.ville}</Text>
                        <View style={styles.villeTrait} />
                      </View>
                    )}

                    <View
                      style={[styles.pharmacie, i === resultat.pharmacies.length - 1 && styles.pharmacieLast]}
                    >
                    <Text style={styles.rang}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nom}>{p.nom || '(nom illisible)'}</Text>
                      {p.adresse ? (
                        <View style={styles.ligne}>
                          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                          <Text style={styles.adresse}>{p.adresse}</Text>
                        </View>
                      ) : null}
                      {p.telephones.length > 0 && (
                        <View style={styles.ligne}>
                          <Ionicons name="call-outline" size={13} color={Colors.info} />
                          <Text style={styles.tel}>{p.telephones.join(' · ')}</Text>
                        </View>
                      )}
                    </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Texte brut */}
            {resultat.texteBrut ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Texte brut lu</Text>
                <Text style={styles.brut}>{resultat.texteBrut}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.supprBtn} onPress={supprimer} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.supprTxt}>Supprimer ce résultat</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Visualiseur plein écran : pincer, déplacer ou double-taper pour zoomer.
          Même composant que l'écran détail des pharmacies de garde. */}
      <ZoomableImageViewer
        uri={zoomUri}
        visible={!!zoomUri}
        onClose={() => setZoomUri(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 10, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 16, fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  imagesHint: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.sm },
  imagesRow: { flexDirection: 'row' },
  image: {
    width: 120, height: 160,
    borderRadius: Radius.md,
    marginRight: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  // Pastille loupe posée sur la vignette : sans repère visuel, rien n'indique
  // que l'image est cliquable.
  loupe: {
    position: 'absolute',
    right: 16, bottom: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  genererBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.adminAccent,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  genererBtnDisabled: { opacity: 0.45 },
  genererTxt: { color: 'white', fontWeight: '800', fontSize: 15 },
  hint: {
    color: Colors.textMuted,
    fontSize: 11, fontWeight: '600',
    textAlign: 'center',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaRowLast: { borderBottomWidth: 0 },
  metaLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  metaValeur: { color: Colors.adminAccentDark, fontSize: 15, fontWeight: '800' },
  metaValeurPetite: { flex: 1, color: Colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  erreur: { color: Colors.danger, fontSize: 11, fontWeight: '600', marginTop: Spacing.md },
  // En-tête de bloc : reprend le découpage par ville de l'affiche.
  villeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, marginBottom: 4 },
  villeTxt: {
    color: Colors.adminAccentDark,
    fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginLeft: 6,
  },
  villeTrait: { flex: 1, height: 1, backgroundColor: Colors.adminAccentSoft, marginLeft: Spacing.sm },
  pharmacie: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pharmacieLast: { borderBottomWidth: 0 },
  rang: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.adminAccentSoft,
    color: Colors.adminAccentDark,
    fontSize: 11, fontWeight: '800',
    textAlign: 'center', lineHeight: 24,
  },
  nom: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  adresse: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  tel: { color: Colors.info, fontSize: 13, fontWeight: '600' },
  brut: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  supprBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg,
  },
  supprTxt: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
});
