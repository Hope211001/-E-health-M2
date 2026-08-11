/**
 * useCompteursNonPris.ts
 *
 * Compteurs « médicament non pris » alimentant les pastilles rouges des barres
 * d'onglets. Deux points de vue sur le même fait métier :
 *   - le PATIENT voit ce qu'il lui reste à prendre aujourd'hui ;
 *   - le MÉDECIN voit les oublis que ses patients lui ont fait remonter.
 *
 * `onSnapshot` et non un chargement ponctuel : les layouts de navigation
 * restent montés pendant toute la navigation entre onglets, donc un
 * `useFocusEffect` ne se redéclencherait pas quand le patient marque une prise
 * puis revient. Même raisonnement que le badge « Ordonnances » existant.
 *
 * Les requêtes n'utilisent qu'une seule clause `where`, le reste étant filtré
 * en JS : c'est la convention du projet (voir checkMissedMedications et
 * getAlertesToday), elle évite d'avoir à créer des index composites Firestore.
 */
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../api/firebase';

/** Statut d'une alerte considéré comme « pris » — tout le reste est en retard ou à faire. */
const STATUT_PRIS = 'pris';

/** Convertit un champ Firestore (Timestamp ou chaîne) en Date, sinon null. */
function versDate(valeur: any): Date | null {
  if (!valeur) return null;
  const d = valeur?.toDate ? valeur.toDate() : new Date(valeur);
  return isNaN(d.getTime()) ? null : d;
}

/** Bornes de la journée en cours, dans le fuseau du téléphone. */
function bornesDuJour() {
  const maintenant = new Date();
  const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const fin = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1);
  return { debut, fin };
}

/**
 * PATIENT — nombre de prises du jour pas encore validées.
 *
 * Compte tous les statuts sauf `pris` : une dose `manque` reste une dose non
 * prise, la masquer donnerait au patient l'illusion d'être à jour.
 */
export function useAlertesNonPrises(): number {
  const [compteur, setCompteur] = useState(0);

  useEffect(() => {
    let arreterEcoute: (() => void) | undefined;

    const arreterAuth = onAuthStateChanged(auth, (utilisateur) => {
      arreterEcoute?.();
      if (!utilisateur) {
        setCompteur(0);
        return;
      }

      const requete = query(
        collection(db, 'alertes'),
        where('patientId', '==', utilisateur.uid),
      );

      arreterEcoute = onSnapshot(
        requete,
        (snap) => {
          const { debut, fin } = bornesDuJour();
          const total = snap.docs.filter((doc) => {
            const alerte = doc.data();
            if (alerte.statut === STATUT_PRIS) return false;
            const date = versDate(alerte.datePrise);
            return date !== null && date >= debut && date < fin;
          }).length;
          setCompteur(total);
        },
        (erreur) => {
          // Un échec de lecture ne doit pas faire planter la barre d'onglets :
          // on retombe sur « aucune alerte » plutôt que sur un écran cassé.
          console.warn('Compteur alertes indisponible :', erreur.message);
          setCompteur(0);
        },
      );
    });

    return () => {
      arreterEcoute?.();
      arreterAuth();
    };
  }, []);

  return compteur;
}

/**
 * MÉDECIN — nombre de notifications « médicament non pris » non lues.
 *
 * Deux écoutes plutôt qu'une : les notifications récentes portent
 * `destinataireId`, les anciennes seulement `medecinId`. Le backend applique
 * déjà ce même repli (voir notificationService.countUnread). Les résultats sont
 * dédoublonnés par identifiant de document, un même document pouvant porter les
 * deux champs.
 */
export function useMedicamentsManques(): number {
  const [compteur, setCompteur] = useState(0);

  useEffect(() => {
    const arretsEcoute: (() => void)[] = [];

    const arreterAuth = onAuthStateChanged(auth, (utilisateur) => {
      arretsEcoute.forEach((arreter) => arreter());
      arretsEcoute.length = 0;

      if (!utilisateur) {
        setCompteur(0);
        return;
      }

      // Identifiants vus par champ source, recombinés à chaque mise à jour.
      const parChamp: Record<string, Set<string>> = {
        destinataireId: new Set(),
        medecinId: new Set(),
      };

      const recalculer = () => {
        const union = new Set([...parChamp.destinataireId, ...parChamp.medecinId]);
        setCompteur(union.size);
      };

      for (const champ of ['destinataireId', 'medecinId'] as const) {
        const requete = query(
          collection(db, 'notifications'),
          where(champ, '==', utilisateur.uid),
        );

        arretsEcoute.push(
          onSnapshot(
            requete,
            (snap) => {
              parChamp[champ] = new Set(
                snap.docs
                  .filter((doc) => {
                    const notif = doc.data();
                    return notif.lue === false && notif.type === 'medication_manquee';
                  })
                  .map((doc) => doc.id),
              );
              recalculer();
            },
            (erreur) => {
              console.warn(`Compteur notifications (${champ}) indisponible :`, erreur.message);
              parChamp[champ] = new Set();
              recalculer();
            },
          ),
        );
      }
    });

    return () => {
      arretsEcoute.forEach((arreter) => arreter());
      arreterAuth();
    };
  }, []);

  return compteur;
}