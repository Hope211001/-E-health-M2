/**
 * prisesEnAttente.ts
 *
 * File d'attente locale des prises déclarées depuis une notification mais non
 * encore transmises au serveur.
 *
 * POURQUOI ELLE EXISTE. Le bouton « J'ai pris » est appuyé depuis le volet de
 * notifications, sans ouvrir l'application — c'est tout son intérêt. Mais à ce
 * moment-là on ne contrôle rien : le téléphone peut être en mode avion, hors
 * couverture, ou le serveur injoignable. Sans file d'attente, la déclaration
 * serait perdue en silence et l'alerte finirait en « manqué » alors que le
 * patient a bien répondu — exactement le défaut qu'on corrige.
 *
 * Le patient, lui, ne peut pas savoir que l'envoi a échoué : la notification a
 * disparu, l'app n'était pas ouverte, aucun message ne peut lui être montré. La
 * seule issue honnête est de garder la déclaration et de la rejouer.
 *
 * AsyncStorage et non un état mémoire : le processus qui traite l'appui sur le
 * bouton peut être tué par Android juste après, l'application n'étant pas au
 * premier plan.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLE = 'mediora.prises-en-attente';

/**
 * Au-delà, on cesse d'empiler : une file qui grossit sans fin signale un
 * serveur durablement injoignable, et les plus anciennes déclarations sont de
 * toute façon devenues inexploitables (voir la péremption ci-dessous).
 */
const MAX_FILE = 50;

/**
 * Une déclaration ne vaut que pour la journée en cours — la route serveur
 * refuse de réécrire l'observance d'un jour passé. Rejouer une prise de la
 * veille marquerait l'alerte du JOUR comme prise, ce qui serait une donnée
 * fausse. Au-delà de ce délai, on abandonne.
 */
const PEREMPTION_MS = 12 * 60 * 60 * 1000;

export type PriseEnAttente = {
  prescriptionId: string;
  moment?: string;
  nomMedicament?: string;
  /** Horodatage de l'appui sur « J'ai pris », pour la péremption. */
  declareeLe: number;
};

async function lire(): Promise<PriseEnAttente[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    // Un stockage illisible ne doit pas empêcher l'app de démarrer : on repart
    // d'une file vide plutôt que de propager l'erreur.
    return [];
  }
}

async function ecrire(file: PriseEnAttente[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, JSON.stringify(file.slice(-MAX_FILE)));
  } catch (e) {
    console.warn('Prises en attente non enregistrées :', e);
  }
}

/** Ajoute une déclaration à rejouer plus tard. */
export async function empiler(prise: Omit<PriseEnAttente, 'declareeLe'>): Promise<void> {
  const file = await lire();

  // Dédoublonnage : la même notification peut être acquittée deux fois (elle
  // reste parfois affichée après l'appui). Deux entrées identiques
  // produiraient deux appels réseau pour un seul résultat.
  const existe = file.some((p) =>
    p.prescriptionId === prise.prescriptionId
    && p.moment === prise.moment
    && p.nomMedicament === prise.nomMedicament
  );
  if (existe) return;

  await ecrire([...file, { ...prise, declareeLe: Date.now() }]);
}

/**
 * Rejoue les déclarations en attente.
 *
 * `envoyer` est injecté plutôt qu'importé : ce module ne doit dépendre ni du
 * service API ni de Firebase, pour rester appelable depuis le gestionnaire de
 * notification, qui s'exécute dans un contexte réduit.
 *
 * Une déclaration n'est retirée de la file que si l'envoi a RÉUSSI, ou si elle
 * est périmée. Un échec la laisse en place pour la prochaine tentative.
 */
export async function rejouer(
  envoyer: (prise: PriseEnAttente) => Promise<void>,
): Promise<{ transmises: number; abandonnees: number; restantes: number }> {
  const file = await lire();
  if (file.length === 0) return { transmises: 0, abandonnees: 0, restantes: 0 };

  const maintenant = Date.now();
  const restantes: PriseEnAttente[] = [];
  let transmises = 0;
  let abandonnees = 0;

  for (const prise of file) {
    if (maintenant - prise.declareeLe > PEREMPTION_MS) {
      abandonnees++;
      continue;
    }
    try {
      await envoyer(prise);
      transmises++;
    } catch {
      restantes.push(prise);
    }
  }

  await ecrire(restantes);
  return { transmises, abandonnees, restantes: restantes.length };
}

/** Nombre de déclarations encore en attente (pour un éventuel indicateur). */
export async function compter(): Promise<number> {
  return (await lire()).length;
}
