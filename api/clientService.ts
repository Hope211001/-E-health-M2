import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase'; // Vérifie le chemin vers ton fichier firebase

export class ClientService {
    protected api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: 'http://192.168.0.148:5000/api', // Ton IP locale
            headers: { 'Content-Type': 'application/json' }
        });

        this.api.interceptors.request.use(async (config) => {
            try {
                // On récupère le user actuel (Firebase gère le rafraîchissement auto du token)
                const user = auth.currentUser;
                
                if (user) {
                    const token = await user.getIdToken();
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log("✅ Token injecté dans la requête");
                } else {
                    console.warn("⚠️ Aucun utilisateur connecté, requête envoyée sans token.");
                }
                return config;
            } catch (error) {
                console.error("❌ Erreur Intercepteur Token:", error);
                return Promise.reject(error);
            }
        });
    }
}