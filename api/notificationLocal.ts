import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { prescriptionService } from './prescriptionService';
import { empiler, rejouer, type PriseEnAttente } from './prisesEnAttente';

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
 * Transmet une prise au serveur, ou la met en file d'attente si l'envoi échoue.
 *
 * Toujours par le CONTEXTE (prescription + moment + médicament) et non par un
 * identifiant d'alerte : une notification est programmée sur le téléphone au
 * démarrage du traitement, bien avant de savoir quel id le serveur donnera à
 * l'alerte du jour.
 */
async function declarerPrise(prise: PriseEnAttente | Omit<PriseEnAttente, 'declareeLe'>) {
  try {
    await prescriptionService.marquerPrisParContexte({
      prescriptionId: prise.prescriptionId,
      moment: prise.moment,
      nomMedicament: prise.nomMedicament,
    });
  } catch (e) {
    // Le patient a appuyé depuis le volet de notifications, sans ouvrir l'app :
    // aucun message d'erreur ne peut lui être montré. Perdre la déclaration
    // ferait basculer l'alerte en « manqué » alors qu'il a bien répondu.
    console.warn('Prise non transmise, mise en attente :', e);
    await empiler({
      prescriptionId: prise.prescriptionId,
      moment: prise.moment,
      nomMedicament: prise.nomMedicament,
    });
  }
}

/**
 * Rejoue les prises déclarées hors ligne. À appeler au démarrage de
 * l'application, quand le réseau est en général revenu.
 */
export async function transmettrePrisesEnAttente(): Promise<void> {
  await rejouer(declarerPrise);
}

/**
 * Écoute les réponses aux notifications de rappel. À appeler une fois au
 * démarrage (voir app/_layout.tsx). Retourne une fonction de nettoyage, ou
 * undefined en Expo Go.
 *
 * Trois gestes, trois significations distinctes — la nuance est le cœur de la
 * fiabilité de l'observance :
 *
 *   - « ✅ J'ai pris »  → déclaration explicite du patient : l'alerte passe à
 *                         `pris` côté serveur, sans ouvrir l'application ;
 *   - appui sur le corps → « je veux voir » : l'app s'ouvre sur les rappels du
 *                         jour, rien n'est enregistré ;
 *   - balayer la notification → « pas maintenant » : l'alarme se tait, rien de
 *                         plus. Faire compter ce geste comme une prise
 *                         gonflerait l'observance d'un réflexe — on écarte une
 *                         notification en réunion ou la nuit sans avoir avalé
 *                         quoi que ce soit — et le médecin croirait un
 *                         traitement suivi alors qu'il ne l'est pas.
 */
export function setupRappelResponseHandler(
  onOuvrirRappels?: () => void,
): (() => void) | undefined {
  if (!Notifications) return undefined;

  const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as {
      prescriptionId?: string;
      moment?: string;
      nomMedicament?: string;
    };

    if (response.actionIdentifier === ACTION_PRIS) {
      // Coupe l'alarme AVANT l'appel réseau : celui-ci peut durer, et une
      // alarme qui continue de sonner pendant ce temps donne l'impression que
      // l'appui n'a pas été pris en compte.
      const notifId = response.notification.request.identifier;
      await Notifications?.dismissNotificationAsync(notifId).catch(() => { });

      if (data?.prescriptionId) {
        await declarerPrise({
          prescriptionId: data.prescriptionId,
          moment: data.moment,
          nomMedicament: data.nomMedicament,
        });
      }
      return;
    }

    // Appui sur le corps de la notification : on ouvre la liste du jour, sans
    // rien déclarer — le patient vient consulter, pas confirmer.
    if (response.actionIdentifier === Notifications!.DEFAULT_ACTION_IDENTIFIER) {
      onOuvrirRappels?.();
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

    // Doit refléter exactement ce que le serveur a créé comme alertes (voir
    // startPrescription) : les prises déjà passées le jour du démarrage sont
    // sautées — `buildTriggerDate` renvoie null pour une heure écoulée — et le
    // compte est rattrapé sur un jour supplémentaire. Sans ce report, un
    // traitement démarré le soir aurait des alertes serveur sans rappel sur le
    // téléphone les derniers jours.
    const dosesAttendues = dureeMed * moments.length;
    let programmees = 0;

    for (let jour = 0; jour <= dureeMed && programmees < dosesAttendues; jour++) {
      for (const moment of moments) {
        if (programmees >= dosesAttendues) break;

        const id = await scheduleAlerteNotification({
          prescriptionId: p.prescriptionId,
          nomMedicament: med.nomMedicament,
          dosage: med.dosage || '',
          moment,
          heurePrevu: p.horaires[moment],
          jourOffset: jour,
        });
        // `null` = heure déjà écoulée : la prise n'est pas comptée, elle sera
        // reportée sur le jour supplémentaire.
        if (id) { ids.push(id); programmees++; }
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
