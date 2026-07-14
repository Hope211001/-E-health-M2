import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { pharmacieGardeService } from '../../api/pharmacieGardeService';
import { PharmacieGarde } from '../../types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

// Webhook n8n qui déclenche le scraping des pharmacies de garde.
const SCRAPE_WEBHOOK_URL = 'https://n8n.srv903010.hstgr.cloud/webhook/pharmacie-de-garde';

// Formate une date Firestore ({_seconds}/{seconds}) ou une chaîne ISO en "JJ/MM/AAAA à HH:MM".
function formatDate(ts: any): string | null {
  if (!ts) return null;
  let d: Date | null = null;
  if (typeof ts === 'object') {
    const seconds = ts._seconds ?? ts.seconds;
    if (seconds != null) d = new Date(seconds * 1000);
  } else if (typeof ts === 'string') {
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PharmacieGardeListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PharmacieGarde[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Scraping (webhook n8n)
  const [scrapeVisible, setScrapeVisible] = useState(false);
  const [fbUrl, setFbUrl] = useState('https://www.facebook.com/pharmacie.madagascar/');
  const [nbPosts, setNbPosts] = useState('10');
  const [scraping, setScraping] = useState(false);

  const launchScrape = async () => {
    const url = fbUrl.trim();
    if (!/facebook\.com/i.test(url)) {
      Toast.show({ type: 'error', text1: 'Lien invalide', text2: 'Entrez un lien facebook.com valide.' });
      return;
    }
    const limit = Math.min(100, Math.max(1, parseInt(nbPosts, 10) || 10));

    setScraping(true);
    // On n'attend pas indéfiniment la fin du workflow (scraping long).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(SCRAPE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: url,
          resultsLimit: limit,
          startUrls: [{ url }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Le webhook (Option A « Immediately ») répond un message générique n8n.
      // On affiche toujours notre message clair en français.
      setScrapeVisible(false);
      Alert.alert(
        '✅ Scraping lancé',
        'Le scraping est lancé. Veuillez patienter quelques minutes, puis rafraîchissez la liste pour voir le résultat.',
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // La requête est bien partie ; le workflow continue côté n8n.
        setScrapeVisible(false);
        Alert.alert(
          '✅ Scraping lancé',
          'Le traitement continue côté serveur. Veuillez patienter quelques minutes, puis rafraîchissez la liste.',
        );
      } else {
        Toast.show({ type: 'error', text1: 'Échec', text2: 'Impossible de contacter le webhook.' });
      }
    } finally {
      clearTimeout(timer);
      setScraping(false);
    }
  };

  // Tri décroissant : les publications les plus récentes d'abord.
  // Les idpost sont les IDs de post Facebook (numériques, quasi croissants
  // dans le temps) → un tri numérique décroissant = du plus récent au plus ancien.
  const trierDecroissant = (list: PharmacieGarde[]) =>
    [...list].sort((a, b) => {
      const na = Number(a.idpost);
      const nb = Number(b.idpost);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      return String(b.idpost).localeCompare(String(a.idpost));
    });

  const load = async (q?: string) => {
    try {
      const list = await pharmacieGardeService.list(q);
      setItems(trierDecroissant(list));
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

  // Recharge à chaque fois que l'écran reprend le focus (retour du formulaire).
  useFocusEffect(useCallback(() => { load(search); }, []));

  const handleSearch = () => {
    setLoading(true);
    load(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setLoading(true);
    load('');
  };

  const handleToggle = async (id: string) => {
    try {
      const { isVisible } = await pharmacieGardeService.toggleVisibilite(id);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, isVisible } : p)));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Action impossible',
      });
    }
  };

  const handleDelete = (item: PharmacieGarde) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette pharmacie de garde ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await pharmacieGardeService.remove(item.id);
              setItems((prev) => prev.filter((p) => p.id !== item.id));
              Toast.show({ type: 'success', text1: 'Supprimé' });
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
          <Text style={styles.title}>Pharmacies de garde</Text>
          <Text style={styles.subtitle}>{items.length} publication(s)</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(APP_ROUTES.ADMIN.PHARMACIE_GARDE_FORM)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnTxt}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Zone de recherche */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (texte, lien, id)..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bannière : lancer le scraping Facebook via le webhook n8n */}
      <TouchableOpacity style={styles.scrapeBanner} activeOpacity={0.9} onPress={() => setScrapeVisible(true)}>
        <View style={styles.scrapeIcon}>
          <Ionicons name="cloud-download" size={18} color={Colors.admin} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scrapeTitle}>Lancer le scraping</Text>
          <Text style={styles.scrapeSub}>Récupérer les pharmacies de garde depuis Facebook</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(search.trim()); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune pharmacie de garde.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* En-tête : visibilité + id */}
            <View style={styles.cardHead}>
              <View style={[
                styles.badge,
                item.isVisible ? styles.badgeVisible : styles.badgeHidden,
              ]}>
                <View style={[
                  styles.dot,
                  { backgroundColor: item.isVisible ? Colors.success : Colors.textMuted },
                ]} />
                <Text style={[
                  styles.badgeTxt,
                  { color: item.isVisible ? Colors.success : Colors.textMuted },
                ]}>
                  {item.isVisible ? 'Visible' : 'Masqué'}
                </Text>
              </View>
              <Text style={styles.idTxt} numberOfLines={1}>#{item.idpost}</Text>
            </View>

            {/* Date de création */}
            {formatDate(item.dateCreation) && (
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.dateTxt}>Ajouté le {formatDate(item.dateCreation)}</Text>
              </View>
            )}

            {/* Texte du post + "Lire plus" */}
            {item.textPost ? (
              <>
                <Text
                  style={styles.cardText}
                  numberOfLines={expanded[item.id] ? undefined : 4}
                >
                  {item.textPost}
                </Text>
                {item.textPost.length > 150 && (
                  <TouchableOpacity
                    onPress={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}
                    hitSlop={8}
                  >
                    <Text style={styles.readMore}>
                      {expanded[item.id] ? 'Lire moins ▲' : 'Lire plus ▼'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.cardTextEmpty}>(Aucun texte)</Text>
            )}

            {/* Aperçu des images (tap → écran détail avec image en grand) */}
            {item.attachement.length > 0 && (
              <TouchableOpacity
                style={styles.attachRow}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: APP_ROUTES.ADMIN.PHARMACIE_GARDE_DETAIL,
                  params: { id: item.id },
                })}
              >
                {item.attachement.slice(0, 3).map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.thumb} />
                ))}
                {item.attachement.length > 3 && (
                  <View style={[styles.thumb, styles.thumbMore]}>
                    <Text style={styles.thumbMoreTxt}>+{item.attachement.length - 3}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Bouton : voir tout le détail */}
            <TouchableOpacity
              style={styles.detailBtn}
              activeOpacity={0.85}
              onPress={() => router.push({
                pathname: APP_ROUTES.ADMIN.PHARMACIE_GARDE_DETAIL,
                params: { id: item.id },
              })}
            >
              <Ionicons name="expand" size={16} color={Colors.admin} />
              <Text style={styles.detailBtnTxt}>Voir tout le détail</Text>
            </TouchableOpacity>

            {/* Boutons CRUD */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, item.isVisible ? styles.actionMuted : styles.actionSuccess]}
                onPress={() => handleToggle(item.id)}
              >
                <Ionicons
                  name={item.isVisible ? 'eye-off' : 'eye'}
                  size={16}
                  color={item.isVisible ? Colors.textMuted : Colors.success}
                />
                <Text style={[styles.actionTxt, { color: item.isVisible ? Colors.textMuted : Colors.success }]}>
                  {item.isVisible ? 'Masquer' : 'Afficher'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionInfo]}
                onPress={() => router.push({
                  pathname: APP_ROUTES.ADMIN.PHARMACIE_GARDE_FORM,
                  params: { id: item.id },
                })}
              >
                <Ionicons name="create-outline" size={16} color={Colors.info} />
                <Text style={[styles.actionTxt, { color: Colors.info }]}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDanger]}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={[styles.actionTxt, { color: Colors.danger }]}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* --- Fenêtre de scraping --- */}
      <Modal visible={scrapeVisible} transparent animationType="fade" onRequestClose={() => setScrapeVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View style={styles.scrapeIcon}>
                <Ionicons name="cloud-download" size={20} color={Colors.admin} />
              </View>
              <Text style={styles.modalTitle}>Scraping des pharmacies</Text>
              <TouchableOpacity onPress={() => setScrapeVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Lien de la page / groupe Facebook</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://www.facebook.com/..."
              placeholderTextColor={Colors.textMuted}
              value={fbUrl}
              onChangeText={setFbUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.modalLabel}>Nombre de posts à scraper</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10"
              placeholderTextColor={Colors.textMuted}
              value={nbPosts}
              onChangeText={(t) => setNbPosts(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.modalHint}>Entre 1 et 100 posts.</Text>

            <TouchableOpacity
              style={[styles.launchBtn, scraping && { opacity: 0.7 }]}
              onPress={launchScrape}
              disabled={scraping}
              activeOpacity={0.85}
            >
              {scraping ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="play" size={18} color="white" />
                  <Text style={styles.launchTxt}>Lancer le scraping</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.admin,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.md,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.textPrimary, fontSize: 14 },
  searchBtn: {
    backgroundColor: Colors.admin,
    width: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrapeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  scrapeIcon: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  scrapeTitle: { color: Colors.textPrimary, fontWeight: '800', fontSize: 14 },
  scrapeSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  modalLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 6, marginTop: 8 },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    color: Colors.textPrimary, fontSize: 15,
  },
  modalHint: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.admin,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  launchTxt: { color: 'white', fontWeight: '800', fontSize: 15 },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing['3xl'] },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeVisible: { backgroundColor: Colors.successBg },
  badgeHidden: { backgroundColor: Colors.surfaceAlt },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  idTxt: { fontSize: 11, color: Colors.textMuted, maxWidth: 140 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  dateTxt: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  cardText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  cardTextEmpty: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  readMore: { color: Colors.admin, fontWeight: '700', fontSize: 12, marginTop: 4 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailBtnTxt: { color: Colors.admin, fontWeight: '700', fontSize: 13 },
  attachRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  thumb: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
  },
  thumbMore: { alignItems: 'center', justifyContent: 'center' },
  thumbMoreTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkTxt: { flex: 1, color: Colors.info, fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  actionSuccess: { backgroundColor: Colors.successBg },
  actionMuted: { backgroundColor: Colors.surfaceAlt },
  actionInfo: { backgroundColor: Colors.infoBg },
  actionDanger: { backgroundColor: Colors.dangerBg },
  actionTxt: { fontSize: 12, fontWeight: '700' },
});
