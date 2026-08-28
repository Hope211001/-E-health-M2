import { ClientService } from './clientService';
import { PharmacieGarde } from '../types/collection';

/** Bilan d'un import de publications depuis Facebook. */
export interface BilanScraping {
  examinees: number;
  retenues: number;
  importees: number;
  /** Publications déjà en base : le cas normal, pas une anomalie. */
  ignorees: number;
  echecs: { idpost: string; message: string }[];
  publications: { idpost: string; nbImages: number }[];
}

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

  /**
   * Importe les publications d'une page Facebook : scraping, tri par un modèle,
   * ré-hébergement des images et écriture en base — le tout côté backend.
   *
   * Long par nature (le scraping attend la fin de l'actor, puis chaque
   * publication retenue enchaîne un appel de modèle et un upload), d'où le
   * délai d'attente allongé pour cette seule requête.
   */
  async lancerScraping(pageUrl: string, resultsLimit: number): Promise<BilanScraping> {
    const response = await this.api.post<BilanScraping>(
      '/pharmacie-garde/scraping',
      { pageUrl, resultsLimit },
      { timeout: 300000 },
    );
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
