import { ClientService } from './clientService';
import type { Etablissement, TypeEtablissement } from '../types/collection';

/**
 * Libellés affichables des types d'établissement.
 *
 * Le code stocké est un sigle (`CSB2`), volontairement court et stable ; c'est
 * ici qu'il devient lisible. Séparer les deux permet de reformuler un libellé
 * sans toucher aux documents déjà enregistrés.
 */
export const LIBELLE_TYPE_ETABLISSEMENT: Record<TypeEtablissement, string> = {
  CHU: 'Centre Hospitalier Universitaire',
  CHRR: 'Centre Hospitalier de Référence Régionale',
  CHRD: 'Centre Hospitalier de Référence de District',
  CSB2: 'Centre de Santé de Base niveau II',
  CSB1: 'Centre de Santé de Base niveau I',
  clinique: 'Clinique privée',
  cabinet: 'Cabinet médical',
  autre: 'Autre structure',
};

/** Forme courte, pour les badges de liste où le libellé complet déborderait. */
export const SIGLE_TYPE_ETABLISSEMENT: Record<TypeEtablissement, string> = {
  CHU: 'CHU',
  CHRR: 'CHRR',
  CHRD: 'CHRD',
  CSB2: 'CSB II',
  CSB1: 'CSB I',
  clinique: 'Clinique',
  cabinet: 'Cabinet',
  autre: 'Autre',
};

export const TYPES_ETABLISSEMENT = Object.keys(
  LIBELLE_TYPE_ETABLISSEMENT,
) as TypeEtablissement[];

export interface DonneesEtablissement {
  nom: string;
  type: TypeEtablissement;
  /**
   * Référence vers le référentiel `villes`. Le NOM de la ville n'est pas
   * transmis : le recopier sur l'établissement en ferait une seconde source de
   * vérité, qui divergerait au premier renommage de commune.
   */
  villeId: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

/**
 * Établissements de santé enrôlés dans la plateforme.
 *
 * L'API restreint d'elle-même la portée : un superadmin voit le pays, un admin
 * ne reçoit que le sien. Les écrans n'ont donc pas à filtrer — et ne le
 * doivent pas, un filtre côté application ne protégeant rien.
 */
class EtablissementService extends ClientService {
  /**
   * Liste des établissements.
   *
   * `effectifs` déclenche le comptage des comptes rattachés : utile à l'écran
   * de gestion, inutile (et coûteux) pour un simple sélecteur.
   */
  async lister(options?: {
    q?: string;
    statut?: 'actif' | 'inactif';
    effectifs?: boolean;
  }): Promise<Etablissement[]> {
    const response = await this.api.get<{ data: Etablissement[]; total: number }>(
      '/etablissements',
      {
        params: {
          ...(options?.q ? { q: options.q } : {}),
          ...(options?.statut ? { statut: options.statut } : {}),
          ...(options?.effectifs ? { effectifs: 'true' } : {}),
        },
      },
    );
    return response.data.data;
  }

  async get(id: string): Promise<Etablissement> {
    const response = await this.api.get<Etablissement>(`/etablissements/${id}`);
    return response.data;
  }

  /** Enrôle un établissement. Superadmin uniquement. */
  async creer(donnees: DonneesEtablissement): Promise<Etablissement> {
    const response = await this.api.post<Etablissement>('/etablissements', donnees);
    return response.data;
  }

  /** Seuls les champs fournis sont modifiés. Superadmin uniquement. */
  async modifier(id: string, donnees: Partial<DonneesEtablissement>): Promise<Etablissement> {
    const response = await this.api.patch<Etablissement>(`/etablissements/${id}`, donnees);
    return response.data;
  }

  /**
   * Active ou désactive un établissement.
   *
   * Il n'y a pas de suppression : un établissement porte des dossiers et des
   * ordonnances qui doivent rester consultables après son retrait. Désactivé,
   * il n'accepte plus de nouveaux comptes sans que rien ne soit effacé.
   */
  async basculerStatut(id: string): Promise<{ id: string; statut: 'actif' | 'inactif' }> {
    const response = await this.api.patch(`/etablissements/${id}/statut`);
    return response.data;
  }
}

export const etablissementService = new EtablissementService();
