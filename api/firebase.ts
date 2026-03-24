import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  //@ts-ignore
  getReactNativePersistence, 
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialisation de l'App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * 2. INITIALISATION DE L'AUTH (LA SEULE ET UNIQUE)
 * On utilise une fonction auto-exécutée pour garantir le typage et l'ordre
 */
const auth: Auth = (() => {
  // On vérifie si l'auth est déjà initialisée sur l'app
  // On accède à la propriété interne pour éviter d'appeler getAuth() trop tôt
  const existingAuth = (app as any).auth;
  if (existingAuth) return existingAuth;

  // C'est ici qu'on force la persistance
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
})();

const db = getFirestore(app);

export { auth, db };