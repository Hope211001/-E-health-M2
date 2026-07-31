import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Génération / impression PDF d'une ordonnance.
 *
 * Sur mobile on ouvre directement la boîte de dialogue système d'impression
 * (AirPrint sur iOS, service d'impression Android) qui permet aussi
 * « Enregistrer en PDF ». Sur le web, expo-print ouvre l'aperçu du navigateur.
 */

type Medicament = {
  nomMedicament?: string;
  dosage?: string;
  frequence?: string;
  duree?: string | number;
  instructions?: string;
};

export type OrdonnanceAImprimer = {
  id?: string;
  dateCreation?: any;
  dateDebut?: any;
  dateFin?: any;
  diagnostic?: string;
  observations?: string;
  statut?: string;
  medicaments?: Medicament[];
  /** Libellé du patient (n° patient, nom ou email) */
  patientLabel?: string;
  /** Nom du médecin prescripteur */
  medecinLabel?: string;
};

/**
 * Formate une date en français, quelle que soit sa provenance :
 * Timestamp Firestore client (.toDate), Timestamp sérialisé par le backend
 * ({_seconds}), chaîne ISO ou objet Date.
 */
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '—';
  let date: Date;
  if (typeof dateInput?.toDate === 'function') {
    date = dateInput.toDate();
  } else {
    date = new Date(dateInput);
    const seconds = dateInput?._seconds ?? dateInput?.seconds;
    if (isNaN(date.getTime()) && seconds) date = new Date(seconds * 1000);
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Neutralise le HTML pour éviter qu'une saisie médecin casse le document. */
const escapeHtml = (value: any): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Construit le HTML de l'ordonnance (format A4). */
export const buildOrdonnanceHtml = (ord: OrdonnanceAImprimer): string => {
  const medicaments = ord.medicaments?.length
    ? ord.medicaments
        .map(
          (med, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td>
              <div class="med-nom">${escapeHtml(med.nomMedicament)}</div>
              ${med.instructions ? `<div class="med-note">${escapeHtml(med.instructions)}</div>` : ''}
            </td>
            <td>${escapeHtml(med.dosage) || '—'}</td>
            <td>${escapeHtml(med.frequence) || '—'}</td>
            <td>${med.duree ? `${escapeHtml(med.duree)} jour(s)` : '—'}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="vide">Aucun médicament prescrit</td></tr>`;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0f172a; margin: 0; padding: 32px 36px;
        }
        .entete {
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px;
        }
        .marque { font-size: 26px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
        .sous-marque { font-size: 11px; color: #64748b; margin-top: 2px; }
        .meta { text-align: right; font-size: 11px; color: #475569; line-height: 1.6; }
        .meta b { color: #0f172a; }
        .titre {
          text-align: center; font-size: 15px; font-weight: 800; letter-spacing: 3px;
          text-transform: uppercase; color: #0f172a; margin: 8px 0 24px;
        }
        .blocs { display: flex; gap: 16px; margin-bottom: 24px; }
        .bloc {
          flex: 1; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 12px 14px; background: #f8fafc;
        }
        .label {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;
        }
        .valeur { font-size: 13px; font-weight: 600; }
        .diagnostic { font-size: 13px; font-style: italic; color: #334155; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th {
          text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;
          color: #ffffff; background: #059669; padding: 9px 10px;
        }
        td { padding: 11px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
        .num { width: 26px; color: #94a3b8; font-weight: 700; }
        .med-nom { font-weight: 700; font-size: 13px; }
        .med-note { font-size: 10px; color: #64748b; margin-top: 3px; font-style: italic; }
        .vide { text-align: center; color: #94a3b8; font-style: italic; }
        .signature { margin-top: 56px; text-align: right; font-size: 11px; color: #475569; }
        .trait { display: inline-block; width: 190px; border-top: 1px solid #94a3b8; margin-top: 46px; padding-top: 6px; }
        .pied {
          margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0;
          font-size: 9px; color: #94a3b8; text-align: center; line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="entete">
        <div>
          <div class="marque">Mediora</div>
          <div class="sous-marque">Plateforme de suivi médical</div>
        </div>
        <div class="meta">
          <div>Émise le <b>${formatDate(ord.dateCreation)}</b></div>
          ${ord.id ? `<div>Réf. ${escapeHtml(ord.id).slice(0, 10).toUpperCase()}</div>` : ''}
        </div>
      </div>

      <div class="titre">Ordonnance médicale</div>

      <div class="blocs">
        <div class="bloc">
          <div class="label">Patient</div>
          <div class="valeur">${escapeHtml(ord.patientLabel) || 'Non renseigné'}</div>
        </div>
        <div class="bloc">
          <div class="label">Médecin prescripteur</div>
          <div class="valeur">${escapeHtml(ord.medecinLabel) || 'Non renseigné'}</div>
        </div>
        <div class="bloc">
          <div class="label">Période de traitement</div>
          <div class="valeur">${formatDate(ord.dateDebut)} → ${formatDate(ord.dateFin)}</div>
        </div>
      </div>

      <div class="bloc" style="margin-bottom: 24px;">
        <div class="label">Diagnostic</div>
        <div class="diagnostic">${escapeHtml(ord.diagnostic) || 'Aucune observation particulière.'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Médicament</th>
            <th>Dosage</th>
            <th>Fréquence</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>${medicaments}</tbody>
      </table>

      ${
        ord.observations
          ? `<div class="bloc" style="margin-top: 24px;">
               <div class="label">Observations</div>
               <div class="diagnostic">${escapeHtml(ord.observations)}</div>
             </div>`
          : ''
      }

      <div class="signature">
        <div class="trait">Signature et cachet du médecin</div>
      </div>

      <div class="pied">
        Document généré par Mediora — à présenter en pharmacie.<br />
        Ne pas modifier les doses sans avis médical.
      </div>
    </body>
  </html>`;
};

/** Ouvre la boîte de dialogue d'impression système pour l'ordonnance. */
export const imprimerOrdonnance = async (ord: OrdonnanceAImprimer): Promise<void> => {
  await Print.printAsync({ html: buildOrdonnanceHtml(ord) });
};

/**
 * Génère un PDF puis ouvre la feuille de partage (mail, WhatsApp, Drive…).
 * Sur le web, expo-sharing n'existe pas : on retombe sur l'impression.
 */
export const partagerOrdonnancePdf = async (ord: OrdonnanceAImprimer): Promise<void> => {
  if (Platform.OS === 'web') {
    await imprimerOrdonnance(ord);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html: buildOrdonnanceHtml(ord) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await imprimerOrdonnance(ord);
  }
};
