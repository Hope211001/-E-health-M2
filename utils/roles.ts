/**
 * roles.ts
 *
 * Libellés des rôles et formatage de la trace « créé par », partagés par les
 * écrans qui affichent des comptes (liste des utilisateurs, dossiers, profil).
 */
import type {
  AuthProvider, Createur, EtablissementResolu, UserRole,
} from '@/types/collection';

/**
 * Forme minimale attendue pour décrire l'origine d'un compte.
 *
 * Volontairement plus large qu'un `Pick<User, …>` : les dossiers renvoient
 * `authProvider: null` là où `User` le déclare optionnel, et les deux doivent
 * pouvoir passer par ces helpers.
 */
export type CompteTracable = {
  createur?: Createur | null;
  authProvider?: AuthProvider | null;
};

export const LIBELLE_ROLE: Record<UserRole, string> = {
  medecin: 'Médecin',
  patient: 'Patient',
  admin: 'Administrateur',
  superadmin: 'Super administrateur',
};

/** Libellé d'un rôle, tolérant aux valeurs inconnues ou absentes. */
export function libelleRole(role?: UserRole | null): string {
  return role ? (LIBELLE_ROLE[role] ?? role) : '';
}

/**
 * Phrase décrivant l'origine d'un compte, par exemple :
 *   « Créé par Dr. Hery Rakoto (Médecin) »
 *   « Inscription Google (auto) »
 *   « Origine non enregistrée »
 *
 * Les deux derniers cas ne sont pas des erreurs : les comptes Google se créent
 * eux-mêmes, et les comptes antérieurs à la traçabilité n'ont jamais porté
 * l'information.
 */
export function origineCompte(compte: CompteTracable): string {
  const createur = compte.createur;

  if (!createur) {
    return compte.authProvider === 'google'
      ? 'Inscription Google (auto)'
      : 'Origine non enregistrée';
  }

  const role = libelleRole(createur.role);

  // Compte créateur supprimé depuis : on garde la mention du rôle, qui reste
  // une information utile, plutôt que d'afficher un nom vide.
  if (!createur.existe || !createur.identite) {
    return role ? `Créé par un ${role.toLowerCase()} (compte supprimé)` : 'Créé par un compte supprimé';
  }

  return role ? `Créé par ${createur.identite} (${role})` : `Créé par ${createur.identite}`;
}

/** Icône illustrant l'origine d'un compte. */
export function iconeOrigine(compte: CompteTracable) {
  if (compte.createur) return 'person-add-outline' as const;
  return compte.authProvider === 'google'
    ? ('logo-google' as const)
    : ('help-circle-outline' as const);
}

/**
 * Phrase décrivant le rattachement d'un compte, par exemple :
 *   « CHU Joseph Ravoahangy — Antananarivo »
 *   « Portée nationale »            (superadmin)
 *   « Non rattaché »                (compte antérieur, ou inscription Google)
 *   « Établissement supprimé »      (anomalie réelle)
 *
 * Les trois premiers cas ne sont pas des erreurs et ne doivent pas être
 * présentés comme telles : un superadmin n'a légitimement aucun établissement,
 * et un compte antérieur au multi-établissement n'en a jamais porté.
 */
export function libelleEtablissement(
  etablissement?: EtablissementResolu | null,
  role?: UserRole | null,
): string {
  if (etablissement) {
    if (!etablissement.existe) return 'Établissement supprimé';
    // `ville` est un bloc résolu, pas une chaîne : l'établissement ne stocke
    // qu'un `villeId`, l'API relit le libellé. Le passer directement à `join`
    // afficherait « [object Object] ».
    const lieu = [etablissement.nom, etablissement.ville?.nom].filter(Boolean).join(' — ');
    return etablissement.statut === 'inactif' ? `${lieu} (désactivé)` : lieu;
  }
  return role === 'superadmin' ? 'Portée nationale' : 'Non rattaché';
}

/** Icône illustrant le rattachement d'un compte. */
export function iconeEtablissement(
  etablissement?: EtablissementResolu | null,
  role?: UserRole | null,
) {
  if (etablissement) {
    return etablissement.existe ? ('business-outline' as const) : ('alert-circle-outline' as const);
  }
  return role === 'superadmin' ? ('globe-outline' as const) : ('help-circle-outline' as const);
}

/**
 * Identifiant abrégé pour l'affichage : un uid Firebase fait 28 caractères et
 * déborderait sur une carte de liste.
 */
export function idAbrege(uid?: string, longueur = 8): string {
  if (!uid) return '';
  return uid.length <= longueur ? uid : `${uid.slice(0, longueur)}…`;
}