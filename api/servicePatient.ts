import { db } from './firebase'; // Ton fichier de config
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * SERVICE : GESTION DES PATIENTS
 */

// 1. Fonction pour récupérer tous les patients
export const getPatients = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    const querySnapshot = await getDocs(q);
    
    // On transforme le résultat en un tableau d'objets propre
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erreur service getPatients:", error);
    throw error;
  }
};

// 2. Fonction pour créer une ordonnance
export const createPrescription = async (patientId: string, doctorId: string, medicaments: any[]) => {
  try {
    const docRef = await addDoc(collection(db, "prescriptions"), {
      patientId,
      doctorId,
      medicaments, // Tableau d'objets [{nom: "...", dosage: "..."}]
      dateCreation: serverTimestamp(),
      status: "active"
    });
    return docRef.id;
  } catch (error) {
    console.error("Erreur service createPrescription:", error);
    throw error;
  }
};


/**
 * Utilitaire : Génère un code aléatoire (ex: P-4821)
 */
const generateAccessCode = () => {
  const code = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
  return `P-${code}`;
};

// 3. Fonction pour créer un patient avec un code d'accès auto-généré
export const createPatient = async (nom: string, email: string , doctorId:string) => {
  try {
    const accessCode = generateAccessCode(); // Génération automatique

    // On ajoute le patient dans la collection "users"
    // Note : Dans un vrai projet Auth, on utiliserait une Cloud Function pour créer le compte Auth.
    // Ici, on stocke les infos dans Firestore pour permettre l'accès.
    const docRef = await addDoc(collection(db, "users"), {
      nom: nom,
      email: email,
      role: "patient",
      doctorId: doctorId, // <--- On enregistre quel médecin a créé ce patient
      accessCode: accessCode, // Ce code servira de mot de passe initial
      dateCreation: serverTimestamp(),
      firstLogin: true // Pour savoir s'il doit changer son mot de passe plus tard
    });

    return { id: docRef.id, accessCode }; // On retourne le code pour l'afficher au médecin
  } catch (error) {
    console.error("Erreur service createPatient:", error);
    throw error;
  }
};