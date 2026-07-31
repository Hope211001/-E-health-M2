export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
    REGISTER: "/(auth)/register-medecin",
    FORGOT_PASSWORD: "/(auth)/forgot-password",
  },
  MEDECIN: {
    REGISTER: "/(medecin)/register-medecin",
    HOME: "/(medecin)/(tabs)",
    PATIENT: {
      LISTE: "/(medecin)/(tabs)/patient/list",
      ADD: "/(medecin)/(tabs)/patient/add",
    },
    ORDONNANCE: {
      ADD: "/(medecin)/(tabs)/ordonnance/add",
      ADD_BY_PATIENT: "/(medecin)/(tabs)/ordonnance/add-by-patient",
      HISTORY: "/(medecin)/(tabs)/ordonnance/history",
      DETAIL: "/(medecin)/(tabs)/ordonnance/detail",
    },
    PARAMETRE: {
      PROFIL: "/(medecin)/(tabs)/parametre/profil",
    },
  },
  PATIENT: {
    REGISTER: "/(patient)/register-patient",
    HOME: "/(patient)/(tabs)",
    MES_RAPPELS: "/(patient)/(tabs)/rappels",
    PHARMACIES_GARDE: "/(patient)/(tabs)/pharmacies",
    PHARMACIES_MAP: "/(patient)/pharmacies-map",
  },
  ADMIN: {
    HOME: "/(admin)/(tabs)",
    MEDECINS: "/(admin)/(tabs)/medecins",
    MEDECIN_ADD: "/(admin)/(tabs)/medecin-add",
    ADMINS: "/(admin)/(tabs)/admins",
    ADMIN_ADD: "/(admin)/(tabs)/admin-add",
    PATIENTS: "/(admin)/(tabs)/patients",
    PHARMACIE_GARDE: "/(admin)/(tabs)/pharmacie-garde",
    PHARMACIE_GARDE_FORM: "/(admin)/(tabs)/pharmacie-garde-form",
    PHARMACIE_GARDE_DETAIL: "/(admin)/(tabs)/pharmacie-garde-detail",
    GRAPHES: "/(admin)/graphes",
  },
} as const;
