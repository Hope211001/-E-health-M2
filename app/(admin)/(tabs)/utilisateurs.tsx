import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../../api/authService';
import { User, UserRole } from '../../../types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import {
  idAbrege, iconeOrigine, origineCompte, iconeEtablissement, libelleEtablissement,
} from '@/utils/roles';
import { libelleAge } from '@/utils/dateNaissance';
import AppHeader from '../../../components/AppHeader';
import AvatarUtilisateur from '../../../components/AvatarUtilisateur';
import { useAuth } from '../../../hooks/useAuth';

type RoleFiltre = Extract<UserRole, 'medecin' | 'patient' | 'admin'>;

type Onglet = {
  /** Clé de l'onglet, et rôle listé par défaut. */
  role: RoleFiltre;
  /**
   * Rôles réellement listés, quand l'onglet en regroupe plusieurs. Les deux
   * niveaux d'administration partagent un onglet : un quatrième bouton rendrait
   * la barre illisible sur mobile, et le badge de la carte suffit à les
   * distinguer.
   */
  roles?: UserRole[];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  couleur: string;
  fond: string;
  /** Écran de création, quand l'admin peut créer ce type de compte. */
  routeAjout?: string;
  /** Écran de dossier, quand ce type de compte en a un. */
  routeDossier?: string;
  /**
   * Écran de détail des comptes d'administration, qui n'ont pas de dossier :
   * ni file de patients ni ordonnances à y montrer. C'est aussi lui qui porte
   * la photo, que la liste ne charge pas.
   */
  routeDetail?: string;
  vide: string;
};

// Les onglets "Admins" et "Superadmins" ne sont proposés qu'au superadmin :
// l'admin ne peut ni créer ni consulter les comptes de son propre niveau ou
// au-dessus, le backend appliquant la même règle.
const ONGLETS: Onglet[] = [
  {
    role: 'medecin', label: 'Médecins', icon: 'medkit',
    couleur: Colors.primary, fond: Colors.primaryBg,
    routeAjout: APP_ROUTES.ADMIN.MEDECIN_ADD,
    routeDossier: APP_ROUTES.ADMIN.DOSSIER_MEDECIN,
    vide: 'Aucun médecin enregistré.',
  },
  {
    role: 'patient', label: 'Patients', icon: 'people',
    couleur: Colors.patient, fond: Colors.patientBg,
    routeAjout: APP_ROUTES.ADMIN.PATIENT_ADD,
    routeDossier: APP_ROUTES.ADMIN.DOSSIER_PATIENT,
    vide: 'Aucun patient enregistré.',
  },
  {
    role: 'admin', roles: ['admin', 'superadmin'],
    label: 'Administration', icon: 'shield-checkmark',
    couleur: Colors.adminAccent, fond: Colors.adminAccentBg,
    routeAjout: APP_ROUTES.ADMIN.ADMIN_ADD,
    routeDetail: APP_ROUTES.ADMIN.COMPTE_DETAIL,
    vide: 'Aucun compte d’administration enregistré.',
  },
];

const TAILLE_PAGE = 20;
/** Délai avant de lancer la requête, pour ne pas appeler l'API à chaque touche. */
const DELAI_RECHERCHE = 400;

/** Nom affichable d'un compte, avec repli sur l'email si l'état civil manque. */
const nomAffiche = (u: User) =>
  (u.prenom || u.nom) ? `${u.prenom || ''} ${u.nom || ''}`.trim() : u.email;

