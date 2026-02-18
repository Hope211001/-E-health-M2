import { db } from './firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Patient } from '../types/collection';

export const patientService = {
  async searchPatientByNumero(searchText: string): Promise<Patient[]> {
    if (!searchText) return [];
    
    const patientsRef = collection(db, "patients");
    // Recherche "Commence par" dans Firestore
    const q = query(
      patientsRef,
      where("numeroPatient", ">=", searchText.toUpperCase()),
      where("numeroPatient", "<=", searchText.toUpperCase() + "\uf8ff"),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  },

  async getPatientsByMedecin(medecinId: string): Promise<Patient[]> {
    const patientsRef = collection(db, "patients");
    // On filtre les patients dont le medecinTraitantId correspond au médecin connecté
    const q = query(patientsRef, where("medecinTraitantId", "==", medecinId));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Patient));
  }
};