import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Détecte si on tourne dans Expo Go (l'app jaune) — depuis SDK 53, expo-notifications
// n'y est plus supporté et l'import au top-level crashe. On charge donc le module
// uniquement dans un build natif (APK / dev-client).
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Son de l'alarme = fichier assets/sounds/alarme.wav (empaqueté via app.json).
// ⚠️ Le fichier DOIT exister avant le build, sinon `eas build` échoue.
// Repasser à 'default' (son court système) si tu retires le fichier.
const ALARM_SOUND = 'alarme.wav';

// Id du canal Android. Android fige les réglages d'un canal à sa création :
// bumpe le suffixe (-v4, -v5…) à chaque fois que tu changes le son ou les
// réglages du canal, sinon l'ancien canal garde ses anciens réglages.
const CHANNEL_ID = 'rappels-medicaments-v3';

// Catégorie qui porte le bouton d'action « J'ai pris ».
const CATEGORY_ID = 'rappel-medicament';
const ACTION_PRIS = 'MARQUER_PRIS';

// Lazy import : ne charge expo-notifications que si on est dans un vrai build.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  if (!isExpoGo) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn('expo-notifications non disponible dans cet environnement :', e);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) {
    console.warn('Notifications désactivées (Expo Go). Utilise un build natif.');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels de médicaments',
      importance: Notifications.AndroidImportance.MAX,
      // Vibration longue et insistante (façon alarme) plutôt qu'un buzz court.
      vibrationPattern: [0, 500, 500, 500, 500, 500, 500],
      enableVibrate: true,
      lightColor: '#4F46E5',
      sound: ALARM_SOUND,
      // Sonne même si le téléphone est en mode « Ne pas déranger ».
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  // Bouton « J'ai pris » (permet de couper/acquitter l'alarme depuis la notif).
  await registerNotificationCategories();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Déclare la catégorie qui porte le bouton d'action « J'ai pris ». */
export async function registerNotificationCategories(): Promise<void> {
  if (!Notifications) return;
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_PRIS,
      buttonTitle: '✅ J’ai pris',
      // false = on ne rouvre pas l'app, on coupe juste l'alarme.
      options: { opensAppToForeground: false },
    },
  ]);
}

/**
 * Écoute le clic sur le bouton « J'ai pris » et coupe l'alarme (retire la
 * notification). À appeler une fois au démarrage (voir app/_layout.tsx).
 * Retourne une fonction de nettoyage, ou undefined en Expo Go.
 */
export function setupRappelResponseHandler(): (() => void) | undefined {
  if (!Notifications) return undefined;

  const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
    if (response.actionIdentifier === ACTION_PRIS) {
      const notifId = response.notification.request.identifier;
      // Coupe l'alarme en retirant la notification affichée.
      await Notifications?.dismissNotificationAsync(notifId).catch(() => {});
    }
  });

  return () => sub.remove();
}

type Moment = 'matin' | 'midi' | 'soir';

interface ScheduleAlerteParams {
  prescriptionId: string;
  nomMedicament: string;
  dosage: string;
  moment: Moment;
  heurePrevu: string; // "HH:MM"
  jourOffset: number; // 0 = aujourd'hui, 1 = demain, ...
}

function buildTriggerDate(heurePrevu: string, jourOffset: number): Date | null {
  const [h, m] = heurePrevu.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const trigger = new Date();
  trigger.setDate(trigger.getDate() + jourOffset);
  trigger.setHours(h, m, 0, 0);

  if (trigger.getTime() <= Date.now()) return null;
  return trigger;
}

export async function scheduleAlerteNotification(p: ScheduleAlerteParams): Promise<string | null> {
  if (!Notifications) return null;

  const triggerDate = buildTriggerDate(p.heurePrevu, p.jourOffset);
  if (!triggerDate) return null;

  const momentLabel = p.moment.charAt(0).toUpperCase() + p.moment.slice(1);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 ${momentLabel} — ${p.heurePrevu}`,
      body: `C'est l'heure de prendre ${p.nomMedicament} (${p.dosage})`,
      data: {
        prescriptionId: p.prescriptionId,
        moment: p.moment,
        nomMedicament: p.nomMedicament,
      },
      sound: ALARM_SOUND,
      // Rattache le bouton « J'ai pris » à la notification.
      categoryIdentifier: CATEGORY_ID,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });

  return id;
}

export function parseMomentsActifs(frequence: string): Moment[] {
  if (!frequence) return [];
  const moments: Moment[] = [];
  const lower = frequence.toLowerCase();

  const matinMatch = lower.match(/matin\s*:\s*(\d+)/);
  const midiMatch = lower.match(/midi\s*:\s*(\d+)/);
  const soirMatch = lower.match(/soir\s*:\s*(\d+)/);

  if (matinMatch && parseInt(matinMatch[1]) > 0) moments.push('matin');
  if (midiMatch && parseInt(midiMatch[1]) > 0) moments.push('midi');
  if (soirMatch && parseInt(soirMatch[1]) > 0) moments.push('soir');

  return moments;
}

interface SchedulePrescriptionParams {
  prescriptionId: string;
  medicaments: { nomMedicament: string; dosage?: string; frequence?: string; duree?: number }[];
  horaires: { matin: string; midi: string; soir: string };
  dureeDefaut: number;
}

export async function schedulePrescriptionNotifications(
  p: SchedulePrescriptionParams
): Promise<{ count: number; ids: string[] }> {
  const ids: string[] = [];

  if (!Notifications) return { count: 0, ids };

  for (const med of p.medicaments) {
    const moments = parseMomentsActifs(med.frequence || '');
    if (moments.length === 0) continue;

    const dureeMed = parseInt(String(med.duree)) || p.dureeDefaut;

    for (let jour = 0; jour < dureeMed; jour++) {
      for (const moment of moments) {
        const id = await scheduleAlerteNotification({
          prescriptionId: p.prescriptionId,
          nomMedicament: med.nomMedicament,
          dosage: med.dosage || '',
          moment,
          heurePrevu: p.horaires[moment],
          jourOffset: jour,
        });
        if (id) ids.push(id);
      }
    }
  }

  return { count: ids.length, ids };
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Annule uniquement les rappels programmés d'une prescription donnée (les autres traitements en cours ne sont pas touchés). */
export async function cancelPrescriptionNotifications(prescriptionId: string): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.content?.data?.prescriptionId === prescriptionId);
  await Promise.all(toCancel.map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier)));
}
