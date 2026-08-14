import { ClientService } from './clientService';
import { AuthProvider, Createur, Prescription, Sexe } from '../types/collection';

/** Répartition des prises de médicaments d'un patient. */
export interface Observance {
  total: number;
  pris: number;
  manque: number;
  en_attente: number;
  autres: number;
}

export interface DossierPatient {
  uid: string;
  identite: string;
  email: string;
  telephone: string;
  photoURL: string;
  statut: 'actif' | 'inactif';
  dateCreation: any;
  /** Compte ayant enregistré ce patient (son médecin, ou l'administration). */
  createur: Createur | null;
  authProvider: AuthProvider | null;
  sexe: Sexe | null;
  /** Date civile 'AAAA-MM-JJ', ou null si non renseignée. */
  dateNaissance: string | null;
  adresse: string;
  numeroPatient: string;
  groupeSanguin: string;
  allergies: string[];
  antecedents: string[];
  horairesRappel: { matin?: string; midi?: string; soir?: string } | null;
  medecinTraitant: { uid: string; nom: string; email: string; telephone: string; photoURL: string } | null;
  observance: Observance;
  nbPrescriptions: number;
  prescriptions: Prescription[];
}

/** Patient tel que listé dans le dossier de son médecin traitant. */
export interface PatientDuMedecin {
  uid: string;
  identite: string;
  email: string;
  telephone: string;
  photoURL: string;
  numeroPatient: string;
  statut: 'actif' | 'inactif';
  dateCreation: any;
  nbPrescriptions: number;
}

export interface DossierMedecin {
  uid: string;
  identite: string;
  email: string;
  telephone: string;
  photoURL: string;
  statut: 'actif' | 'inactif';
  dateCreation: any;
  sexe: Sexe | null;
  /** Date civile 'AAAA-MM-JJ', ou null si non renseignée. */
  dateNaissance: string | null;
  adresse: string;
  /** Admin ou superadmin ayant enregistré ce médecin. */
  createur: Createur | null;
  authProvider: AuthProvider | null;
  specialite: string[];
  numeroOrdre: string;
  nbPatients: number;
  nbPrescriptions: number;
  patients: PatientDuMedecin[];
  prescriptions: Prescription[];
}

/**
 * Consultation des dossiers par l'administration. En lecture seule : ces
 * endpoints n'exposent aucune écriture, un admin ne modifie pas un dossier
 * médical.
 */
class DossierService extends ClientService {
  async getPatient(uid: string): Promise<DossierPatient> {
    const response = await this.api.get<DossierPatient>(`/dossiers/patient/${uid}`);
    return response.data;
  }

  async getMedecin(uid: string): Promise<DossierMedecin> {
    const response = await this.api.get<DossierMedecin>(`/dossiers/medecin/${uid}`);
    return response.data;
  }
}

export const dossierService = new DossierService();
