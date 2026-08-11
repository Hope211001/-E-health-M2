/**
 * PhotoProfilPicker
 *
 * Champ de formulaire pour la photo de profil, partagé par tous les écrans de
 * création de compte et d'édition de profil (patient, médecin, admin,
 * superadmin).
 *
 * La valeur remontée est celle attendue par l'API : une data URI base64 pour
 * une nouvelle photo, l'URL existante si elle n'a pas changé, ou une chaîne
 * vide pour une suppression.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AvatarUtilisateur from './AvatarUtilisateur';
import { choisirPhotoProfil, ErreurPhoto, type SourcePhoto } from '@/utils/photoProfil';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  /** Data URI, URL http(s) ou chaîne vide. */
  valeur: string;
  onChange: (photo: string) => void;
  label?: string;
  hint?: string;
  /** Couleur d'accent, alignée sur le rôle de l'écran. */
  couleur?: string;
  fond?: string;
  /** Repli quand aucune photo n'est choisie ni aucun nom saisi. */
  icone?: keyof typeof Ionicons.glyphMap;
  /** État civil déjà saisi, pour afficher les initiales en aperçu. */
  prenom?: string;
  nom?: string;
  disabled?: boolean;
};

export default function PhotoProfilPicker({
  valeur,
  onChange,
  label = 'Photo de profil',
  hint = 'Facultatif — JPEG ou PNG, recadrée en carré',
  couleur = Colors.primary,
  fond = Colors.surfaceAlt,
  icone = 'person',
  prenom,
  nom,
  disabled = false,
}: Props) {
  const [chargement, setChargement] = useState(false);

  const choisir = async (source: SourcePhoto) => {
    setChargement(true);
    try {
      const photo = await choisirPhotoProfil(source);
      // `null` = annulation de l'utilisateur : on garde la photo actuelle.
      if (photo) onChange(photo);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Photo',
        text2: error instanceof ErreurPhoto
          ? error.message
          : "La photo n'a pas pu être chargée.",
      });
    } finally {
      setChargement(false);
    }
  };

  const actif = !disabled && !chargement;

  return (
    <View style={styles.bloc}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.ligne}>
        <View>
          <AvatarUtilisateur
            photoURL={valeur}
            prenom={prenom}
            nom={nom}
            taille={72}
            couleur={couleur}
            fond={fond}
            icone={icone}
          />
          {chargement && (
            <View style={styles.voile}>
              <ActivityIndicator color={couleur} />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.bouton, { borderColor: couleur }]}
            onPress={() => choisir('galerie')}
            disabled={!actif}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={16} color={couleur} />
            <Text style={[styles.boutonTxt, { color: couleur }]}>Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, { borderColor: couleur }]}
            onPress={() => choisir('camera')}
            disabled={!actif}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={16} color={couleur} />
            <Text style={[styles.boutonTxt, { color: couleur }]}>Photo</Text>
          </TouchableOpacity>

          {/* Proposé seulement quand il y a quelque chose à retirer, pour ne
              pas laisser un bouton sans effet dans un formulaire vierge. */}
          {valeur ? (
            <TouchableOpacity
              style={[styles.bouton, styles.boutonRetirer]}
              onPress={() => onChange('')}
              disabled={!actif}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={[styles.boutonTxt, { color: Colors.danger }]}>Retirer</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  voile: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.full,
  },
  actions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bouton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  boutonRetirer: { borderColor: Colors.danger },
  boutonTxt: { fontSize: 13, fontWeight: '700' },
  hint: {
    color: Colors.textMuted, fontSize: 12,
    marginTop: 8, marginLeft: 4,
  },
});