import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';
import { libelleAge } from './dateNaissance';
import { SIGLE_TYPE_ETABLISSEMENT } from '../api/etablissementService';
import type { TypeEtablissement } from '../types/collection';

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

/** En-tête « établissement » d'une ordonnance : la structure émettrice. */
export type EnteteEtablissement = {
  /** Nom de l'établissement. */
  label?: string;
  /** "CSB II · Antananarivo". */
  details?: string;
  /** Adresse postale et téléphone, pour le pied de l'ordonnance. */
  contact?: string;
};

/**
 * Établissement émetteur d'une ordonnance.
 *
 * On lit d'abord `prescriptions.etablissementId` — l'établissement figé au
 * moment de la prescription — et non celui du médecin aujourd'hui : une
 * ordonnance est un acte daté, et un praticien muté depuis ne doit pas faire
 * réapparaître l'en-tête de son nouvel hôpital sur un document ancien.
 *
 * Le repli sur le médecin ne sert qu'aux ordonnances antérieures à ce champ,
 * qui n'en portent aucun.
 */
export const getEtablissementEntete = async (
  etablissementId?: string,
  medecinId?: string,
): Promise<EnteteEtablissement> => {
  try {
    let id = (etablissementId || '').trim();

    if (!id && medecinId) {
      const medSnap = await getDoc(doc(db, 'users', medecinId));
      id = String(medSnap.exists() ? medSnap.data()?.etablissementId ?? '' : '').trim();
    }
    if (!id) return {};

    const snap = await getDoc(doc(db, 'etablissements', id));
    if (!snap.exists()) return {};
    const e = snap.data();

    // L'établissement ne stocke qu'un `villeId` : il faut donc lire la ville
    // pour composer l'en-tête. Une lecture de plus, acceptable ici — c'est une
    // impression ponctuelle, pas une liste qui défile. C'est aussi ce qui
    // garantit qu'une commune renommée apparaît corrigée sur les ordonnances
    // imprimées ensuite.
    let villeNom = '';
    const villeId = String(e?.villeId || '').trim();
    if (villeId) {
      const villeSnap = await getDoc(doc(db, 'villes', villeId));
      if (villeSnap.exists()) villeNom = villeSnap.data()?.nom || '';
    }

    return {
      label: e?.nom || undefined,
      details: [SIGLE_TYPE_ETABLISSEMENT[e?.type as TypeEtablissement] ?? e?.type, villeNom]
        .filter(Boolean).join(' · ') || undefined,
      contact: [e?.adresse, e?.telephone].filter(Boolean).join(' — ') || undefined,
    };
  } catch {
    // Un en-tête absent n'empêche pas d'imprimer l'ordonnance : le document
    // reste valide sans le nom de la structure, l'inverse n'est pas vrai.
    return {};
  }
};
