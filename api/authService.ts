import { auth, db } from './firebase';
// Vérifie bien que TOUTES ces fonctions sont présentes ici :
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'; 

import { 
  doc, 
  writeBatch, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore'; 

import { User, Patient, Medecin } from '../types/collection';
export const authService = {
  // CONNEXION
  async login(email: string, pass: string) {
    // Cette ligne utilise la fonction importée plus haut
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    // On récupère le profil dans la collection "users" pour avoir le rôle
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.data() as User;
  },

  // INSCRIPTION PATIENT
  async registerPatient(email: string, pass: string, tel: string, medecinId:string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    const batch = writeBatch(db);

    const userBase: User = {
      uid, email, role: 'patient', telephone: tel,
      statut: 'actif',
      dateCreation: serverTimestamp() as any,
      password: '', 
    };

    const patientDetail: Patient = {
      ...userBase,
      userId: uid,
      numeroPatient: `PAT-${Date.now().toString().slice(-4)}`,
      allergies: [],
      antecedents: [],
      medecinTraitantId: medecinId,
      codeGenereDate: serverTimestamp() as any,
      codeExpirationDate: serverTimestamp() as any,
    } as Patient;

    batch.set(doc(db, "users", uid), userBase);
    batch.set(doc(db, "patients", uid), patientDetail);

    await batch.commit();
    return patientDetail;
  },

  // INSCRIPTION MEDECIN
  async registerMedecin(email: string, pass: string, tel: string, spec: string[], ordre: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    const batch = writeBatch(db);

    const userBase: User = {
      uid, email, role: 'medecin', telephone: tel,
      statut: 'actif',
      dateCreation: serverTimestamp() as any,
      password: '',
    };

    const medecinDetail: Medecin = {
      ...userBase,
      id: uid,
      userId: uid,
      specialite: spec,
      numeroOrdre: ordre,
    } as Medecin;

    batch.set(doc(db, "users", uid), userBase);
    batch.set(doc(db, "medecins", uid), medecinDetail);

    await batch.commit();
    return medecinDetail;
  },

  // DÉCONNEXION
  async logout() {
    await signOut(auth);
  }
};