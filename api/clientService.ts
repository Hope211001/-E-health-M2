import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase';

// IP locale du backend — configurable via .env.local (EXPO_PUBLIC_API_BASE_URL),
// valeur par défaut en secours. À changer quand tu changes de réseau/PC.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.0.148:5000/api';

export class ClientService {
    protected api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: { 'Content-Type': 'application/json' }
        });

        this.api.interceptors.request.use(async (config) => {
            try {
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