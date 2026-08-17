/**
 * etablissements.tsx
 *
 * Les structures de santé enrôlées dans la plateforme.
 *
 * C'est l'écran qui matérialise la portée nationale de Mediora : le superadmin
 * n'administre pas un hôpital, il enrôle des établissements et leur désigne un
 * administrateur. Réservé au superadmin — un admin n'a qu'un établissement, le
 * sien, et rien à gérer ici.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  etablissementService,
  SIGLE_TYPE_ETABLISSEMENT,
} from '@/api/etablissementService';
import type { Etablissement } from '@/types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import AppHeader from '../../../components/AppHeader';
import { useAuth } from '../../../hooks/useAuth';

/** Délai avant de filtrer, pour ne pas recalculer à chaque touche. */
const DELAI_RECHERCHE = 300;

export default function EtablissementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const estSuperadmin = user?.role === 'superadmin';

  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRecherche(saisie.trim()), DELAI_RECHERCHE);
    return () => clearTimeout(timer);
  }, [saisie]);

  const charger = useCallback(async (q: string) => {
    try {
      // `effectifs` : le nombre de comptes rattachés est justement ce qui dit si
      // un établissement est réellement en service ou seulement déclaré.
      const liste = await etablissementService.lister({ q, effectifs: true });
      setEtablissements(liste);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger les établissements',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Rechargé à chaque retour sur l'écran : après une création ou une
  // modification, les effectifs et les libellés ont pu changer.
  useFocusEffect(useCallback(() => {
    setLoading(true);
    charger(recherche);
  }, [recherche, charger]));

  /**
   * Désactivation : pas de suppression possible, un établissement porte des
   * dossiers et des ordonnances qui doivent rester consultables. La
   * confirmation ne porte donc pas sur une perte de données mais sur l'effet
   * réel — plus aucun compte ne pourra y être rattaché.
   */
  const handleStatut = (etablissement: Etablissement) => {
    const desactivation = (etablissement.statut || 'actif') === 'actif';
    Alert.alert(
      desactivation ? 'Désactiver cet établissement ?' : 'Réactiver cet établissement ?',
      desactivation
        ? `Aucun nouveau compte ne pourra être rattaché à ${etablissement.nom}. `
        + `Les ${etablissement.effectifs?.total ?? 0} compte(s) existants restent actifs `
        + `et leurs dossiers consultables.`
        : `${etablissement.nom} pourra de nouveau accueillir des comptes.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: desactivation ? 'Désactiver' : 'Réactiver',
          style: desactivation ? 'destructive' : 'default',
          onPress: async () => {
            setEnCours(etablissement.id);
            try {
              const { statut } = await etablissementService.basculerStatut(etablissement.id);
              setEtablissements((prev) =>
                prev.map((e) => (e.id === etablissement.id ? { ...e, statut } : e)));
              Toast.show({ type: 'success', text1: `Établissement ${statut}` });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Action impossible',
                text2: error.response?.data?.error || 'Réessayez',
              });
            } finally {
              setEnCours(null);
            }
          },
        },
      ],
    );
  };

  if (!estSuperadmin) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Établissements" />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.interditTxt}>
            L&apos;enrôlement des établissements est réservé au super administrateur.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const actifs = etablissements.filter((e) => (e.statut || 'actif') === 'actif').length;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Établissements" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Établissements</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {loading
              ? 'Chargement…'
              : `${etablissements.length} structure${etablissements.length > 1 ? 's' : ''} · ${actifs} active${actifs > 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.adminAccent }]}
          onPress={() => router.push(APP_ROUTES.ADMIN.ETABLISSEMENT_FORM as Href)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnTxt}>Enrôler</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={saisie}
          onChangeText={setSaisie}
          placeholder="Nom ou ville…"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {saisie.length > 0 && (
          <TouchableOpacity onPress={() => setSaisie('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.adminAccent} /></View>
      ) : (
        <FlatList
          data={etablissements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); charger(recherche); }}
              tintColor={Colors.adminAccent}
            />
          }
          ListEmptyComponent={
            <View style={styles.vide}>
              <Ionicons name="business-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.videTitre}>
                {recherche ? `Aucun résultat pour « ${recherche} ».` : 'Aucun établissement enrôlé.'}
              </Text>
              {!recherche && (
                <Text style={styles.videTxt}>
                  Un établissement est le périmètre d&apos;un administrateur : tant
                  qu&apos;il n&apos;y en a aucun, aucun compte d&apos;administration ne peut
                  être créé.
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const actif = (item.statut || 'actif') === 'actif';
            const effectifs = item.effectifs;
            return (
              <View style={[styles.card, !actif && styles.cardInactive]}>
                <View style={styles.cardHead}>
                  <View style={[styles.icone, { backgroundColor: Colors.adminAccentBg }]}>
                    <Ionicons name="business" size={20} color={Colors.adminAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.nom}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {[SIGLE_TYPE_ETABLISSEMENT[item.type] ?? item.type, item.ville?.nom]
                        .filter(Boolean).join('  ·  ')}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: actif ? Colors.successBg : Colors.dangerBg },
                  ]}>
                    <Text style={[
                      styles.statusTxt,
                      { color: actif ? Colors.success : Colors.danger },
                    ]}>
                      {actif ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>

                {/* Effectifs : ce qui distingue une structure en service d'une
                    fiche vide. Un établissement sans admin ne peut recruter
                    personne — c'est l'anomalie la plus courante après un
                    enrôlement. */}
                {effectifs && (
                  <View style={styles.effectifs}>
                    <Effectif icone="shield-checkmark" valeur={effectifs.admin} libelle="admin" />
                    <Effectif icone="medkit" valeur={effectifs.medecin} libelle="médecins" />
                    <Effectif icone="people" valeur={effectifs.patient} libelle="patients" />
                  </View>
                )}
                {effectifs && effectifs.admin === 0 && (
                  <View style={styles.alerte}>
                    <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                    <Text style={styles.alerteTxt}>
                      Aucun administrateur : personne ne peut y créer de médecin.
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.action, { backgroundColor: Colors.adminAccentBg }]}
                    activeOpacity={0.85}
                    onPress={() => router.push(
                      `${APP_ROUTES.ADMIN.ETABLISSEMENT_FORM}?id=${item.id}` as Href,
                    )}
                  >
                    <Ionicons name="create-outline" size={14} color={Colors.adminAccent} />
                    <Text style={[styles.actionTxt, { color: Colors.adminAccent }]}>Modifier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.action,
                      { backgroundColor: actif ? Colors.dangerBg : Colors.successBg },
                    ]}
                    activeOpacity={0.85}
                    disabled={enCours === item.id}
                    onPress={() => handleStatut(item)}
                  >
                    {enCours === item.id
                      ? <ActivityIndicator size="small" color={actif ? Colors.danger : Colors.success} />
                      : (
                        <Text style={[
                          styles.actionTxt,
                          { color: actif ? Colors.danger : Colors.success },
                        ]}>
                          {actif ? 'Désactiver' : 'Réactiver'}
                        </Text>
                      )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Effectif({
  icone, valeur, libelle,
}: { icone: keyof typeof Ionicons.glyphMap; valeur: number; libelle: string }) {
  return (
    <View style={styles.effectif}>
      <Ionicons name={icone} size={13} color={Colors.textMuted} />
      <Text style={styles.effectifTxt}>
        <Text style={styles.effectifNb}>{valeur}</Text> {libelle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  interditTxt: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md, ...Shadows.sm,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  vide: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['3xl'], paddingHorizontal: Spacing.lg },
  videTitre: { color: Colors.textSecondary, fontWeight: '700', textAlign: 'center' },
  videTxt: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: Radius.lg,
    marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardInactive: { opacity: 0.65 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icone: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  cardSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  effectifs: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  effectif: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  effectifTxt: { fontSize: 12, color: Colors.textSecondary },
  effectifNb: { fontWeight: '800', color: Colors.textPrimary },
  alerte: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm, padding: 8,
    borderRadius: Radius.sm, backgroundColor: Colors.warningBg,
  },
  alerteTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.md,
  },
  actionTxt: { fontSize: 12, fontWeight: '700' },
});
