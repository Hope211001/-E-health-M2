export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
    REGISTER: "/(auth)/register-medecin",
    FORGOT_PASSWORD: "/(auth)/forgot-password",
  },
  MEDECIN: {
    REGISTER: "/(medecin)/register-medecin",
    HOME: "/(medecin)",
    PATIENT: {
      LISTE: "/(medecin)/patient/list",
      ADD: "/(medecin)/patient/add",
    },
    ORDONNANCE: {
      ADD: "/(medecin)/ordonnance/add",
      ADD_BY_PATIENT: "/(medecin)/ordonnance/add-by-patient",
      HISTORY: "/(medecin)/ordonnance/history",
      DETAIL: "/(medecin)/ordonnance/detail",
    },
    PARAMETRE: {
      PROFIL: "/(medecin)/parametre/profil",
    },
  },
  PATIENT: {
    REGISTER: "/(patient)/register-patient",
    HOME: "/(patient)",
    MES_RAPPELS: "/(patient)/rappels",
  },
  ADMIN: {
    HOME: "/(admin)",
    MEDECINS: "/(admin)/medecins",
    MEDECIN_ADD: "/(admin)/medecin-add",
    ADMINS: "/(admin)/admins",
    ADMIN_ADD: "/(admin)/admin-add",
    PATIENTS: "/(admin)/patients",
  },
} as const;
