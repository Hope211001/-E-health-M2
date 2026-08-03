import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prescription } from '../types/collection';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * Formate un Timestamp Firestore ({_seconds}/{seconds}), une chaîne ISO ou une
 * Date en "JJ/MM/AAAA". Renvoie null si la valeur est inexploitable.
 */
export function formatDateCourte(ts: any): string | null {
  if (!ts) return null;
  let d: Date | null = null;
  if (typeof ts === 'object') {
    const seconds = ts._seconds ?? ts.seconds;
    if (seconds != null) d = new Date(seconds * 1000);
  } else {
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Couleur et libellé associés au statut d'une prescription. */
const STATUTS: Record<string, { label: string; couleur: string; fond: string }> = {
  en_attente: { label: 'En attente', couleur: Colors.warning, fond: Colors.warningBg },
  active: { label: 'Active', couleur: Colors.info, fond: Colors.infoBg },
  en_cours: { label: 'En cours', couleur: Colors.success, fond: Colors.successBg },
  terminee: { label: 'Terminée', couleur: Colors.textMuted, fond: Colors.surfaceAlt },
  annulee: { label: 'Annulée', couleur: Colors.danger, fond: Colors.dangerBg },
};

/**
 * Liste de prescriptions en lecture seule, dépliable médicament par médicament.
 * Partagée par les dossiers patient et médecin de l'espace administration.
 */
export function PrescriptionsListe({
  prescriptions,
  vide = 'Aucune prescription.',
}: {
  prescriptions: Prescription[];
  vide?: string;
}) {
  const [ouvertes, setOuvertes] = useState<Record<string, boolean>>({});

  if (prescriptions.length === 0) {
    return <Text style={styles.vide}>{vide}</Text>;
  }

  return (
    <>
      {prescriptions.map((p, index) => {
        const cle = p.id ?? String(index);
        const ouverte = !!ouvertes[cle];
        const statut = STATUTS[p.statut] ?? STATUTS.en_attente;
        const debut = formatDateCourte(p.dateDebut);
        const fin = formatDateCourte(p.dateFin);
        const medicaments = Array.isArray(p.medicaments) ? p.medicaments : [];

        return (
          <View key={cle} style={styles.carte}>
            <View style={styles.entete}>
              <View style={[styles.badge, { backgroundColor: statut.fond }]}>
                <Text style={[styles.badgeTxt, { color: statut.couleur }]}>{statut.label}</Text>
              </View>
              <Text style={styles.date}>
                {formatDateCourte(p.dateCreation) ?? '—'}
              </Text>
            </View>

            <Text style={styles.diagnostic} numberOfLines={ouverte ? undefined : 2}>
              {p.diagnostic || 'Diagnostic non renseigné'}
            </Text>

            {(debut || fin) && (
              <View style={styles.ligne}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.meta}>
                  {debut ?? '?'} → {fin ?? '?'}
                  {p.duree ? ` · ${p.duree} jour${p.duree > 1 ? 's' : ''}` : ''}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.toggle}
              onPress={() => setOuvertes((o) => ({ ...o, [cle]: !o[cle] }))}
              activeOpacity={0.7}
            >
              <Ionicons name="medkit-outline" size={13} color={Colors.admin} />
              <Text style={styles.toggleTxt}>
                {medicaments.length} médicament{medicaments.length > 1 ? 's' : ''}
              </Text>
              <Ionicons
                name={ouverte ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.admin}
              />
            </TouchableOpacity>

            {ouverte && medicaments.map((m, i) => (
              <View key={m.id ?? i} style={styles.medicament}>
                <Text style={styles.medNom}>
                  {m.nomMedicament} {m.dosage ? `· ${m.dosage}` : ''}
                </Text>
                {m.frequence ? <Text style={styles.medMeta}>{m.frequence}</Text> : null}
                {m.instructions ? <Text style={styles.medMeta}>{m.instructions}</Text> : null}
              </View>
            ))}

            {ouverte && p.observations ? (
              <Text style={styles.observations}>{p.observations}</Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  vide: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', paddingVertical: Spacing.md },
  carte: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 10,
  },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  date: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  diagnostic: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  toggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  toggleTxt: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.admin },
  medicament: {
    marginTop: 8, paddingLeft: Spacing.sm,
    borderLeftWidth: 2, borderLeftColor: Colors.adminSoft,
  },
  medNom: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  medMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  observations: {
    marginTop: 10, fontSize: 12, fontStyle: 'italic',
    color: Colors.textSecondary, lineHeight: 17,
  },
});
