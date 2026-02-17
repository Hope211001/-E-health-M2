import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  getAuth,
  //@ts-ignore
  getReactNativePersistence, 
  Auth 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ta configuration Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialisation de l'App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialisation de l'Auth avec persistance AsyncStorage
let auth: Auth;

try {
  // On essaie de récupérer l'auth déjà initialisée
  auth = getAuth(app);
} catch (e) {
  // Si elle n'existe pas encore (premier chargement), on l'initialise
  // C'est ICI qu'on injecte AsyncStorage pour React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// 3. Initialisation de Firestore
const db = getFirestore(app);

export { auth, db };