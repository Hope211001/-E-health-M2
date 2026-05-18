/**
 * Service de récupération des pharmacies de Madagascar
 * via l'API Overpass (OpenStreetMap). 100% gratuit, sans clé API.
 *
 * Doc : https://wiki.openstreetmap.org/wiki/Overpass_API
 */

export interface Pharmacy {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  street?: string;
  phone?: string;
  openingHours?: string;
  operator?: string;
}

// Plusieurs miroirs Overpass publics — on bascule sur le suivant si l'un répond
// avec un code d'erreur (saturation, 406, 429, etc.).
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Bounding box approximative de Madagascar : sud, ouest, nord, est
// Beaucoup plus rapide qu'une requête sur l'aire entière par code ISO.
const MG_BBOX = '-25.7,43.2,-11.9,50.5';

const QUERY = `
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](${MG_BBOX});
  way["amenity"="pharmacy"](${MG_BBOX});
);
out center tags;
`.trim();

// Timeout par endpoint côté client (en ms) — bascule rapidement si serveur lent
const CLIENT_TIMEOUT_MS = 20000;

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

async function fetchFromOverpass(): Promise<OverpassResponse> {
  let lastError: unknown = null;

  for (const baseUrl of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    // GET avec data en query string — format le plus largement supporté
    const url = `${baseUrl}?data=${encodeURIComponent(QUERY)}`;

    try {
      // Pas de header Accept : la requête [out:json] détermine déjà le format
      // de réponse côté serveur. Forcer Accept: application/json déclenche un 406.
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        return (await response.json()) as OverpassResponse;
      }

      // Log du body pour comprendre l'erreur
      let body = '';
      try { body = (await response.text()).slice(0, 200); } catch {}
      lastError = new Error(`Overpass ${baseUrl}: ${response.status} ${body}`);
      console.warn(`Overpass ${baseUrl} → ${response.status} — ${body}`);
    } catch (e: any) {
      clearTimeout(timer);
      lastError = e;
      const reason = e?.name === 'AbortError' ? 'timeout' : e?.message || e;
      console.warn(`Overpass ${baseUrl} a échoué : ${reason}`);
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Tous les serveurs Overpass sont indisponibles (${lastError.message})`
      : 'Tous les serveurs Overpass sont indisponibles',
  );
}

export async function fetchPharmacies(): Promise<Pharmacy[]> {
  const data = await fetchFromOverpass();

  return data.elements
    .map((el): Pharmacy | null => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) return null;

      const tags = el.tags || {};
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name || tags['name:fr'] || 'Pharmacie',
        lat,
        lng,
        city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
        street: tags['addr:street'],
        phone: tags.phone || tags['contact:phone'],
        openingHours: tags.opening_hours,
        operator: tags.operator,
      };
    })
    .filter((p): p is Pharmacy => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filtre les pharmacies par ville ou nom (insensible à la casse / aux accents).
 */
export function filterPharmacies(list: Pharmacy[], query: string): Pharmacy[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nq = normalize(q);
  return list.filter((p) => {
    const haystack = normalize(`${p.name} ${p.city || ''} ${p.street || ''}`);
    return haystack.includes(nq);
  });
}
