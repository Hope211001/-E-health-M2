/**
 * ChampListe
 *
 * Saisie d'une liste de textes courts (allergies, antécédents) sous forme de
 * pastilles ajoutées une par une.
 *
 * Pourquoi pas un simple champ multiligne où l'on sépare par des virgules :
 * une allergie peut contenir une virgule (« pénicilline, dérivés »), et une
 * liste stockée en texte libre se relit mal — c'est le format tableau qui
 * permet d'en retirer une entrée sans risquer d'écorner les voisines.
 *
 * L'ajout se fait au bouton ou à la touche « entrée » du clavier, et les
 * doublons sont écartés à la saisie plutôt que signalés comme une erreur : le
 * résultat voulu est déjà atteint, une alerte ne ferait qu'ajouter un geste.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
  label: string;
  placeholder?: string;
  /** Message affiché quand la liste est vide. */
  vide?: string;
  couleur?: string;
  fond?: string;
  disabled?: boolean;
  /** Longueur maximale d'une entrée — alignée sur le backend. */
  maxLongueur?: number;
};

export default function ChampListe({
  valeurs,
  onChange,
  label,
  placeholder = 'Ajouter…',
  vide = 'Aucun élément',
  couleur = Colors.primary,
  fond = Colors.primaryBg,
  disabled = false,
  maxLongueur = 120,
}: Props) {
  const [saisie, setSaisie] = useState('');

  const ajouter = () => {
    const propre = saisie.trim().replace(/\s+/g, ' ');
    if (!propre) return;

    // Comparaison insensible à la casse : « Pénicilline » et « pénicilline »
    // sont la même allergie, et la voir deux fois ferait douter du dossier.
    const existe = valeurs.some((v) => v.toLowerCase() === propre.toLowerCase());
    if (!existe) onChange([...valeurs, propre.slice(0, maxLongueur)]);
    setSaisie('');
  };

  const retirer = (index: number) => {
    onChange(valeurs.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.bloc}>
      {/* Libellé omis quand l'écran en porte déjà un au-dessus du champ. */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.ligneSaisie}>
        <TextInput
          style={styles.input}
          value={saisie}
          onChangeText={setSaisie}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={!disabled}
          maxLength={maxLongueur}
          // Ajoute à la touche « entrée » sans refermer le clavier : on saisit
          // rarement une seule allergie.
          onSubmitEditing={ajouter}
          blurOnSubmit={false}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.ajouter, { backgroundColor: couleur }]}
          onPress={ajouter}
          disabled={disabled || !saisie.trim()}
          activeOpacity={0.85}
          accessibilityLabel={`Ajouter à ${label.toLowerCase()}`}
        >
          <Ionicons name="add" size={20} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {valeurs.length === 0 ? (
        <Text style={styles.vide}>{vide}</Text>
      ) : (
        <View style={styles.pastilles}>
          {valeurs.map((v, i) => (
            <View key={`${v}-${i}`} style={[styles.pastille, { backgroundColor: fond }]}>
              <Text style={[styles.pastilleTxt, { color: couleur }]}>{v}</Text>
              <TouchableOpacity
                onPress={() => retirer(i)}
                disabled={disabled}
                hitSlop={8}
                accessibilityLabel={`Retirer ${v}`}
              >
                <Ionicons name="close-circle" size={16} color={couleur} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  ligneSaisie: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    padding: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 14,
  },
  ajouter: {
    width: 46, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pastille: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pastilleTxt: { fontSize: 12, fontWeight: '700' },
  vide: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginLeft: 4 },
});
