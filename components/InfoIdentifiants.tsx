import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Bandeau affiché à la place de l'ancien champ « mot de passe » dans les
 * formulaires de création de compte.
 *
 * Le mot de passe est désormais généré par le serveur et envoyé par email au
 * titulaire : celui qui crée le compte ne le voit jamais. Sans cette
 * explication, le formulaire donnerait l'impression d'un champ oublié, et
 * l'utilisateur qui crée le compte chercherait un mot de passe à communiquer.
 */
export function InfoIdentifiants({
  couleur = Colors.info,
  fond = Colors.infoBg,
}: {
  couleur?: string;
  fond?: string;
}) {
  return (
    <View style={[styles.bloc, { backgroundColor: fond, borderLeftColor: couleur }]}>
      <Ionicons name="mail-outline" size={18} color={couleur} style={styles.icone} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.titre, { color: couleur }]}>Identifiants envoyés par email</Text>
        <Text style={styles.texte}>
          Un mot de passe est généré automatiquement et envoyé à l&apos;adresse
          saisie. Le titulaire du compte est le seul à le connaître. Il pourra
          aussi se connecter avec Google en utilisant cette même adresse.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
  },
  icone: { marginTop: 1 },
  titre: { fontWeight: '700', fontSize: 13, marginBottom: 3 },
  texte: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
});