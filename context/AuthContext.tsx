import React, { createContext, useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types/collection';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /**
   * Relit le document `users` du compte connecté.
   *
   * Le profil n'est chargé qu'au changement d'état d'authentification : après
   * une modification de l'état civil ou de la photo, l'en-tête et les tableaux
   * de bord afficheraient encore l'ancienne valeur jusqu'à la reconnexion.
   */
  rafraichir: () => Promise<void>;
  /**
   * Applique des champs au profil en mémoire, sans relire Firestore.
   *
   * Nécessaire quand une navigation dépend immédiatement d'un champ qu'on vient
   * de modifier côté serveur : `rafraichir()` impose un aller-retour réseau, et
   * tout ce qui réagit au profil (GardeMotDePasse) verrait encore l'ancienne
   * valeur pendant ce laps de temps.
   *
   * À n'utiliser que lorsque le serveur a confirmé l'écriture — sinon l'écran
   * afficherait un état que la base ne partage pas.
   */
  majLocale: (champs: Partial<User>) => void;
}

// AJOUT DE "export" ICI pour que le hook puisse le voir
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  rafraichir: async () => {},
  majLocale: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const chargerProfil = useCallback(async (uid: string) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) setUser(docSnap.data() as User);
  }, []);

  const majLocale = useCallback((champs: Partial<User>) => {
    setUser((precedent) => (precedent ? { ...precedent, ...champs } : precedent));
  }, []);

  const rafraichir = useCallback(async () => {
    const courant = auth.currentUser;
    if (!courant) return;
    try {
      await chargerProfil(courant.uid);
    } catch (error) {
      console.error('Erreur rafraîchissement profil:', error);
    }
  }, [chargerProfil]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await chargerProfil(firebaseUser.uid);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur AuthContext:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [chargerProfil]);

  return (
    <AuthContext.Provider value={{ user, loading, rafraichir, majLocale }}>
      {children}
    </AuthContext.Provider>
  );
};