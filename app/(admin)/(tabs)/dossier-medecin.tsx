import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter, Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { dossierService, DossierMedecin } from '../../../api/dossierService';
import { PrescriptionsListe, formatDateCourte } from '../../../components/PrescriptionsListe';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { origineCompte } from '@/utils/roles';
import AppHeader from '../../../components/AppHeader';

type Onglet = 'patients' | 'prescriptions';

/**
 * Dossier d'un médecin, consulté depuis l'espace administration : sa file de
 * patients et les ordonnances qu'il a émises. Lecture seule.
 */
export default function DossierMedecinScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [dossier, setDossier] = useState<DossierMedecin | null>(null);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('patients');

  const charger = useCallback(async (uid: string) => {
    try {
      setDossier(await dossierService.getMedecin(uid));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Dossier introuvable',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (id) charger(id);
    else setLoading(false);
  }, [id, charger]));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Dossier médecin" />
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!dossier) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Dossier médecin" />
        <View style={styles.center}>
          <Text style={styles.aucun}>Dossier indisponible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Dossier médecin" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.head}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Ionicons name="medkit" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titre} numberOfLines={1}>{dossier.identite}</Text>
            <Text style={styles.sousTitre} numberOfLines={1}>{dossier.email}</Text>
          </View>
          <View style={[
            styles.statutBadge,
            { backgroundColor: dossier.statut === 'actif' ? Colors.successBg : Colors.dangerBg },
          ]}>
            <Text style={[
              styles.statutTxt,
              { color: dossier.statut === 'actif' ? Colors.success : Colors.danger },
            ]}>
              {dossier.statut === 'actif' ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        {/* Chiffres clés */}
        <View style={styles.chiffres}>
          <View style={styles.chiffre}>
            <Text style={styles.chiffreValeur}>{dossier.nbPatients}</Text>
            <Text style={styles.chiffreLabel}>Patients</Text>
          </View>
          <View style={styles.chiffre}>
            <Text style={styles.chiffreValeur}>{dossier.nbPrescriptions}</Text>
            <Text style={styles.chiffreLabel}>Ordonnances</Text>
          </View>
        </View>

        {/* Identité professionnelle */}
        <Text style={styles.section}>Informations</Text>
        <View style={styles.carte}>
          {dossier.telephone ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValeur}>{dossier.telephone}</Text>
            </View>
          ) : null}
          {dossier.numeroOrdre ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° d&apos;ordre</Text>
              <Text style={styles.infoValeur}>{dossier.numeroOrdre}</Text>
            </View>
          ) : null}
          {dossier.sexe ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sexe</Text>
              <Text style={styles.infoValeur}>
                {dossier.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </Text>
            </View>
          ) : null}
          {dossier.adresse ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValeur}>{dossier.adresse}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inscrit le</Text>
            <Text style={styles.infoValeur}>{formatDateCourte(dossier.dateCreation) ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé par</Text>
            <Text style={styles.infoValeur}>{origineCompte(dossier)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Identifiant</Text>
            <Text style={styles.infoValeur}>{dossier.uid}</Text>
          </View>
          {dossier.specialite.length > 0 && (
            <>
              <Text style={styles.sousSection}>Spécialités</Text>
              <View style={styles.pastilles}>
                {dossier.specialite.map((s, i) => (
                  <View key={i} style={styles.pastille}>
                    <Text style={styles.pastilleTxt}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Bascule patients / ordonnances */}
        <View style={styles.onglets}>
          {([
            { cle: 'patients' as const, label: `Patients (${dossier.nbPatients})`, icone: 'people' as const },
            { cle: 'prescriptions' as const, label: `Ordonnances (${dossier.nbPrescriptions})`, icone: 'document-text' as const },
          ]).map((o) => {
            const actif = onglet === o.cle;
            return (
              <TouchableOpacity
                key={o.cle}
                onPress={() => setOnglet(o.cle)}
                style={[styles.ongletBtn, actif && styles.ongletBtnActif]}
                activeOpacity={0.8}
              >
                <Ionicons name={o.icone} size={15} color={actif ? 'white' : Colors.textSecondary} />
                <Text style={[styles.ongletTxt, actif && styles.ongletTxtActif]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.carte}>
          {onglet === 'patients' ? (
            dossier.patients.length === 0 ? (
              <Text style={styles.aucun}>Aucun patient rattaché à ce médecin.</Text>
            ) : (
              dossier.patients.map((p, i) => (
                <TouchableOpacity
                  key={p.uid}
                  style={[styles.patientRow, i === dossier.patients.length - 1 && styles.patientRowLast]}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: APP_ROUTES.ADMIN.DOSSIER_PATIENT,
                    params: { id: p.uid },
                  } as Href)}
                >
                  <View style={styles.avatarPatient}>
                    <Ionicons name="person" size={16} color={Colors.patient} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientNom} numberOfLines={1}>{p.identite}</Text>
                    <Text style={styles.patientMeta} numberOfLines={1}>
                      {p.numeroPatient ? `${p.numeroPatient} · ` : ''}
                      {p.nbPrescriptions} ordonnance{p.nbPrescriptions > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {p.statut !== 'actif' && (
                    <View style={styles.inactifBadge}>
                      <Text style={styles.inactifTxt}>Inactif</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))
            )
          ) : (
            <PrescriptionsListe
              prescriptions={dossier.prescriptions}
              vide="Ce médecin n'a émis aucune ordonnance."
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  titre: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  sousTitre: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statutTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  chiffres: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  chiffre: { flex: 1, alignItems: 'center' },
  chiffreValeur: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  chiffreLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  section: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  sousSection: {
    fontSize: 10, fontWeight: '800', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.md, marginBottom: 6,
  },
  carte: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md,
    paddingVertical: 7,
  },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  infoValeur: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '700', textAlign: 'right' },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pastille: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.primaryBg },
  pastilleTxt: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  aucun: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  onglets: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: 4, gap: 4,
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  ongletBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: Radius.md,
  },
  ongletBtnActif: { backgroundColor: Colors.admin, ...Shadows.sm },
  ongletTxt: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  ongletTxtActif: { color: 'white' },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  patientRowLast: { borderBottomWidth: 0 },
  avatarPatient: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.patientBg,
    alignItems: 'center', justifyContent: 'center',
  },
  patientNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  patientMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  inactifBadge: { backgroundColor: Colors.dangerBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  inactifTxt: { fontSize: 9, fontWeight: '800', color: Colors.danger, textTransform: 'uppercase' },
});
