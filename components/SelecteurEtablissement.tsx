/**
 * SelecteurEtablissement.tsx
 *
 * Choix de l'établissement de rattachement, dans les écrans de création de
 * compte.
 *
 * N'a de sens que pour un SUPERADMIN : lui seul a une portée nationale et doit
 * donc désigner l'établissement du compte qu'il crée. Un admin transmet le sien
 * d'office — le backend ignore la valeur qu'il enverrait — et voit à la place un
 * simple rappel de son périmètre : afficher un sélecteur à un seul choix
 * laisserait croire qu'il a une décision à prendre.
 *
 * PRÉSENTATION : un champ compact qui ouvre une modale de recherche, et non une
 * liste dépliée dans le formulaire. À l'échelle d'un pays, la liste des
 * structures se compte en centaines — dépliée, elle repousserait hors de
 * l'écran tous les champs qui la suivent, et le formulaire deviendrait
 * impraticable au pouce.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput,
  Modal, FlatList, Pressable, Keyboard, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  etablissementService,
  SIGLE_TYPE_ETABLISSEMENT,
} from '@/api/etablissementService';
import type { Etablissement } from '@/types/collection';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  valeur: string;
  onChange: (id: string) => void;
  /** Rôle de l'utilisateur connecté — décide de l'affichage. */
  role?: string;
  couleur?: string;
  fond?: string;
  /** Masque le bloc entier (ex : création d'un superadmin, sans périmètre). */
  masque?: boolean;
};

/**
 * Ligne secondaire d'un établissement : « CSB II · Antananarivo ».
 *
 * La localisation vient du bloc `ville` résolu par l'API : l'établissement ne
 * stocke qu'un `villeId`, ce qui permet de renommer une commune sans avoir à
 * reprendre les documents qui la référencent.
 */
function detailEtablissement(e: Etablissement): string {
  return [SIGLE_TYPE_ETABLISSEMENT[e.type] ?? e.type, e.ville?.nom]
    .filter(Boolean)
    .join('  ·  ');
}

