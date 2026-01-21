import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuimBTBQirxNdRD0WKpoWuKC1wkFA-J9s",
  authDomain: "e-health-cb942.firebaseapp.com",
  projectId: "e-health-cb942",
  storageBucket: "e-health-cb942.firebasestorage.app",
  messagingSenderId: "351782219754",
  appId: "1:351782219754:web:c8936b807d5b59290d8c93",
  measurementId: "G-5LCGL34RWY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);