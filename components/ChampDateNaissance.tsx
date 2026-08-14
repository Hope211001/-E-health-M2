/**
 * ChampDateNaissance
 *
 * Champ « date de naissance » partagé par les écrans de création de compte et
 * le bloc profil. Saisie libre au format JJ/MM/AAAA plutôt qu'un sélecteur de
 * calendrier : atteindre une année de naissance dans un calendrier natif
 * demande des dizaines de balayages, alors que la date est ici recopiée d'une
 * pièce d'identité — huit chiffres au pavé numérique.
 *
 * Les séparateurs sont posés par le champ au fil de la frappe (voir
 * `masquerSaisieDate`), et l'âge calculé s'affiche sous le champ : c'est la
 * seule relecture qui rende une faute de frappe visible, une date valide mais
 * fausse ne déclenchant aucune erreur.
 *
 * La valeur remontée est celle attendue par l'API ('AAAA-MM-JJ'), ou '' quand
 * la date n'est pas renseignée — elle est facultative, comme le sexe.
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { libelleAge, masquerSaisieDate, versISO } from '@/utils/dateNaissance';

type Props = {
  /** Saisie affichée, au format 'JJ/MM/AAAA' (voir `depuisISO` pour l'initialiser). */
  valeur: string;
  /** Reçoit la saisie masquée ; à stocker telle quelle dans l'état de l'écran. */
  onChange: (saisie: string) => void;
  label?: string;
  hint?: string;
  couleur?: string;
  disabled?: boolean;
};

export default function ChampDateNaissance({
  valeur,
  onChange,
  label = 'Date de naissance',
  hint = 'Facultative — JJ/MM/AAAA',
  couleur = Colors.primary,
  disabled = false,
}: Props) {
  const iso = versISO(valeur);
  const age = libelleAge(iso);
  // Une saisie partielle n'est pas une erreur : on ne signale qu'une date
  // complète et pourtant impossible (31/02, année future…), sinon le champ
  // afficherait « invalide » dès le premier chiffre tapé.
  const invalide = iso === null && valeur.replace(/\D/g, '').length === 8;

  return (
    <View style={styles.bloc}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, invalide && styles.inputInvalide]}
        value={valeur}
        onChangeText={(v) => onChange(masquerSaisieDate(v))}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        maxLength={10}
        editable={!disabled}
      />

      {invalide ? (
        <View style={styles.ligneHint}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
          <Text style={[styles.hint, { color: Colors.danger }]}>
            Cette date n&apos;existe pas.
          </Text>
        </View>
      ) : age ? (
        <View style={styles.ligneHint}>
          <Ionicons name="calendar-outline" size={13} color={couleur} />
          <Text style={[styles.hint, { color: couleur }]}>{age}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { marginBottom: Spacing.md },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
    letterSpacing: 1,
  },
  inputInvalide: { borderColor: Colors.danger },
  ligneHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 4 },
  hint: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
});
