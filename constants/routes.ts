export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
    REGISTER:"/(auth)/register-medecin"
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
  }
} as const;