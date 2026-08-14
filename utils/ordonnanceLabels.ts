import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';
import { libelleAge } from './dateNaissance';

/** Compose "Prénom Nom" à partir d'un document utilisateur, sinon l'email. */
const nomComplet = (data: any): string | undefined => {
  if (!data) return undefined;
  const nom = [data.prenom, data.nom].filter(Boolean).join(' ').trim();
  return nom || data.email || undefined;
};

/** En-tête « patient » d'une ordonnance : identité et données cliniques. */
export type EntetePatient = {
  /** "Prénom Nom (N° patient)", sinon l'email. */
  label?: string;
  /** "Masculin · 32 ans" — undefined si ni le sexe ni la naissance ne sont renseignés. */
  details?: string;
};

/**
 * Lit en une fois tout ce qu'une ordonnance doit porter sur son patient.
 *
 * Une seule fonction plutôt qu'une par champ : identité, sexe et âge viennent
 * du même document, et deux appels séparés le reliraient deux fois pour un
 * seul document imprimé.
 *
 * Le sexe et l'âge sont facultatifs — un patient qui ne les a pas renseignés
 * donne un `details` absent, que l'appelant se contente de ne pas afficher.
 */
export const getPatientEntete = async (patientId?: string): Promise<EntetePatient> => {
  if (!patientId) return {};
  try {
    const [userSnap, patientSnap] = await Promise.all([
      getDoc(doc(db, 'users', patientId)),
      getDocs(query(collection(db, 'patients'), where('userId', '==', patientId))),
    ]);

    const data = userSnap.exists() ? userSnap.data() : null;
    const nom = nomComplet(data);
    const numero = patientSnap.empty ? undefined : patientSnap.docs[0].data()?.numeroPatient;

    // Repli sur le document `patients` : il duplique l'état civil, et les
    // comptes créés avant cette duplication peuvent n'avoir la donnée que d'un
    // seul côté.
    const detail = patientSnap.empty ? null : patientSnap.docs[0].data();
    const sexe = data?.sexe || detail?.sexe;
    const naissance = data?.dateNaissance || detail?.dateNaissance;

    const details = [
      sexe === 'M' ? 'Masculin' : sexe === 'F' ? 'Féminin' : null,
      libelleAge(naissance),
    ].filter(Boolean).join(' · ');

    return {
      label: (nom && numero) ? `${nom} (${numero})` : (nom || numero),
      details: details || undefined,
    };
  } catch {
    return {};
  }
};

/** Libellé du médecin prescripteur : "Dr Prénom Nom". */
export const getMedecinLabel = async (medecinId?: string): Promise<string | undefined> => {
  if (!medecinId) return undefined;
  try {
    const snap = await getDoc(doc(db, 'users', medecinId));
    const nom = nomComplet(snap.exists() ? snap.data() : null);
    return nom ? `Dr ${nom}` : undefined;
  } catch {
    return undefined;
  }
};
