import { Timestamp } from 'firebase/firestore';
export type UserRole = 'medecin' | 'patient' | 'admin' | 'superadmin';
export type AuthProvider = 'password' | 'google';
export interface User {
    uid: string;
    email: string;
    password?: string;
    nom?: string;
    prenom?: string;
    role: UserRole;
    telephone?: string;
    photoURL?: string;
    authProvider?: AuthProvider;
    dateCreation: Timestamp;
    statut: 'actif' | 'inactif';
    dateNaissance?: Timestamp;
    sexe?: 'M' | 'F';
    adresse?: string;
}
export interface Medecin extends User {
    id: string
    specialite?: string[];
    numeroOrdre?: string;
    userId:string;
}
export interface Patient extends User {
    id?: string;
    numeroPatient: string;
    groupeSanguin?: string;
    allergies: string[];
    antecedents: string[];
    medecinTraitantId: string;
    codeGenereDate: Timestamp;
    codeExpirationDate: Timestamp;
    dateCreation: Timestamp;
    statut: 'actif' | 'inactif';
    userId:string;

}
export interface Medicament {
    id?: string;
    nomMedicament: string;
    dosage: string;
    frequence: string;
    quantite: number;
    unite: string;
    voieAdministration: string;
    instructions: string;
    duree: number;
    heuresPrises: string[];
}

export interface Prescription {
    id?: string;
    patientId: string;
    medecinId: string;
    dateCreation: Timestamp;
    dateDebut: Timestamp;
    dateFin: Timestamp;
    duree: number;
    statut: 'active' | 'en_cours' | 'terminee' | 'annulee' | 'en_attente';
    diagnostic: string;
    observations: string;
    medicaments: Medicament[];
    creePar: string;
}
export interface PharmacieGarde {
    id: string;
    idpost: string;
    isVisible: boolean;
    urlPost: string;
    textPost: string;
    attachement: string[];
    dateCreation?: Timestamp | null;
    dateModification?: Timestamp | null;
}
export interface Alerte {
    id?: string;
    patientId: string;
    prescriptionId: string;
    medicamentId: string;
    nomMedicament: string;
    dosage: string;
    heurePrevu: string;
    datePrise: Timestamp;
    statut: 'en_attente' | 'notifie' | 'pris' | 'manque' | 'retard';
    notificationEnvoyee: boolean;
    dateNotification?: Timestamp;
    prisLe?: Timestamp;
    notes?: string;
}