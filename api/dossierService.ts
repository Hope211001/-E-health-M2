import { ClientService } from './clientService';
import { Prescription } from '../types/collection';

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
  statut: 'actif' | 'inactif';
  dateCreation: any;
  sexe: 'M' | 'F' | null;
  dateNaissance: any;
  adresse: string;
  numeroPatient: string;
  groupeSanguin: string;
  allergies: string[];
  antecedents: string[];
  horairesRappel: { matin?: string; midi?: string; soir?: string } | null;
  medecinTraitant: { uid: string; nom: string; email: string; telephone: string } | null;
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
  statut: 'actif' | 'inactif';
  dateCreation: any;
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
