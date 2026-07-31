import { Platform } from 'react-native';

/**
 * Mediora — Système de design centralisé
 * Mediora = médicament + « ora » (heure, en malgache) :
 * le bon médicament, à la bonne heure.
 *
 * Toute couleur utilisée dans l'app DOIT venir d'ici. Ne hardcode pas
 * de valeurs hex dans les écrans.
 */

export const APP = {
  name: 'Mediora',
  tagline: 'Le bon médicament, à la bonne heure',
  description:
    "Plateforme médicale connectée pour les médecins et leurs patients à Madagascar.",
} as const;

/** Palette principale — vert santé */
export const Colors = {
  // Vert principal (médecin, marque)
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#10B981',
  primarySoft: '#D1FAE5',
  primaryBg: '#F0FDF4',

  // Bleu patient (clair, apaisant)
  patient: '#0EA5E9',
  patientLight: '#38BDF8',
  patientSoft: '#E0F2FE',
  patientBg: '#F0F9FF',

  // Vert admin / superadmin — même famille que le vert de marque (cohérence
  // avec patient/médecin), avec un accent ambré complémentaire pour les CTA
  // et les mises en avant (variété visuelle, façon bandeaux multicolores du
  // dashboard patient).
  admin: '#059669',
  adminDark: '#047857',
  adminSoft: '#D1FAE5',
  adminBg: '#F0FDF4',
  adminAccent: '#D97706',
  adminAccentDark: '#B45309',
  adminAccentSoft: '#FEF3C7',
  adminAccentBg: '#FFFBEB',

  // Texte
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Fonds & surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',

  // Bordures
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Statuts sémantiques
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  // Ombres (à utiliser avec shadowColor)
  shadowPrimary: '#059669',
  shadowSoft: '#0F172A',
} as const;

/** Mapping rôle → couleur principale (très utile pour theming dynamique) */
export const ROLE_COLORS = {
  medecin: Colors.primary,
  patient: Colors.patient,
  admin: Colors.admin,
  superadmin: Colors.admin,
} as const;

/** Espacements standards (multiples de 4) */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

/** Radius standardisés */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

/** Échelle typographique */
export const Typography = {
  display: { fontSize: 36, fontWeight: '900' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '800' as const },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '700' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

/** Ombres pré-composées */
export const Shadows = {
  sm: {
    shadowColor: Colors.shadowSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadowSoft,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  primary: {
    shadowColor: Colors.shadowPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
