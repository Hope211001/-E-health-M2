import { ClientService } from './clientService';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { User, Medecin, Sexe, UserRole } from '../types/collection';

/**
 * Photo envoyée à l'API : data URI base64 pour une nouvelle image, URL http(s)
 * pour une image déjà hébergée, chaîne vide pour retirer la photo.
 * Voir utils/photoProfil.ts et back-e-health/src/services/cloudinaryService.js.
 */
export type PhotoEnvoyee = string;

/** Champs d'état civil communs à tous les rôles. */
export interface IdentiteCompte {
  nom?: string;
  prenom?: string;
  photo?: PhotoEnvoyee;
  /** 'M', 'F' ou '' (non renseigné) — l'API refuse toute autre valeur. */
  sexe?: Sexe | '';
  /**
   * Date civile 'AAAA-MM-JJ', ou '' (non renseignée). Toute autre forme est
   * refusée en 400 : voir `utils/dateNaissance.ts` pour la conversion depuis
   * la saisie 'JJ/MM/AAAA'.
   */
  dateNaissance?: string;
  adresse?: string;
}

/**
 * Marqueur ajouté par le backend aux réponses de création de compte.
 *
 * Le mot de passe étant généré côté serveur et envoyé par email au titulaire,
 * un email non parti signifie que la personne ne peut pas encore se connecter —
 * le compte, lui, existe bel et bien. Les écrans doivent donc distinguer les
 * deux cas au lieu d'annoncer un succès sans nuance.
 */
export interface CreationCompte {
  emailEnvoye?: boolean;
}

/** Réponse paginée de GET /auth/users. */
export interface PageUtilisateurs {
  data: User[];
  page: number;
  limit: number;
  /** Nombre total de comptes correspondant au rôle et à la recherche. */
  total: number;
  totalPages: number;
}

class AuthService extends ClientService {

  async login(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user) throw new Error("Erreur de connexion Firebase");

