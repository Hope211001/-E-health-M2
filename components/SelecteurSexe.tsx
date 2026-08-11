/**
 * SelecteurSexe
 *
 * Champ « sexe » partagé par les écrans de création de compte et le bloc
 * profil. Deux boutons plutôt qu'une liste déroulante : à deux options, un
 * sélecteur natif demanderait deux gestes et masquerait la valeur choisie.
 *
 * La valeur est facultative et le rappui sur l'option active la retire — sans
 * quoi un choix fait par erreur serait définitif, l'API acceptant pourtant le
 * vide.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Sexe } from '@/types/collection';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  valeur: Sexe | '';
  onChange: (sexe: Sexe | '') => void;
  label?: string;
  hint?: string;
  /** Couleur d'accent, alignée sur le rôle de l'écran. */
  couleur?: string;
  fond?: string;
  disabled?: boolean;
};

const OPTIONS: { cle: Sexe; label: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { cle: 'M', label: 'Masculin', icone: 'male' },
  { cle: 'F', label: 'Féminin', icone: 'female' },
];

export default function SelecteurSexe({
  valeur,
  onChange,
  label = 'Sexe',
  hint = 'Facultatif — appuyez à nouveau pour retirer',
  couleur = Colors.primary,
  fond = Colors.primaryBg,
  disabled = false,
}: Props) {
  return (
    <View style={styles.bloc}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.ligne}>
        {OPTIONS.map((option) => {
          const actif = valeur === option.cle;
          return (
            <TouchableOpacity
              key={option.cle}
              style={[
                styles.option,
                actif && { backgroundColor: fond, borderColor: couleur },
              ]}
              onPress={() => onChange(actif ? '' : option.cle)}
              disabled={disabled}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: actif }}
            >
              <Ionicons
                name={option.icone}
                size={18}
                color={actif ? couleur : Colors.textMuted}
              />
              <Text style={[styles.optionTxt, actif && { color: couleur }]}>
                {option.label}
              </Text>
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
  ligne: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  optionTxt: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 6, marginLeft: 4 },
});