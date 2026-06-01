import Constants from 'expo-constants';

/**
 * Vrai uniquement dans Expo Go (l'app jaune téléchargée du store), où les
 * modules NATIFS tiers (react-native-keyboard-controller, expo-notifications…)
 * ne sont pas disponibles et cassent l'app.
 *
 * On combine deux signaux pour être robuste selon les versions d'Expo :
 *  - appOwnership === 'expo'        → Expo Go (signal historique fiable)
 *  - executionEnvironment === 'storeClient' → Expo Go (signal récent)
 */
export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';