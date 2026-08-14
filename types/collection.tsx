import { Timestamp } from 'firebase/firestore';
export type UserRole = 'medecin' | 'patient' | 'admin' | 'superadmin';
export type AuthProvider = 'password' | 'google';

/**
 * Sexe du titulaire du compte. Facultatif : l'API stocke '' quand il n'est pas
 * renseigné, valeur que portent aussi tous les comptes antérieurs à ce champ.
 */
export type Sexe = 'M' | 'F';

/**
 * Compte à l'origine d'une création, résolu par l'API.
 * `null` pour les comptes antérieurs à cette traçabilité et pour les
 * inscriptions Google, qui n'ont pas de créateur.
 */
export interface Createur {
    uid: string;
    /** Rôle du créateur AU MOMENT de la création, pas son rôle actuel. */
    role: UserRole | null;
    /** Nom complet, relu à la demande ; vide si le compte a été supprimé. */
    identite: string;
    /** Faux quand le compte créateur n'existe plus. */
    existe: boolean;
}

export interface User {
    uid: string;
    email: string;
    password?: string;
    nom?: string;
    prenom?: string;
    role: UserRole;
    telephone?: string;
    photoURL?: string;
    authProvider?: AuthProvider;
    /** uid du compte créateur (champ brut stocké en base). */
    creePar?: string | null;
    /** Rôle figé du créateur (champ brut stocké en base). */
    creeParRole?: UserRole | null;
    /** Bloc résolu renvoyé par l'API — absent des lectures Firestore directes. */
    createur?: Createur | null;
    /**
     * Vrai tant que l'application n'a pas proposé au titulaire de remplacer le
     * mot de passe reçu par email. Retombe à false qu'il accepte ou qu'il
     * refuse — la question ne se pose qu'une fois. Absent sur les comptes
     * antérieurs à cette fonctionnalité et sur les comptes Google.
     */
    proposerChangementMotDePasse?: boolean;
    /**
     * Faux quand l'email d'identifiants n'a pas pu partir : le compte existe
     * mais son titulaire ne peut pas encore se connecter. À rattraper avec
     * « Renvoyer les identifiants ».
     */
    identifiantsEnvoyes?: boolean;
    identifiantsEnvoyesLe?: Timestamp;
    dateCreation: Timestamp;
    statut: 'actif' | 'inactif';
    /**
     * Date civile 'AAAA-MM-JJ', ou '' si non renseignée — valeur que portent
     * aussi tous les comptes antérieurs à ce champ. Chaîne et non Timestamp :
     * une naissance est une date, pas un instant, et un Timestamp relu dans un
     * autre fuseau reculerait d'un jour. Voir `utils/dateNaissance.ts`.
     */
    dateNaissance?: string;
    sexe?: Sexe | '';
    adresse?: string;
}
export interface Medecin extends User {
    id: string
    specialite?: string[];
    numeroOrdre?: string;
    userId:string;
}
export interface Patient extends User {
    id?: string;
    numeroPatient: string;
    groupeSanguin?: string;
    allergies: string[];
    antecedents: string[];
    medecinTraitantId: string;
    codeGenereDate: Timestamp;
    codeExpirationDate: Timestamp;
    dateCreation: Timestamp;
    statut: 'actif' | 'inactif';
    userId:string;

}
export interface Medicament {
    id?: string;
    nomMedicament: string;
    dosage: string;
    frequence: string;
    quantite: number;
    unite: string;
    voieAdministration: string;
    instructions: string;
    duree: number;
    heuresPrises: string[];
}

export interface Prescription {
    id?: string;
    patientId: string;
    medecinId: string;
    dateCreation: Timestamp;
    dateDebut: Timestamp;
    dateFin: Timestamp;
    duree: number;
    statut: 'active' | 'en_cours' | 'terminee' | 'annulee' | 'en_attente';
    diagnostic: string;
    observations: string;
    medicaments: Medicament[];
    creePar: string;
}
export interface PharmacieGarde {
    id: string;
    idpost: string;
    isVisible: boolean;
    urlPost: string;
    textPost: string;
    attachement: string[];
    dateCreation?: Timestamp | null;
    dateModification?: Timestamp | null;
}
export interface Alerte {
    id?: string;
    patientId: string;
    prescriptionId: string;
    medicamentId: string;
    nomMedicament: string;
    dosage: string;
    heurePrevu: string;
    datePrise: Timestamp;
    statut: 'en_attente' | 'notifie' | 'pris' | 'manque' | 'retard';
    notificationEnvoyee: boolean;
    dateNotification?: Timestamp;
    prisLe?: Timestamp;
    notes?: string;
}