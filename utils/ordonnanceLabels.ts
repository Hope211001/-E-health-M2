import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';

/** Compose "Prénom Nom" à partir d'un document utilisateur, sinon l'email. */
const nomComplet = (data: any): string | undefined => {
  if (!data) return undefined;
  const nom = [data.prenom, data.nom].filter(Boolean).join(' ').trim();
  return nom || data.email || undefined;
};

/** Libellé du patient : "Prénom Nom (N° patient)", sinon email. */
export const getPatientLabel = async (patientId?: string): Promise<string | undefined> => {
  if (!patientId) return undefined;
  try {
    const [userSnap, patientSnap] = await Promise.all([
      getDoc(doc(db, 'users', patientId)),
      getDocs(query(collection(db, 'patients'), where('userId', '==', patientId))),
    ]);
    const nom = nomComplet(userSnap.exists() ? userSnap.data() : null);
    const numero = patientSnap.empty ? undefined : patientSnap.docs[0].data()?.numeroPatient;
    if (nom && numero) return `${nom} (${numero})`;
    return nom || numero;
  } catch {
    return undefined;
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
