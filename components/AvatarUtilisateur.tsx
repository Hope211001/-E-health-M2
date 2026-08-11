/**
 * AvatarUtilisateur
 *
 * Pastille ronde d'un compte : sa photo si elle existe, sinon ses initiales,
 * sinon l'icône du rôle. Cette cascade évite le trou visuel des comptes créés
 * avant l'ajout des photos, qui restent majoritaires en base.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/theme';
import { initiales } from '@/utils/photoProfil';

type Props = {
  photoURL?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  /** Diamètre en points. */
  taille?: number;
  /** Couleur du texte et de l'icône de repli. */
  couleur?: string;
  /** Fond de la pastille quand il n'y a pas de photo. */
  fond?: string;
  /** Icône affichée quand ni photo ni état civil ne sont disponibles. */
  icone?: keyof typeof Ionicons.glyphMap;
};

export default function AvatarUtilisateur({
  photoURL,
  prenom,
  nom,
  email,
  taille = 44,
  couleur = Colors.primary,
  fond = Colors.primaryBg,
  icone = 'person',
}: Props) {
  // Une URL peut pointer vers une image supprimée côté Cloudinary ou Google :
  // on retombe alors sur les initiales plutôt que de laisser un carré vide.
  const [echec, setEchec] = useState(false);

  const cercle = {
    width: taille,
    height: taille,
    borderRadius: taille / 2,
  };

  if (photoURL && !echec) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[cercle, styles.photo]}
        contentFit="cover"
        transition={150}
        onError={() => setEchec(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const lettres = initiales(prenom, nom, email);
  const sansIdentite = lettres === '?';

  return (
    <View style={[cercle, styles.repli, { backgroundColor: fond }]}>
      {sansIdentite ? (
        <Ionicons name={icone} size={taille * 0.45} color={couleur} />
      ) : (
        <Text style={[styles.initiales, { color: couleur, fontSize: taille * 0.38 }]}>
          {lettres}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
  },
  repli: { alignItems: 'center', justifyContent: 'center' },
  initiales: { fontWeight: '800', letterSpacing: 0.5 },
});