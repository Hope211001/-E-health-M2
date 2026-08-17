import { ClientService } from './clientService';
import { Patient, Prescription } from '../types/collection';

class PatientService extends ClientService {

    async getMyPatients(): Promise<Patient[]> {
        const response = await this.api.get<Patient[]>('/patients');
        return response.data;
    }
    // api/patientService.ts
    async getPatientById(id: string): Promise<Patient> {
        // Si ton backend est configuré sur /api/patients
        const response = await this.api.get<Patient>(`/patients/${id}`);
        return response.data;
    }

    async searchPatients(query: string): Promise<Patient[]> {
        const response = await this.api.get<Patient[]>(`/patients/search?q=${query}`);
        return response.data;
    }

    /**
     * Met à jour le dossier médical d'un patient : groupe sanguin, allergies,
     * antécédents.
     *
     * Réservé au médecin traitant — l'API refuse en 403 tout autre appelant,
     * y compris un autre médecin ou un administrateur.
     *
     * Un champ omis n'est pas touché : envoyer seulement `allergies` laisse le
     * groupe sanguin et les antécédents en place.
     */
    async updateDossierMedical(
        id: string,
        donnees: { groupeSanguin?: string; allergies?: string[]; antecedents?: string[] },
    ): Promise<Patient> {
        const response = await this.api.patch<Patient>(`/patients/${id}/dossier-medical`, donnees);
        return response.data;
    }

    /**
     * Transfère un patient vers un autre établissement, avec un nouveau médecin
     * traitant sur place. Administration uniquement.
     *
     * Les deux valeurs bougent ensemble et volontairement : un patient rattaché
     * à un hôpital sans praticien pour le suivre n'aurait personne pour lire ses
     * alertes de prise ni renouveler son traitement. L'opération laisse une
     * trace (`transfereLe`, `transferePar`, `etablissementPrecedent`) — sans
     * quoi on ne pourrait pas répondre à « ce patient a-t-il toujours été suivi
     * ici ? ».
     *
     * Les ordonnances passées ne suivent pas : elles restent attachées à
     * l'établissement qui les a émises.
     */
    async transferer(
        id: string,
        donnees: { etablissementId: string; medecinTraitantId: string; motif?: string },
    ): Promise<Patient> {
        const response = await this.api.patch<Patient>(`/patients/${id}/transfert`, donnees);
        return response.data;
    }

}

export const patientService = new PatientService();