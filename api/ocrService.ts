import { ClientService } from './clientService';

/** Une pharmacie extraite d'une affiche par l'OCR. */
export interface PharmacieOcr {
  /** Titre du bloc de l'affiche (ville, arrondissement…). Vide si illisible. */
  ville?: string;
  nom: string;
  adresse: string;
  telephones: string[];
}

/** Résultat d'OCR enregistré dans la collection Firestore "ocr". */
export interface ResultatOcr {
  id: string;
  /** Lien vers le document pharamacieGarde analysé. */
  pharmacieGardeId: string;
  idpost: string;
  images: string[];
  texteBrut: string;
  pharmacies: PharmacieOcr[];
  nbPharmacies: number;
  /** Nombre de villes distinctes détectées sur l'affiche. */
  nbVilles?: number;
  modele: string;
  erreurs: { imageUrl: string; message: string }[];
  dateCreation: any;
  dateModification: any;
}

/**
 * Le backend analyse les images une par une : plusieurs affiches prennent du
 * temps. Au-delà de ce délai on rend la main plutôt que de laisser l'écran
 * bloqué — le traitement, lui, continue côté serveur.
 */
const DELAI_MAX_MS = 180000;

/**
 * OCR des affiches de pharmacies de garde.
 *
 * L'analyse est faite par le backend (services/ocrPharmacieGardeService.js),
 * qui appelle le modèle vision et écrit dans la collection Firestore `ocr`.
 * Aucune clé de modèle ne transite donc par l'application, où elle serait
 * extractible du bundle.
 */
class OcrService extends ClientService {
  /**
   * Lance l'analyse et renvoie le résultat enregistré.
   *
   * Le backend lit les images une par une : plusieurs affiches prennent du
   * temps, d'où le délai d'attente allongé pour cette seule requête. Passé ce
   * délai, l'analyse se poursuit côté serveur — on rend simplement la main.
   */
  async generer(pharmacieGardeId: string): Promise<ResultatOcr | null> {
    const response = await this.api.post<ResultatOcr>(
      `/ocr/pharmacie-garde/${pharmacieGardeId}`,
      {},
      { timeout: DELAI_MAX_MS },
    );
    return response.data;
  }

  /** Résultat déjà enregistré, ou null si la publication n'a jamais été analysée. */
  async getPourPharmacieGarde(pharmacieGardeId: string): Promise<ResultatOcr | null> {
    const response = await this.api.get<ResultatOcr>(`/ocr/pharmacie-garde/${pharmacieGardeId}`);
    // Le backend répond 204 sans corps quand aucun OCR n'existe.
    return response.status === 204 ? null : response.data;
  }

  /** Tous les résultats d'OCR, du plus récent au plus ancien. */
  async list(): Promise<ResultatOcr[]> {
    const response = await this.api.get<ResultatOcr[]>('/ocr');
    return response.data;
  }

  async remove(pharmacieGardeId: string): Promise<{ id: string; deleted: boolean }> {
    const response = await this.api.delete(`/ocr/pharmacie-garde/${pharmacieGardeId}`);
    return response.data;
  }
}

export const ocrService = new OcrService();
