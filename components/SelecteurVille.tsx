/**
 * SelecteurVille.tsx
 *
 * Choix d'une ville dans le référentiel, avec recherche.
 *
 * Remplace l'ancien champ texte « ville ». Ce n'est pas une question de
 * confort : un champ libre laissait coexister « Antananarivo », « antananarivo »
 * et « ANTANANARIVO » comme trois communes distinctes, qu'aucun filtre ni
 * aucune statistique ne pouvait plus regrouper.
 *
 * Même présentation que SelecteurEtablissement : un champ compact qui ouvre une
 * modale, plutôt qu'une liste dépliée. Le pays compte des centaines de
 * communes, une liste dépliée repousserait hors écran tous les champs suivants.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput,
  Modal, FlatList, Pressable, Keyboard, Platform, useWindowDimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { geoService } from '@/api/geoService';
import type { Ville } from '@/types/collection';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  valeur: string;
  onChange: (villeId: string) => void;
  label?: string;
  /** Autorise le champ vide (ville d'un compte, facultative). */
  facultatif?: boolean;
  /**
   * Affiche le bouton d'ajout d'une ville. Réservé au superadmin : lui seul a
   * le droit d'écrire dans le référentiel côté serveur, l'afficher aux autres
   * ne produirait qu'un refus au moment de valider.
   */
  peutAjouter?: boolean;
  couleur?: string;
  fond?: string;
};

export default function SelecteurVille({
  valeur, onChange, label = 'Ville', facultatif, peutAjouter,
  couleur = Colors.admin, fond = Colors.adminBg,
}: Props) {
  const { height: hauteurEcran } = useWindowDimensions();
  const [villes, setVilles] = useState<Ville[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [hauteurClavier, setHauteurClavier] = useState(0);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  // Refs plutôt que dépendances : `onChange` est une lambda du parent, donc
  // recréée à chaque rendu — la mettre en dépendance relancerait une requête
  // réseau à chaque frappe dans le formulaire qui contient ce sélecteur.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const charger = useCallback(async () => {
    try {
      setVilles(await geoService.listerVilles({ statut: 'actif' }));
      setErreur('');
    } catch (e: any) {
      setErreur(e.response?.data?.error || 'Référentiel indisponible');
    } finally {
      setChargement(false);
    }
  }, []);

  // Rechargé à chaque retour sur l'écran : une ville peut avoir été créée
  // depuis un autre écran entre-temps.
  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  // Une `Modal` s'affiche dans sa propre fenêtre native et ignore le
  // redimensionnement lié au clavier — sans ça, le champ de recherche, qui a le
  // focus d'office, se retrouve masqué dès l'ouverture.
  useEffect(() => {
    const evtOuverture = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const evtFermeture = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const ouverture = Keyboard.addListener(evtOuverture, (e) =>
      setHauteurClavier(e.endCoordinates.height));
    const fermeture = Keyboard.addListener(evtFermeture, () => setHauteurClavier(0));
    return () => { ouverture.remove(); fermeture.remove(); };
  }, []);

  const hauteurMaxFeuille = Math.max(280, hauteurEcran - hauteurClavier - 72);

  const choisie = useMemo(
    () => villes.find((v) => v.id === valeur),
    [villes, valeur],
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return villes;
    return villes.filter((v) => v.nom.toLowerCase().includes(q));
  }, [villes, recherche]);

  /** Crée la ville dont le nom est saisi dans la recherche. */
  const ajouterVille = () => {
    const nom = recherche.trim();
    if (!nom) {
      Alert.alert('', 'Saisissez d’abord le nom de la ville dans la recherche.');
      return;
    }

    Alert.alert(
      'Ajouter cette ville ?',
      `« ${nom} » sera ajoutée au référentiel national et proposée à tous les établissements.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: async () => {
            setAjoutEnCours(true);
            try {
              const creee = await geoService.creerVille(nom);
              setVilles((prev) => [...prev, creee]);
              onChange(creee.id);
              setRecherche('');
              setModaleOuverte(false);
            } catch (e: any) {
              Alert.alert('', e.response?.data?.error || 'Création impossible');
            } finally {
              setAjoutEnCours(false);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Text style={styles.label}>
        {label}{facultatif ? <Text style={styles.facultatif}>  facultative</Text> : null}
      </Text>

      <TouchableOpacity
        style={[styles.champ, choisie && { borderColor: couleur }]}
        onPress={() => { setRecherche(''); setModaleOuverte(true); }}
        activeOpacity={0.8}
        disabled={chargement}
      >
        <Ionicons
          name="location-outline"
          size={18}
          color={choisie ? couleur : Colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          {chargement ? (
            <Text style={styles.placeholder}>Chargement…</Text>
          ) : choisie ? (
            <Text style={styles.champNom} numberOfLines={1}>{choisie.nom}</Text>
          ) : (
            <Text style={styles.placeholder}>
              {villes.length === 0 ? 'Aucune ville au référentiel' : 'Choisir une ville…'}
            </Text>
          )}
        </View>
        {/* Effacer, quand la ville est facultative : sans ce bouton, un choix
            fait par erreur serait irréversible sans quitter le formulaire. */}
        {facultatif && choisie && !chargement ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : chargement ? (
          <ActivityIndicator size="small" color={couleur} />
        ) : (
          <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      {erreur ? <Text style={styles.aide}>{erreur}</Text> : null}

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
            <Text style={styles.titreModale}>Villes et communes</Text>
            <TouchableOpacity onPress={() => setModaleOuverte(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Nom de la ville ou de la commune…"
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="words"
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
            data={filtrees}
            keyExtractor={(v) => v.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listeModale}
            ListEmptyComponent={
              <Text style={styles.aide}>
                {recherche
                  ? `Aucune ville ne correspond à « ${recherche} ».`
                  : 'Aucune ville au référentiel.'}
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
                  <Text style={[styles.nom, actif && { color: couleur }]} numberOfLines={1}>
                    {item.nom}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {peutAjouter && (
            <TouchableOpacity
              style={[styles.nouveauBtn, { borderColor: couleur }]}
              onPress={ajouterVille}
              disabled={ajoutEnCours}
              activeOpacity={0.85}
            >
              {ajoutEnCours
                ? <ActivityIndicator size="small" color={couleur} />
                : <Ionicons name="add-circle-outline" size={16} color={couleur} />}
              <Text style={[styles.nouveauTxt, { color: couleur }]}>
                {recherche.trim() ? `Ajouter « ${recherche.trim()} »` : 'Ajouter une ville'}
              </Text>
            </TouchableOpacity>
          )}
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
  facultatif: { color: Colors.textMuted, fontWeight: '600', fontSize: 12 },
  champ: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  champNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  placeholder: { fontSize: 14, color: Colors.textMuted },
  aide: {
    color: Colors.textMuted, fontSize: 12,
    marginTop: -6, marginBottom: Spacing.md, marginLeft: 4,
  },

  fondModale: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  modale: {
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
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  listeModale: { gap: 8, paddingVertical: Spacing.xs },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  nom: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  nouveauBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderRadius: Radius.md,
    borderWidth: 1, borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  nouveauTxt: { fontSize: 13, fontWeight: '700' },
});
