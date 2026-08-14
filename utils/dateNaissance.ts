/**
 * Date de naissance et âge.
 *
 * L'API stocke la date en chaîne 'AAAA-MM-JJ' — une date civile, pas un
 * instant (voir `dateNaissanceOptionnelle` côté backend). Elle est donc lue
 * ici composante par composante, sans jamais passer la chaîne complète à
 * `new Date(...)` : `new Date('2000-05-10')` est interprété en UTC puis relu
 * en heure locale, ce qui recule la date d'un jour dans tout fuseau négatif et
 * ferait basculer un âge la veille de l'anniversaire.
 *
 * La saisie, elle, se fait en 'JJ/MM/AAAA' : c'est la forme lue sur une carte
 * d'identité. Les deux conversions vivent ici pour que les écrans, le champ de
 * saisie et les schémas zod partagent exactement la même définition de ce
 * qu'est une date valide.
 */

/** Âge au-delà duquel la saisie est forcément une faute — aligné sur le backend. */
const AGE_MAX = 130;

type Composantes = { annee: number; mois: number; jour: number };

/**
 * Découpe une valeur 'AAAA-MM-JJ' en composantes, ou renvoie null si elle est
 * inexploitable (absente, mal formée, ou jour inexistant comme un 31 février).
 */
function decouper(valeur?: string | null): Composantes | null {
  if (!valeur) return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valeur).trim());
  if (!parts) return null;

  const annee = Number(parts[1]);
  const mois = Number(parts[2]);
  const jour = Number(parts[3]);

  // `Date` ne rejette pas un 31 février, il le décale au 3 mars : on relit les
  // trois composantes pour détecter ce glissement silencieux.
  const test = new Date(Date.UTC(annee, mois - 1, jour));
  if (test.getUTCFullYear() !== annee
    || test.getUTCMonth() !== mois - 1
    || test.getUTCDate() !== jour) {
    return null;
  }
  return { annee, mois, jour };
}

/**
 * Âge en années révolues, ou null si la date est absente ou inexploitable.
 *
 * Le « aujourd'hui » est pris dans le fuseau du téléphone : c'est le calendrier
 * de celui qui lit l'écran qui fait foi pour savoir si l'anniversaire est passé.
 */
export function calculerAge(valeur?: string | null): number | null {
  const d = decouper(valeur);
  if (!d) return null;

  const maintenant = new Date();
  let age = maintenant.getFullYear() - d.annee;

  // L'anniversaire de l'année en cours n'est pas encore passé : une année de
  // moins. Comparer les mois puis les jours évite tout calcul en millisecondes,
  // faux dès qu'un changement d'heure tombe entre les deux dates.
  const ecartMois = (maintenant.getMonth() + 1) - d.mois;
  if (ecartMois < 0 || (ecartMois === 0 && maintenant.getDate() < d.jour)) age--;

  if (age < 0 || age > AGE_MAX) return null;
  return age;
}

/** « 32 ans », « 1 an », ou null si la date est absente ou inexploitable. */
export function libelleAge(valeur?: string | null): string | null {
  const age = calculerAge(valeur);
  if (age === null) return null;
  return `${age} ${age <= 1 ? 'an' : 'ans'}`;
}

/** 'AAAA-MM-JJ' → 'JJ/MM/AAAA'. Null si la valeur est inexploitable. */
export function formatDateNaissance(valeur?: string | null): string | null {
  const d = decouper(valeur);
  if (!d) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.jour)}/${p(d.mois)}/${d.annee}`;
}

/** « 12/05/1993 (32 ans) », ou null — forme affichée dans les fiches. */
export function dateNaissanceAvecAge(valeur?: string | null): string | null {
  const date = formatDateNaissance(valeur);
  if (!date) return null;
  const age = libelleAge(valeur);
  return age ? `${date} (${age})` : date;
}

/**
 * Formate la saisie au fil de la frappe en 'JJ/MM/AAAA'.
 *
 * Les séparateurs sont posés par le champ et non tapés par l'utilisateur : sur
 * un pavé numérique de téléphone, la barre oblique impose une bascule de
 * clavier par séparateur.
 */
export function masquerSaisieDate(saisie: string): string {
  const chiffres = String(saisie).replace(/\D/g, '').slice(0, 8);
  const jour = chiffres.slice(0, 2);
  const mois = chiffres.slice(2, 4);
  const annee = chiffres.slice(4, 8);

  let sortie = jour;
  if (chiffres.length > 2) sortie += `/${mois}`;
  if (chiffres.length > 4) sortie += `/${annee}`;
  return sortie;
}

/**
 * 'JJ/MM/AAAA' → 'AAAA-MM-JJ' pour l'API. Renvoie '' pour une saisie vide
 * (date non renseignée, valeur acceptée) et null pour une saisie invalide,
 * que l'appelant doit distinguer.
 */
export function versISO(saisie: string): string | null {
  const chiffres = String(saisie).replace(/\D/g, '');
  if (chiffres.length === 0) return '';
  if (chiffres.length !== 8) return null;

  const iso = `${chiffres.slice(4, 8)}-${chiffres.slice(2, 4)}-${chiffres.slice(0, 2)}`;
  if (!decouper(iso)) return null;

  // Une date future ou un âge aberrant sont refusés côté serveur : autant le
  // dire ici, avant l'aller-retour réseau.
  const age = calculerAge(iso);
  if (age === null) return null;
  return iso;
}

/** 'AAAA-MM-JJ' → 'JJ/MM/AAAA' pour préremplir un champ ; '' si inexploitable. */
export function depuisISO(valeur?: string | null): string {
  return formatDateNaissance(valeur) || '';
}
