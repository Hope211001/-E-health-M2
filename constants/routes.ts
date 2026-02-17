export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
  },
  MEDECIN: {
    REGISTER: "/(medecin)/register-medecin",
    HOME: "/(medecin)",
    PATIENT: {
      LISTE:"/(medecin)/patient/list-patient",
    },
    ORDONNANCE:{
      ADD:"/(medecin)/ordonnance/add-ordonnance",
      LISTE: "/(medecin)/ordonnance/list-ordonnance",
    },
    PROFIL: "/(medecin)/profil",
  },
  PATIENT: {
    REGISTER: "/(patient)/register-patient",
    HOME: "/(patient)", 
    MES_RAPPELS: "/(patient)/rappels",
  }
} as const;