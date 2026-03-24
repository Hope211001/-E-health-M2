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

}

export const patientService = new PatientService();