export default function UtilisateursScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  // Activer/désactiver un compte est réservé au superadmin ; l'admin consulte
  // les listes en lecture seule (le backend applique la même règle).
  const peutModifierStatut = isSuperadmin;

  const onglets = useMemo(
    () => (isSuperadmin ? ONGLETS : ONGLETS.filter((o) => o.role !== 'admin')),
    [isSuperadmin],
  );

  // Le tableau de bord ouvre cet écran directement sur le bon onglet
  // (ex: ?role=patient depuis la tuile "Patients").
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const roleInitial = onglets.find((o) => o.role === roleParam)?.role ?? 'medecin';
  const [roleActif, setRoleActif] = useState<RoleFiltre>(roleInitial);

  // `saisie` suit le champ au caractère près ; `recherche` ne se met à jour
  // qu'après le délai, et c'est elle seule qui déclenche un appel réseau.
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');

  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPlus, setLoadingPlus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onglet = onglets.find((o) => o.role === roleActif) ?? onglets[0];

  useEffect(() => {
    const timer = setTimeout(() => setRecherche(saisie.trim()), DELAI_RECHERCHE);
    return () => clearTimeout(timer);
  }, [saisie]);

  const chargerPage = useCallback(async (role: RoleFiltre, q: string, pageDemandee: number) => {
    try {
      // Un onglet peut regrouper plusieurs rôles (administration = admin +
      // superadmin) ; sinon il ne liste que le sien.
      const filtre = ONGLETS.find((o) => o.role === role)?.roles ?? role;
      const res = await authService.listUsers(filtre, { q, page: pageDemandee, limit: TAILLE_PAGE });
      // Page 1 = remplacement (changement d'onglet, nouvelle recherche, refresh) ;
      // pages suivantes = ajout à la suite pour le défilement infini.
      setUtilisateurs((prev) => (pageDemandee === 1 ? res.data : [...prev, ...res.data]));
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Impossible de charger',
      });
    } finally {
      setLoading(false);
      setLoadingPlus(false);
      setRefreshing(false);
    }
  }, []);

  // Repart de la page 1 au changement d'onglet ou de recherche, et à chaque
  // retour sur l'écran (ex: après la création d'un compte).
  useFocusEffect(useCallback(() => {
    setLoading(true);
    chargerPage(roleActif, recherche, 1);
  }, [roleActif, recherche, chargerPage]));

  const chargerSuite = () => {
    if (loading || loadingPlus || refreshing || page >= totalPages) return;
    setLoadingPlus(true);
    chargerPage(roleActif, recherche, page + 1);
  };

  const changerOnglet = (role: RoleFiltre) => {
    if (role === roleActif) return;
    // La recherche est remise à zéro : une requête saisie pour les médecins
    // n'a en général aucun sens sur les patients, et un écran vide sans raison
    // visible serait déroutant.
    setSaisie('');
    setRecherche('');
    setUtilisateurs([]);
    setTotal(0);
    setLoading(true);
    setRoleActif(role);
  };

  // L'écran est un onglet : quand le tableau de bord y renvoie avec ?role=…,
  // il est souvent déjà monté et l'état initial ne serait donc jamais relu. On
  // applique le paramètre puis on l'efface, pour qu'un nouvel appui sur la même
  // tuile refasse basculer l'onglet même si l'utilisateur en a changé entre-temps.
  useEffect(() => {
    if (!roleParam) return;
    const cible = onglets.find((o) => o.role === roleParam)?.role;
    if (cible && cible !== roleActif) changerOnglet(cible);
    router.setParams({ role: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleParam, roleActif, onglets, router]);

  /** Comptes dont le renvoi d'identifiants est en cours, pour désactiver le bouton. */
  const [renvoiEnCours, setRenvoiEnCours] = useState<string | null>(null);

  /**
   * Renvoie ses identifiants au titulaire d'un compte.
   *
   * Confirmation obligatoire : l'opération génère un NOUVEAU mot de passe, donc
   * invalide l'ancien et déconnecte les sessions ouvertes. Déclenchée par
   * mégarde sur un compte qui fonctionnait, elle en couperait l'accès jusqu'à
   * la lecture de l'email.
   */
  const handleRenvoi = (utilisateur: User) => {
    Alert.alert(
      'Renvoyer les identifiants ?',
      `Un nouveau mot de passe sera généré et envoyé à ${utilisateur.email}. `
      + `L'ancien mot de passe cessera de fonctionner immédiatement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          style: 'destructive',
          onPress: async () => {
            setRenvoiEnCours(utilisateur.uid);
            try {
              await authService.renvoyerIdentifiants(utilisateur.uid);
              Toast.show({
                type: 'success',
                text1: 'Identifiants envoyés',
                text2: utilisateur.email,
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Envoi impossible',
                text2: error.response?.data?.error || 'Vérifiez la configuration email du serveur.',
              });
            } finally {
              setRenvoiEnCours(null);
            }
          },
        },
      ],
    );
  };

  const handleToggle = async (uid: string) => {
    try {
      const { statut } = await authService.toggleUserStatut(uid);
      setUtilisateurs((prev) => prev.map((u) => u.uid === uid ? { ...u, statut } : u));
      Toast.show({ type: 'success', text1: `Compte ${statut}` });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Action impossible',
      });
    }
  };

  const sousTitre = () => {
    if (loading) return 'Chargement…';
    if (recherche) return `${total} résultat${total > 1 ? 's' : ''} pour « ${recherche} »`;
    return `${total} ${onglet.label.toLowerCase()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Utilisateurs" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Utilisateurs</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{sousTitre()}</Text>
        </View>
        {onglet.routeAjout && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: onglet.couleur }]}
            onPress={() => router.push(onglet.routeAjout as Href)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.addBtnTxt}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sélecteur de type de compte : 3 boutons pour le superadmin, 2 pour l'admin */}
      <View style={styles.ongletsRow}>
        {onglets.map((o) => {
          const actif = o.role === roleActif;
          return (
            <TouchableOpacity
              key={o.role}
              onPress={() => changerOnglet(o.role)}
              style={[styles.ongletBtn, actif && { backgroundColor: o.couleur, ...Shadows.sm }]}
              activeOpacity={0.8}
            >
              <Ionicons name={o.icon} size={16} color={actif ? 'white' : Colors.textSecondary} />
              <Text style={[styles.ongletTxt, actif && styles.ongletTxtActif]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barre de recherche — la requête part côté serveur après le délai */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={saisie}
          onChangeText={setSaisie}
          placeholder="Nom, email ou téléphone…"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {saisie.length > 0 && (
          <TouchableOpacity onPress={() => setSaisie('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={onglet.couleur} />
        </View>
      ) : (
        <FlatList
          data={utilisateurs}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          onEndReached={chargerSuite}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); chargerPage(roleActif, recherche, 1); }}
              tintColor={onglet.couleur}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {recherche ? `Aucun résultat pour « ${recherche} ».` : onglet.vide}
            </Text>
          }
          ListFooterComponent={
            loadingPlus ? (
              <ActivityIndicator color={onglet.couleur} style={{ marginVertical: Spacing.lg }} />
            ) : total > TAILLE_PAGE && page >= totalPages ? (
              <Text style={styles.finListe}>Fin de la liste — {total} comptes</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Volontairement SANS `photoURL` : la liste est paginée et
                  défile, chaque ligne lancerait un téléchargement Cloudinary
                  pour une vignette de 44 px. Les initiales identifient tout
                  aussi bien sans requête ; la photo est chargée une seule fois,
                  sur l'écran de détail. */}
              <AvatarUtilisateur
                prenom={item.prenom}
                nom={item.nom}
                email={item.email}
                taille={44}
                couleur={onglet.couleur}
                fond={onglet.fond}
                icone={onglet.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{nomAffiche(item)}</Text>
                {nomAffiche(item) !== item.email && (
                  <Text style={styles.cardSub} numberOfLines={1}>{item.email}</Text>
                )}
                {/* Téléphone, sexe et âge sur une même ligne : trois informations
                    courtes, les empiler allongerait la carte pour rien. L'âge
                    plutôt que la date de naissance — c'est ce qu'on lit d'un
                    coup d'œil dans une liste, la date reste dans le dossier. */}
                {(item.telephone || item.sexe || libelleAge(item.dateNaissance)) ? (
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {[
                      item.telephone,
                      item.sexe === 'M' ? 'Masculin' : item.sexe === 'F' ? 'Féminin' : null,
                      libelleAge(item.dateNaissance),
                    ].filter(Boolean).join('  ·  ')}
                  </Text>
                ) : null}

                {/* Rattachement : affiché seulement au superadmin. Pour un
                    admin, la ligne serait la même sur toutes les cartes — il ne
                    voit que son propre établissement — et n'apprendrait rien. */}
                {isSuperadmin && (
                  <View style={styles.meta}>
                    <Ionicons
                      name={iconeEtablissement(item.etablissement, item.role)}
                      size={11}
                      color={Colors.textMuted}
                    />
                    <Text style={styles.metaTxt} numberOfLines={1}>
                      {libelleEtablissement(item.etablissement, item.role)}
                    </Text>
                  </View>
                )}

                {/* Origine du compte et identifiant technique : l'administration
                    a besoin de savoir qui a enregistré un compte, et l'uid sert
                    de référence quand un utilisateur signale un problème. */}
                <View style={styles.meta}>
                  <Ionicons name={iconeOrigine(item)} size={11} color={Colors.textMuted} />
                  <Text style={styles.metaTxt} numberOfLines={1}>{origineCompte(item)}</Text>
                </View>
                <View style={styles.meta}>
                  <Ionicons name="finger-print-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.metaId} numberOfLines={1}>{idAbrege(item.uid)}</Text>
                </View>

                {/* L'onglet Administration mélange les deux niveaux : sans ce
                    badge, rien ne distinguerait un superadmin d'un admin. */}
                {item.role === 'superadmin' && (
                  <View style={styles.roleBadge}>
                    <Ionicons name="key" size={10} color={Colors.adminAccentDark} />
                    <Text style={styles.roleBadgeTxt}>Super administrateur</Text>
                  </View>
                )}

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
              <View style={styles.actions}>
                {/* Le dossier n'existe que pour les médecins et les patients :
                    un compte admin n'a ni file de patients ni ordonnances. */}
                {onglet.routeDossier && (
                  <TouchableOpacity
                    style={[styles.dossierBtn, { backgroundColor: onglet.fond }]}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: onglet.routeDossier!,
                      params: { id: item.uid },
                    } as Href)}
                  >
                    <Ionicons name="folder-open-outline" size={14} color={onglet.couleur} />
                    <Text style={[styles.dossierTxt, { color: onglet.couleur }]}>Dossier</Text>
                  </TouchableOpacity>
                )}

                {/* Comptes d'administration : pas de dossier, mais une fiche —
                    c'est là que la photo se charge, la liste ne l'affichant
                    volontairement pas. */}
                {onglet.routeDetail && (
                  <TouchableOpacity
                    style={[styles.dossierBtn, { backgroundColor: onglet.fond }]}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: onglet.routeDetail!,
                      params: { id: item.uid },
                    } as Href)}
                  >
                    <Ionicons name="eye-outline" size={14} color={onglet.couleur} />
                    <Text style={[styles.dossierTxt, { color: onglet.couleur }]}>Détail</Text>
                  </TouchableOpacity>
                )}

                {/* Renvoi des identifiants : rattrape un email de création qui
                    n'est jamais arrivé (SMTP tombé, message en indésirables).
                    Sans issue pour un compte Google, qui n'a pas de mot de
                    passe — le bouton est alors masqué plutôt que de produire
                    une erreur au premier appui. */}
                {item.authProvider !== 'google' && (
                  <TouchableOpacity
                    style={[styles.dossierBtn, { backgroundColor: Colors.infoBg }]}
                    activeOpacity={0.85}
                    disabled={renvoiEnCours === item.uid}
                    onPress={() => handleRenvoi(item)}
                  >
                    {renvoiEnCours === item.uid
                      ? <ActivityIndicator size="small" color={Colors.info} />
                      : <Ionicons name="mail-outline" size={14} color={Colors.info} />}
                    <Text style={[styles.dossierTxt, { color: Colors.info }]}>Identifiants</Text>
                  </TouchableOpacity>
                )}

                {peutModifierStatut && (
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
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  ongletsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  ongletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  ongletTxt: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  ongletTxtActif: { color: 'white' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing['3xl'] },
  finListe: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginVertical: Spacing.lg,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: Radius.lg,
    marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaTxt: { flex: 1, color: Colors.textMuted, fontSize: 11 },
  metaId: {
    flex: 1, color: Colors.textMuted, fontSize: 11,
    fontFamily: Fonts?.mono, letterSpacing: 0.2,
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.adminAccentSoft,
  },
  roleBadgeTxt: { fontSize: 10, fontWeight: '700', color: Colors.adminAccentDark },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  toggleTxt: { fontSize: 12, fontWeight: '700' },
  // Les deux boutons de la carte sont empilés : côte à côte, ils débordent dès
  // que le nom du compte est un peu long.
  actions: { alignItems: 'flex-end', gap: 6 },
  dossierBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.md,
  },
  dossierTxt: { fontSize: 12, fontWeight: '700' },
});