export default function SelecteurEtablissement({
  valeur, onChange, role, couleur = Colors.admin, fond = Colors.adminBg, masque,
}: Props) {
  const router = useRouter();
  const { height: hauteurEcran } = useWindowDimensions();
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [hauteurClavier, setHauteurClavier] = useState(0);

  const estSuperadmin = role === 'superadmin';

  // Une `Modal` React Native s'affiche dans sa PROPRE fenêtre native : elle
  // ignore le redimensionnement que le système applique à l'écran quand le
  // clavier s'ouvre, et `KeyboardAvoidingView` n'y change rien sur Android.
  // Le champ de recherche se retrouvait donc caché derrière le clavier, ce qui
  // est particulièrement gênant ici puisqu'il a le focus d'office.
  // On relève la hauteur réelle du clavier et on remonte la feuille d'autant.
  useEffect(() => {
    // `Will` sur iOS pour suivre l'animation du clavier, `Did` sur Android où
    // l'événement `Will` n'existe pas.
    const evtOuverture = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const evtFermeture = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const ouverture = Keyboard.addListener(evtOuverture, (e) =>
      setHauteurClavier(e.endCoordinates.height));
    const fermeture = Keyboard.addListener(evtFermeture, () => setHauteurClavier(0));

    return () => { ouverture.remove(); fermeture.remove(); };
  }, []);

  // Hauteur disponible au-dessus du clavier, moins une marge qui laisse
  // entrevoir le formulaire derrière — on garde ainsi le contexte de ce qu'on
  // était en train de remplir. Le plancher évite une feuille inutilisable sur
  // un petit écran avec un clavier à suggestions.
  const hauteurMaxFeuille = Math.max(260, hauteurEcran - hauteurClavier - 72);

  // `valeur` et `onChange` passent par des refs et non par les dépendances du
  // chargement : `onChange` est presque toujours une lambda déclarée dans le
  // parent, donc une nouvelle fonction à chaque rendu. La mettre en dépendance
  // relancerait une requête réseau à chaque frappe dans le formulaire.
  const valeurRef = useRef(valeur);
  valeurRef.current = valeur;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const charger = useCallback(async () => {
    if (masque) { setChargement(false); return; }
    try {
      // Seuls les établissements ACTIFS : un établissement désactivé a quitté
      // la plateforme, le proposer ne mènerait qu'à un refus du serveur au
      // moment de valider le formulaire.
      const liste = await etablissementService.lister({ statut: 'actif' });
      setEtablissements(liste);
      setErreur('');

      // Un seul choix possible : on le pose d'office plutôt que d'exiger un
      // appui qui n'apporte aucune information. Couvre aussi le retour de
      // l'enrôlement du tout premier établissement, qui se trouve donc
      // sélectionné sans que l'utilisateur ait à y penser.
      if (liste.length === 1 && !valeurRef.current) onChangeRef.current(liste[0].id);
    } catch (e: any) {
      setErreur(e.response?.data?.error || 'Établissements indisponibles');
    } finally {
      setChargement(false);
    }
  }, [masque]);

  // Rechargé à CHAQUE retour sur l'écran, et pas seulement au montage : le
  // formulaire d'enrôlement est un écran voisin, celui qui l'appelle reste donc
  // monté pendant ce temps. Avec un simple useEffect, un établissement tout
  // juste créé n'apparaîtrait pas au retour et la liste semblerait encore vide.
  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const choisi = useMemo(
    () => etablissements.find((e) => e.id === valeur),
    [etablissements, valeur],
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return etablissements;
    return etablissements.filter((e) =>
      [e.nom, e.ville?.nom, SIGLE_TYPE_ETABLISSEMENT[e.type] ?? e.type]
        .filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [etablissements, recherche]);

  if (masque) return null;

  const ouvrirFormulaire = () => {
    setModaleOuverte(false);
    router.push(APP_ROUTES.ADMIN.ETABLISSEMENT_FORM);
  };

  // --- Admin : rappel de son périmètre, sans choix ------------------------
  // `etablissements` ne contient que le sien, le backend ne lui renvoyant pas
  // les autres.
  if (!estSuperadmin) {
    const sien = etablissements[0];
    return (
      <>
        <Text style={styles.label}>Établissement</Text>
        <View style={[styles.rappel, { backgroundColor: fond }]}>
          <Ionicons name="business" size={16} color={couleur} />
          <Text style={styles.rappelTxt}>
            {chargement
              ? 'Chargement…'
              : sien
                ? [sien.nom, sien.ville?.nom].filter(Boolean).join(' — ')
                : "Votre compte n'est rattaché à aucun établissement."}
          </Text>
        </View>
        {!chargement && !sien && (
          <Text style={styles.aide}>
            Demandez à un super administrateur de vous rattacher : sans
            établissement, la création de comptes est refusée.
          </Text>
        )}
      </>
    );
  }

  // --- Superadmin : champ compact + bouton d'enrôlement --------------------
  return (
    <>
      <Text style={styles.label}>Établissement de rattachement</Text>

      <View style={styles.ligneChamp}>
        <TouchableOpacity
          style={[styles.champ, choisi && { borderColor: couleur }]}
          onPress={() => { setRecherche(''); setModaleOuverte(true); }}
          activeOpacity={0.8}
          disabled={chargement}
        >
          <Ionicons
            name="business-outline"
            size={18}
            color={choisi ? couleur : Colors.textMuted}
          />
          <View style={{ flex: 1 }}>
            {chargement ? (
              <Text style={styles.placeholder}>Chargement…</Text>
            ) : choisi ? (
              <>
                <Text style={styles.champNom} numberOfLines={1}>{choisi.nom}</Text>
                <Text style={styles.champDetail} numberOfLines={1}>
                  {detailEtablissement(choisi)}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholder}>
                {etablissements.length === 0
                  ? 'Aucun établissement enrôlé'
                  : 'Choisir un établissement…'}
              </Text>
            )}
          </View>
          {chargement
            ? <ActivityIndicator size="small" color={couleur} />
            : <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />}
        </TouchableOpacity>

        {/* Enrôlement à portée de pouce : l'établissement recherché peut ne pas
            encore exister, et c'est ici qu'on s'en aperçoit. Sans ce bouton, il
            faudrait quitter le formulaire — donc perdre la saisie en cours —
            pour aller le créer depuis l'onglet Établissements. */}
        <TouchableOpacity
          style={[styles.btnAjout, { backgroundColor: fond, borderColor: couleur }]}
          onPress={ouvrirFormulaire}
          activeOpacity={0.85}
          accessibilityLabel="Enrôler un nouvel établissement"
        >
          <Ionicons name="add" size={22} color={couleur} />
        </TouchableOpacity>
      </View>

      {erreur ? (
        <View style={styles.vide}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
          <Text style={styles.videTxt}>{erreur}</Text>
        </View>
      ) : (!chargement && etablissements.length === 0) ? (
        <Text style={styles.aide}>
          Un administrateur ne peut pas être créé sans périmètre : enrôlez
          d&apos;abord un établissement avec le bouton +.
        </Text>
      ) : null}

      {/* --- Modale de recherche --- */}
      <Modal
        visible={modaleOuverte}
        animationType="slide"
        transparent
        onRequestClose={() => setModaleOuverte(false)}
      >
        <Pressable style={styles.fondModale} onPress={() => setModaleOuverte(false)} />
        <View
          style={[
            styles.modale,
            { maxHeight: hauteurMaxFeuille, marginBottom: hauteurClavier },
          ]}
        >
          <View style={styles.poignee} />

          <View style={styles.enteteModale}>
            <Text style={styles.titreModale}>Établissements</Text>
            <TouchableOpacity onPress={() => setModaleOuverte(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Nom ou ville…"
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {recherche.length > 0 && (
              <TouchableOpacity onPress={() => setRecherche('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtres}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listeModale}
            ListEmptyComponent={
              <Text style={styles.aide}>
                {recherche
                  ? `Aucun établissement ne correspond à « ${recherche} ».`
                  : 'Aucun établissement actif.'}
              </Text>
            }
            renderItem={({ item }) => {
              const actif = item.id === valeur;
              return (
                <TouchableOpacity
                  onPress={() => { onChange(item.id); setModaleOuverte(false); }}
                  activeOpacity={0.8}
                  style={[styles.ligne, actif && { backgroundColor: fond, borderColor: couleur }]}
                >
                  <Ionicons
                    name={actif ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={actif ? couleur : Colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nom, actif && { color: couleur }]} numberOfLines={1}>
                      {item.nom}
                    </Text>
                    <Text style={styles.detail} numberOfLines={1}>
                      {detailEtablissement(item)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.nouveauBtn, { borderColor: couleur }]}
            onPress={ouvrirFormulaire}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={16} color={couleur} />
            <Text style={[styles.nouveauTxt, { color: couleur }]}>
              Enrôler un établissement
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  ligneChamp: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: Spacing.md },
  champ: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  champNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  champDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  placeholder: { fontSize: 14, color: Colors.textMuted },
  // Carré, à la hauteur du champ : le « + » doit se lire comme une action
  // attachée au sélecteur, pas comme un bouton du formulaire.
  btnAjout: {
    width: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderStyle: 'dashed',
  },
  rappel: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  rappelTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  vide: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.warningBg,
    marginBottom: Spacing.md,
  },
  videTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  aide: {
    color: Colors.textMuted, fontSize: 12,
    marginTop: -6, marginBottom: Spacing.md, marginLeft: 4,
  },

  // --- Modale ---
  fondModale: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  modale: {
    // `maxHeight` et `marginBottom` sont posés à l'exécution : ils dépendent de
    // la hauteur du clavier, qui varie selon l'appareil et la langue de saisie.
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  poignee: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  enteteModale: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  titreModale: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  listeModale: { gap: 8, paddingVertical: Spacing.sm },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  nom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  detail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  nouveauBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderRadius: Radius.md,
    borderWidth: 1, borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  nouveauTxt: { fontSize: 13, fontWeight: '700' },
});
