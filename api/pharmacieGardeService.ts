import { ClientService } from './clientService';
import { PharmacieGarde } from '../types/collection';

export interface PharmacieGardePayload {
  idpost?: string;
  isVisible?: boolean;
  urlPost: string;
  textPost?: string;
  attachement?: string[];
}

/**
 * Service CRUD pour les pharmacies de garde (collection Firestore
 * "pharamacieGarde"). Réservé à la partie superadmin / admin.
 */
class PharmacieGardeService extends ClientService {
  /** Liste des pharmacies de garde, avec recherche optionnelle. */
  async list(q?: string): Promise<PharmacieGarde[]> {
    const response = await this.api.get<PharmacieGarde[]>('/pharmacie-garde', {
      params: q ? { q } : undefined,
    });
    return response.data;
  }

  /** Côté patient : uniquement les pharmacies de garde visibles. */
  async listVisible(): Promise<PharmacieGarde[]> {
    const response = await this.api.get<PharmacieGarde[]>('/pharmacie-garde/visible');
    return response.data;
  }

  async getById(id: string): Promise<PharmacieGarde> {
    const response = await this.api.get<PharmacieGarde>(`/pharmacie-garde/${id}`);
    return response.data;
  }

  async create(payload: PharmacieGardePayload): Promise<PharmacieGarde> {
    const response = await this.api.post<PharmacieGarde>('/pharmacie-garde', payload);
    return response.data;
  }

  async update(id: string, payload: Partial<PharmacieGardePayload>): Promise<PharmacieGarde> {
    const response = await this.api.put<PharmacieGarde>(`/pharmacie-garde/${id}`, payload);
    return response.data;
  }

  async toggleVisibilite(id: string): Promise<{ id: string; isVisible: boolean }> {
    const response = await this.api.patch(`/pharmacie-garde/${id}/visibilite`);
    return response.data;
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const response = await this.api.delete(`/pharmacie-garde/${id}`);
    return response.data;
  }
}

export const pharmacieGardeService = new PharmacieGardeService();
