import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { APP_ROUTES } from '@/constants/routes';
import { useAuth } from '../hooks/useAuth';

/** Dernier segment de la route de proposition de mot de passe. */
const ECRAN_MOT_DE_PASSE = 'changer-mot-de-passe';

/**
 * Amène une fois sur l'écran qui propose de remplacer le mot de passe reçu par
 * email (`proposerChangementMotDePasse`).
 *
 * Ce n'est pas un blocage : l'utilisateur peut décliner et garder son mot de
 * passe. Le drapeau retombe à false dans les deux cas, donc cet effet ne se
 * déclenche qu'une seule fois par compte.
 *
 * Pourquoi un garde global et pas une simple redirection dans login.tsx : la
 * session Firebase est persistée (AsyncStorage), donc une réouverture de
 * l'application restaure l'utilisateur sans repasser par l'écran de connexion.
 * Sans ce garde, un compte créé puis ouvert après un redémarrage de l'app ne
 * verrait jamais la proposition.
 *
 * Le composant ne rend rien : il est monté dans le layout racine et n'agit que
 * par effet de bord.
 */
export function GardeMotDePasse() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  // Naviguer avant que le layout racine soit monté lève un avertissement et la
  // navigation est perdue. `key` n'est défini qu'une fois la racine prête.
  const racinePrete = useRootNavigationState()?.key;

  useEffect(() => {
    if (!racinePrete || loading || !user) return;
    if (!user.proposerChangementMotDePasse) return;
    // Déjà sur l'écran : ne pas relancer une navigation en boucle.
    if (segments[segments.length - 1] === ECRAN_MOT_DE_PASSE) return;

    router.replace(APP_ROUTES.AUTH.CHANGER_MOT_DE_PASSE);
  }, [racinePrete, loading, user, segments, router]);

  return null;
}