import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase'; 

export class ClientService {
    protected api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: 'http://192.168.0.148:5000/api',
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