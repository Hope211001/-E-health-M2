/**
 * SelecteurGroupeSanguin
 *
 * Huit boutons plutôt qu'un champ libre : le groupe sanguin est une donnée
 * vitale à liste fermée, et « O+ », « o positif » ou « zéro + » saisis à la
 * main deviendraient impossibles à comparer. Le backend refuse d'ailleurs
 * toute valeur hors liste.
 *
 * Comme le sexe, la valeur est facultative — un patient est souvent enregistré
 * avant le résultat du typage — et le rappui sur l'option active la retire.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type GroupeSanguin = (typeof GROUPES_SANGUINS)[number];

type Props = {
  valeur: string;
  onChange: (groupe: string) => void;
  label?: string;
  hint?: string;
  couleur?: string;
  fond?: string;
  disabled?: boolean;
};

export default function SelecteurGroupeSanguin({
  valeur,
  onChange,
  label = 'Groupe sanguin',
  hint = 'Facultatif — appuyez à nouveau pour retirer',
  couleur = Colors.danger,
  fond = Colors.dangerBg,
  disabled = false,
}: Props) {
  return (
    <View style={styles.bloc}>
      {/* Libellé omis quand l'écran en porte déjà un au-dessus du champ. */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.grille}>
        {GROUPES_SANGUINS.map((groupe) => {
          const actif = valeur === groupe;
          return (
            <TouchableOpacity
              key={groupe}
              style={[styles.option, actif && { backgroundColor: fond, borderColor: couleur }]}
              onPress={() => onChange(actif ? '' : groupe)}
              disabled={disabled}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: actif }}
            >
              <Text style={[styles.optionTxt, actif && { color: couleur }]}>{groupe}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { marginBottom: Spacing.md },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    // Quatre par ligne sur un écran étroit : au-delà, les libellés « AB- »
    // seraient rognés.
    minWidth: 62,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  optionTxt: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 6, marginLeft: 4 },
});
