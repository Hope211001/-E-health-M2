import { ClientService } from './clientService';
import type { Ville } from '../types/collection';

/**
 * Référentiel des villes et communes.
 *
 * Collection normalisée côté serveur : les documents qui référencent une ville
 * (établissements, comptes) ne stockent qu'un `villeId`, et le libellé est
 * résolu à la lecture. Renommer une commune ne demande donc de modifier qu'un
 * seul document.
 *
 * Lecture ouverte à tous les rôles (un médecin renseigne la ville d'un
 * patient), écriture réservée au superadmin : le référentiel est national, et
 * le laisser modifier librement ramènerait le problème qu'on a supprimé — trois
 * orthographes de la même commune, enrôlées par trois établissements.
 */
class GeoService extends ClientService {
  /**
   * Liste des villes.
   *
   * Non paginée : le référentiel reste petit par nature, et les sélecteurs ont
   * besoin de la liste entière — une troncature silencieuse empêcherait de
   * choisir certaines communes sans le dire.
   */
  async listerVilles(options?: {
    q?: string;
    statut?: 'actif' | 'inactif';
  }): Promise<Ville[]> {
    const response = await this.api.get<{ data: Ville[]; total: number }>('/villes', {
      params: {
        ...(options?.q ? { q: options.q } : {}),
        ...(options?.statut ? { statut: options.statut } : {}),
      },
    });
    return response.data.data;
  }

  async creerVille(nom: string): Promise<Ville> {
    const response = await this.api.post<Ville>('/villes', { nom });
    return response.data;
  }

  /**
   * Renomme une ville.
   *
   * C'est ici que la normalisation montre sa valeur : la correction ne touche
   * qu'un document, et tous les établissements comme tous les comptes qui la
   * référencent l'affichent immédiatement, sans migration.
   */
  async modifierVille(id: string, nom: string): Promise<Ville> {
    const response = await this.api.patch<Ville>(`/villes/${id}`, { nom });
    return response.data;
  }

  /**
   * Active ou désactive une ville.
   *
   * Il n'y a pas de suppression : une ville est référencée par des
   * établissements et des comptes. La supprimer laisserait des références
   * mortes, sans retour en arrière possible.
   */
  async basculerStatutVille(id: string): Promise<{ id: string; statut: 'actif' | 'inactif' }> {
    const response = await this.api.patch(`/villes/${id}/statut`);
    return response.data;
  }
}

export const geoService = new GeoService();
