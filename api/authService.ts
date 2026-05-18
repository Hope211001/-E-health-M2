import { ClientService } from './clientService';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { User, Medecin } from '../types/collection';

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

  async registerPatient(email: string, pass: string, tel: string) {
    const response = await this.api.post('/auth/register-patient', {
      email, password: pass, tel,
    });
    return response.data;
  }

  async registerMedecin(
    email: string, pass: string, tel: string, spec: string[], ordre: string
  ): Promise<Medecin> {
    const response = await this.api.post<Medecin>('/auth/register-medecin', {
      email, password: pass, tel, spec, ordre,
    });
    return response.data;
  }

  async registerAdmin(
    email: string, pass: string, tel: string, nom: string, prenom: string
  ): Promise<User> {
    const response = await this.api.post<User>('/auth/register-admin', {
      email, password: pass, tel, nom, prenom,
    });
    return response.data;
  }

  async listUsers(role?: 'medecin' | 'patient' | 'admin' | 'superadmin'): Promise<User[]> {
    const response = await this.api.get<User[]>('/auth/users', {
      params: role ? { role } : undefined,
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
