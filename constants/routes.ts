export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/",
    REGISTER: "/register",
  },
  MEDECIN: {
    HOME: "/(medecin)",
    LISTE_PATIENTS: "/(medecin)/patients",
    AJOUT_ORDONNANCE: "/(medecin)/ajout_ordonnance",
    PROFIL: "/(medecin)/profil",
  },
  PATIENT: {
    HOME: "/(patient)",
    MES_RAPPELS: "/(patient)/rappels",
  }
} as const;