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