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

// Webhook n8n qui lance l'OCR. Configurable via .env.local ; valeur par défaut
// en secours, comme pour le webhook de scraping.
const OCR_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_OCR_WEBHOOK_URL ??
  'https://n8n.srv903010.hstgr.cloud/webhook/ocr-pharmacie-garde';

/**
 * Le workflow analyse les images une par une : plusieurs affiches prennent du
 * temps. Au-delà de ce délai on rend la main plutôt que de laisser l'écran
 * bloqué — le traitement, lui, continue côté n8n.
 */
const DELAI_MAX_MS = 180000;

/**
 * OCR des affiches de pharmacies de garde.
 *
 * L'analyse est déléguée à un workflow n8n (webhook), qui appelle le modèle
 * vision et écrit lui-même dans la collection Firestore `ocr`. Aucune clé de
 * modèle ne transite donc par l'application. La lecture des résultats passe,
 * elle, par le backend.
 */
class OcrService extends ClientService {
  /**
   * Déclenche le workflow n8n, puis relit le résultat via le backend : on
   * affiche ainsi ce qui a réellement été enregistré dans Firestore, et non
   * ce que le webhook prétend avoir fait.
   */
  async generer(pharmacieGardeId: string): Promise<ResultatOcr | null> {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_MAX_MS);

    try {
      const reponse = await fetch(OCR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacieGardeId }),
        signal: controleur.signal,
      });

      if (!reponse.ok) {
        // n8n renvoie le détail de l'erreur du nœud fautif : bien plus utile
        // qu'un simple code HTTP pour comprendre ce qui a échoué.
        const detail = await reponse.text().catch(() => '');
        throw new Error(
          detail.slice(0, 200) || `Le workflow n8n a répondu ${reponse.status}.`
        );
      }
    } catch (erreur: any) {
      if (erreur?.name === 'AbortError') {
        throw new Error(
          "Le workflow prend plus de temps que prévu. Il continue côté serveur : rouvrez cet écran dans une minute.",
        );
      }
      throw erreur;
    } finally {
      clearTimeout(minuteur);
    }

    return this.getPourPharmacieGarde(pharmacieGardeId);
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
