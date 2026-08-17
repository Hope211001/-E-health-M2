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
      // Fiche d'un patient : attend ?id=<id du document patients>
      DETAIL: "/(medecin)/(tabs)/patient/detail",
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
    // Fiche d'un compte d'administration : attend ?id=<uid>. Distincte des
    // dossiers, un compte admin n'ayant ni patients ni ordonnances.
    COMPTE_DETAIL: "/(admin)/(tabs)/compte-detail",
    GRAPHES: "/(admin)/(tabs)/graphes",
    // Structures de santé enrôlées dans la plateforme — superadmin uniquement.
    ETABLISSEMENTS: "/(admin)/(tabs)/etablissements",
    // Enrôlement ou modification : ?id=<etablissementId> bascule en édition.
    ETABLISSEMENT_FORM: "/(admin)/(tabs)/etablissement-form",
    // Transfert d'un patient vers un autre établissement : attend ?id=<uid>
    PATIENT_TRANSFERT: "/(admin)/(tabs)/patient-transfert",
  },
} as const;
