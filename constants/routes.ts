export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
  },
  MEDECIN: {
    REGISTER: "/(medecin)/register-medecin",
    HOME: "/(medecin)",
    PATIENT: {
      LISTE:"/(medecin)/patient/list-patient",
      ADD:"/(medecin)/patient/add-patient",
    },
    ORDONNANCE:{
      ADD:"/(medecin)/ordonnance/add-ordonnance",
      ADD_BY_PATIENT:"/(medecin)/ordonnance/add-ordonnance-by-patient",
      LISTE: "/(medecin)/ordonnance/list-ordonnance",
      LISTE_BY_PATIENT:"/(medecin)/ordonnance/list-ordonnance-by-patient",
      DETAIL:"/(medecin)/ordonnance/detail-ordonnance",
    },
    PROFIL: "/(medecin)/profil",
  },
  PATIENT: {
    REGISTER: "/(patient)/register-patient",
    HOME: "/(patient)", 
    MES_RAPPELS: "/(patient)/rappels",
  }
} as const;