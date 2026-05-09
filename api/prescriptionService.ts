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
}

export const prescriptionService = new PrescriptionService();