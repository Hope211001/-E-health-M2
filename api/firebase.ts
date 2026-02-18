import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  //@ts-ignore
  getReactNativePersistence, 
  getAuth 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration via variables d'environnement (Très bien !)
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

// 2. Initialisation de l'Auth avec Persistance
// On vérifie si l'auth est déjà initialisée pour éviter l'erreur "Auth has already been initialized"
const auth = (() => {
  const existingAuth = getAuth(app);
  if (existingAuth) return existingAuth;

  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
})();

// 3. Initialisation de Firestore
const db = getFirestore(app);

export { auth, db };