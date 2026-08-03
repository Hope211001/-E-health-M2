/**
 * Résout une couleur du thème, avec surcharge possible par mode clair/sombre.
 *
 * Le template Expo d'origine attendait un `Colors` structuré en `{ light, dark }`.
 * Le thème du projet (`constants/theme.ts`) est une palette unique et plate : on
 * lit donc directement dedans, et le mode ne sert plus qu'à choisir entre les
 * surcharges `light` / `dark` éventuellement passées par l'appelant.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const theme = useColorScheme() ?? 'light';
  return props[theme] ?? Colors[colorName];
}
