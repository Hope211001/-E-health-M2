import { ClientService } from './clientService';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { User, Medecin } from '../types/collection';

class AuthService extends ClientService {

  async login(email: string, pass: string): Promise<User> {
    // ÉTAPE 1 : Connexion côté Client (Firebase Auth)
    // Cela permet de valider le mot de passe et de générer un Token
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);

    if (!userCredential.user) {
      throw new Error("Erreur de connexion Firebase");
    }

    // ÉTAPE 2 : Appel à ton Backend Express
    // L'intercepteur va maintenant détecter l'utilisateur connecté et ajouter le Token
    // On n'envoie plus le password au backend, le Token suffit !
    const response = await this.api.post<User>('/auth/login');

    return response.data;
  }

  async registerPatient(email: string, pass: string, tel: string) {
    // Ici, l'intercepteur utilisera le token du MEDECIN connecté
    const response = await this.api.post('/auth/register-patient', {
      email,
      password: pass,
      tel
    });
    return response.data;
  }

  async registerMedecin(email: string, pass: string, tel: string, spec: string[], ordre: string): Promise<Medecin> {
    // Inscription libre (pas besoin de token pour cette route en général)
    const response = await this.api.post<Medecin>('/auth/register-medecin', {
      email,
      password: pass,
      tel,
      spec,
      ordre
    });
    return response.data;
  }

  async logout() {
    try {
      // 1. Prévenir le backend (pour révoquer le token)
      await this.api.post('/auth/logout');
    } catch (error) {
      console.warn("Le serveur n'a pas pu révoquer le token, déconnexion locale forcée.");
    } finally {
      // 2. Déconnexion locale de Firebase (supprime le token du storage de l'app)
      await signOut(auth);
      console.log("✅ Déconnecté localement");
    }
  }
}

export const authService = new AuthService();