import { ClientService } from './clientService';
import { Prescription } from '../types/collection';

class PrescriptionService extends ClientService {
    async createPrescription(data: any): Promise<Prescription> {
        // Correction du chemin pour correspondre au backend (/prescription au lieu de /prescriptions)
        const response = await this.api.post<Prescription>('/prescription', data);
        return response.data;
    }

    async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
        const response = await this.api.get<Prescription[]>(`/prescription/patient/${patientId}`);
        return response.data;
    }

    async getPrescriptionById(id: string): Promise<Prescription> {
        const response = await this.api.get<Prescription>(`/prescription/${id}`);
        return response.data;
    }

    async startPrescription(id: string, horairesRappel?: { matin: string; midi: string; soir: string }): Promise<any> {
        const response = await this.api.put(`/prescription/${id}/start`, horairesRappel ? { horairesRappel } : {});
        return response.data;
    }

    async updatePrescriptionHoraires(id: string, horairesRappel: { matin: string; midi: string; soir: string }): Promise<any> {
        const response = await this.api.put(`/prescription/${id}/horaires`, { horairesRappel });
        return response.data;
    }

    async getAlertesToday(): Promise<any[]> {
        const response = await this.api.get('/prescription/alertes/today');
        return response.data;
    }

    async markAlertePrise(alerteId: string): Promise<any> {
        const response = await this.api.put(`/prescription/alertes/${alerteId}/pris`);
        return response.data;
    }

    /**
     * Marque une prise à partir du contexte d'une notification, quand l'id de
     * l'alerte n'est pas connu.
     *
     * C'est le cas du bouton « J'ai pris » du volet de notifications : la
     * notification a été programmée sur le téléphone au démarrage du
     * traitement, et ne transporte que la prescription, le moment et le nom du
     * médicament — l'id de l'alerte, lui, est créé côté serveur.
     */
    async marquerPrisParContexte(contexte: {
        prescriptionId: string;
        moment?: string;
        nomMedicament?: string;
    }): Promise<{ marquees: number; dejaPrises: number; alerteIds: string[] }> {
        const response = await this.api.put('/prescription/alertes/marquer-pris', contexte);
        return response.data;
    }
}

export const prescriptionService = new PrescriptionService();