    const response = await this.api.post<User>('/auth/login');
    return response.data;
  }

  /**
   * Login Google.
   * `idToken` provient de expo-auth-session (ou @react-native-google-signin/google-signin).
   * Voir login.tsx pour l'intégration.
   */
  async loginWithGoogle(idToken: string, accessToken?: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    if (!userCredential.user) throw new Error("Erreur de connexion Google");

    // Le backend crée le profil Firestore s'il n'existe pas (rôle patient par défaut)
    const response = await this.api.post<User>('/auth/google-signin');
    return response.data;
  }

  /**
   * Envoie un email de réinitialisation via Firebase directement (côté client).
   * Le backend a aussi /auth/forgot-password qui peut être utilisé si on veut un email custom.
   */
  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Crée un patient. Appelé par un médecin — qui devient automatiquement le
   * médecin traitant — ou par l'administration, qui doit alors désigner ce
   * médecin via `medecinId`.
   *
   * Aucun mot de passe n'est transmis : le backend en génère un et l'envoie
   * par email au patient. Celui qui crée le compte ne le connaît donc jamais.
   */
  async registerPatient(
    email: string,
    tel: string,
    extra?: IdentiteCompte & { medecinId?: string },
  ): Promise<CreationCompte> {
    const response = await this.api.post('/auth/register-patient', {
      email, tel, ...extra,
    });
    return response.data;
  }

  /** Mot de passe généré et envoyé par le backend — voir registerPatient. */
  async registerMedecin(
    email: string,
    tel: string,
    spec: string[],
    ordre: string,
    extra?: IdentiteCompte,
  ): Promise<Medecin & CreationCompte> {
    const response = await this.api.post<Medecin & CreationCompte>('/auth/register-medecin', {
      email, tel, spec, ordre, ...extra,
    });
    return response.data;
  }

  /**
   * Crée un compte d'administration. `role` vaut 'admin' par défaut ; un
   * superadmin peut aussi créer un pair en passant 'superadmin'.
   *
   * Mot de passe généré et envoyé par le backend — voir registerPatient.
   */
  async registerAdmin(
    email: string,
    tel: string,
    nom: string,
    prenom: string,
    extra?: Omit<IdentiteCompte, 'nom' | 'prenom'> & { role?: 'admin' | 'superadmin' },
  ): Promise<User & CreationCompte> {
    const response = await this.api.post<User & CreationCompte>('/auth/register-admin', {
      email, tel, nom, prenom, ...extra,
    });
    return response.data;
  }

  /**
   * Remplace son propre mot de passe.
   *
   * Le passage par le backend (et non `updatePassword` du SDK Firebase client)
   * permet de basculer `proposerChangementMotDePasse` à false dans le même
   * échange : en deux appels séparés, un réseau coupé entre les deux laisserait
   * un compte dont le mot de passe a changé mais à qui l'application reposerait
   * la question à chaque ouverture.
   */
  async changerMotDePasse(nouveauMotDePasse: string): Promise<void> {
    await this.api.post('/auth/motdepasse', { nouveauMotDePasse });
  }

  /**
   * Décline la proposition : le titulaire garde le mot de passe reçu par email.
   *
   * Réponse aussi valable que le changement — celui reçu est un vrai mot de
   * passe, pas un code provisoire. On enregistre seulement que la question a
   * été posée, pour ne pas la reposer à chaque connexion.
   */
  async conserverMotDePasse(): Promise<void> {
    await this.api.post('/auth/motdepasse/conserver');
  }

  /**
   * Renvoie ses identifiants au titulaire d'un compte, avec un NOUVEAU mot de
   * passe — l'ancien est irrécupérable, Firebase n'en garde qu'une empreinte.
   *
   * Sert quand l'email de création n'est jamais arrivé : SMTP tombé, message
   * classé en indésirables, adresse corrigée depuis. Les sessions ouvertes du
   * compte sont révoquées au passage.
   */
  async renvoyerIdentifiants(uid: string): Promise<{ email: string; emailEnvoye: boolean }> {
    const response = await this.api.post(`/auth/users/${uid}/renvoyer-identifiants`);
    return response.data;
  }

  /** Profil d'un compte (document `users`). */
  async getProfile(uid: string): Promise<User> {
    const response = await this.api.get<User>(`/auth/profile/${uid}`);
    return response.data;
  }

  /**
   * Met à jour l'état civil, le téléphone et la photo d'un compte.
   *
   * Seuls les champs fournis sont modifiés : omettre `photo` laisse la photo
   * actuelle en place, alors que la passer à '' la supprime.
   */
  async updateProfile(
    uid: string,
    donnees: {
      nom?: string; prenom?: string; tel?: string; photo?: PhotoEnvoyee;
      sexe?: Sexe | ''; adresse?: string; dateNaissance?: string;
    },
  ): Promise<User> {
    const response = await this.api.patch<User>(`/auth/profile/${uid}`, donnees);
    return response.data;
  }

  /**
   * Liste paginée des utilisateurs. `q` cherche dans le nom, le prénom, l'email
   * et le téléphone (insensible à la casse et aux accents).
   *
   * `role` accepte un tableau pour regrouper plusieurs niveaux dans une même
   * liste (ex: `['admin', 'superadmin']`).
   *
   * `all: true` désactive la pagination et renvoie tous les comptes — à réserver
   * aux sélecteurs, où une troncature passerait inaperçue et serait un bug.
   */
  async listUsers(
    role?: UserRole | UserRole[],
    options?: { q?: string; page?: number; limit?: number; all?: boolean },
  ): Promise<PageUtilisateurs> {
    // Plusieurs rôles sont transmis en une seule valeur séparée par des
    // virgules, forme attendue par le backend.
    const roles = Array.isArray(role) ? role.join(',') : role;

    const response = await this.api.get<PageUtilisateurs>('/auth/users', {
      params: {
        ...(roles ? { role: roles } : {}),
        ...(options?.q ? { q: options.q } : {}),
        ...(options?.all ? { all: 'true' } : {}),
        ...(options?.page ? { page: options.page } : {}),
        ...(options?.limit ? { limit: options.limit } : {}),
      },
    });
    return response.data;
  }

  async toggleUserStatut(uid: string): Promise<{ uid: string; statut: 'actif' | 'inactif' }> {
    const response = await this.api.patch(`/auth/users/${uid}/statut`);
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch {
      console.warn("Le serveur n'a pas pu révoquer le token, déconnexion locale forcée.");
    } finally {
      await signOut(auth);
      console.log("✅ Déconnecté localement");
    }
  }
}

export const authService = new AuthService();
