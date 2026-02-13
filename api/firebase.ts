import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// On importe tout depuis 'firebase/auth'
import { 
  initializeAuth, 
  // @ts-ignore
  getReactNativePersistence, 
  getAuth,
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

// 1. Initialiser l'App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialiser l'Auth avec la persistance AsyncStorage
let auth: Auth;

if (getApps().length > 0) {
  try {
    // Si l'auth est déjà là, on la récupère
    auth = getAuth(app);
  } catch (e) {
    // Sinon on l'initialise proprement
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const db = getFirestore(app);
export { auth };