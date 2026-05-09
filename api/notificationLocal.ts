import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rappels-medicaments', {
      name: 'Rappels de médicaments',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
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
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'rappels-medicaments' : undefined,
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
  await Notifications.cancelAllScheduledNotificationsAsync();
}
