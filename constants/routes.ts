export const APP_ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login",
    REGISTER: "/(auth)/register-medecin",
    FORGOT_PASSWORD: "/(auth)/forgot-password",
    /**
     * Choix du mot de passe définitif, imposé tant que `motDePasseTemporaire`
     * est vrai. Voir components/GardeMotDePasse.tsx.
     */
    CHANGER_MOT_DE_PASSE: "/(auth)/changer-mot-de-passe",
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
    // Écran unique regroupant médecins, patients et (superadmin) admins.
    // Accepte ?role=medecin|patient|admin pour ouvrir directement le bon onglet.
    UTILISATEURS: "/(admin)/(tabs)/utilisateurs",
    PROFIL: "/(admin)/(tabs)/profil",
    MEDECIN_ADD: "/(admin)/(tabs)/medecin-add",
    PATIENT_ADD: "/(admin)/(tabs)/patient-add",
    ADMIN_ADD: "/(admin)/(tabs)/admin-add",
    PHARMACIE_GARDE: "/(admin)/(tabs)/pharmacie-garde",
    PHARMACIE_GARDE_FORM: "/(admin)/(tabs)/pharmacie-garde-form",
    PHARMACIE_GARDE_DETAIL: "/(admin)/(tabs)/pharmacie-garde-detail",
    // Écran OCR d'une publication : attend ?id=<pharmacieGardeId>
    OCR: "/(admin)/(tabs)/ocr",
    // Dossiers consultés par l'administration : attendent ?id=<uid>
    DOSSIER_PATIENT: "/(admin)/(tabs)/dossier-patient",
    DOSSIER_MEDECIN: "/(admin)/(tabs)/dossier-medecin",
    GRAPHES: "/(admin)/(tabs)/graphes",
  },
} as const;
