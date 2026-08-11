/**
 * photoProfil.ts
 *
 * Choix et préparation d'une photo de profil avant envoi au backend.
 *
 * L'image est systématiquement redimensionnée et recompressée côté téléphone :
 * une photo brute d'appareil moderne pèse plusieurs mégaoctets, ce qui est
 * inutilisable pour un avatar affiché en 44 px et coûterait un temps d'envoi
 * absurde sur une connexion mobile. Le backend applique de toute façon sa
 * propre limite (voir back-e-health/src/services/cloudinaryService.js).
 */
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Côté maximal de l'image envoyée, en pixels. */
const TAILLE_MAX = 512;

/** Qualité JPEG : au-delà, le gain visuel ne compense plus le poids. */
const QUALITE = 0.7;

/** Source de l'image : bibliothèque du téléphone ou appareil photo. */
export type SourcePhoto = 'galerie' | 'camera';

/**
 * Erreur métier destinée à être affichée telle quelle à l'utilisateur
 * (permission refusée, par exemple), par opposition aux erreurs techniques.
 */
export class ErreurPhoto extends Error {}

/**
 * Compresse une image locale et la renvoie en data URI base64, format attendu
 * par le champ `photo` des routes d'inscription et de mise à jour de profil.
 */
async function preparer(uri: string): Promise<string> {
  // API contextuelle (SDK 54) : `manipulateAsync` existe encore mais est
  // déprécié et disparaîtra d'une prochaine version d'Expo.
  const contexte = ImageManipulator.manipulate(uri);
  contexte.resize({ width: TAILLE_MAX });

  const image = await contexte.renderAsync();
  const resultat = await image.saveAsync({
    compress: QUALITE,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!resultat.base64) {
    throw new ErreurPhoto("La photo n'a pas pu être préparée. Réessayez.");
  }
  return `data:image/jpeg;base64,${resultat.base64}`;
}

/**
 * Demande la permission, ouvre le sélecteur puis renvoie la photo en data URI.
 * Renvoie `null` si l'utilisateur annule — ce n'est pas une erreur.
 */
export async function choisirPhotoProfil(source: SourcePhoto = 'galerie'): Promise<string | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new ErreurPhoto(
      source === 'camera'
        ? "Accès à l'appareil photo refusé. Autorisez-le dans les réglages du téléphone."
        : "Accès aux photos refusé. Autorisez-le dans les réglages du téléphone.",
    );
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    // Recadrage carré imposé : tous les avatars de l'app sont ronds, laisser
    // une image 16:9 la ferait afficher tronquée sans que l'utilisateur
    // comprenne pourquoi.
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, // la compression est faite ensuite, à taille déjà réduite
  };

  const resultat = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (resultat.canceled || !resultat.assets?.length) return null;
  return preparer(resultat.assets[0].uri);
}

/** Initiales affichées quand aucune photo n'est disponible. */
export function initiales(prenom?: string, nom?: string, email?: string): string {
  const lettres = `${(prenom || '').trim()[0] || ''}${(nom || '').trim()[0] || ''}`;
  if (lettres) return lettres.toUpperCase();
  return (email || '?').trim()[0]?.toUpperCase() || '?';
}