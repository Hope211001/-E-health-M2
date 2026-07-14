/**
 * Barrel de typage pour le composant à variante de plateforme.
 *
 * À l'exécution, Metro charge automatiquement `PharmaciesMap.native.tsx`
 * (mobile) ou `PharmaciesMap.web.tsx` (web) — ce fichier `.ts` n'est utilisé
 * que par TypeScript pour résoudre l'import `../../components/PharmaciesMap`.
 */
export { default } from './PharmaciesMap.native';
export type { PharmaciesMapHandle, UserLocation } from './PharmaciesMap.native';
