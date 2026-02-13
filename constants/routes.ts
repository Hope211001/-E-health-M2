export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
  },
  MEDECIN: {
    REGISTER: "/(medecin)/register-medecin",
    HOME: "/(medecin)",
    LISTE_PATIENTS: "/(medecin)/patients",
    AJOUT_ORDONNANCE: "/(medecin)/ajout_ordonnance",
    PROFIL: "/(medecin)/profil",
  },
  PATIENT: {
    REGISTER: "/(patient)/register-patient",
    HOME: "/(patient)", 
    MES_RAPPELS: "/(patient)/rappels",
  }
} as const;