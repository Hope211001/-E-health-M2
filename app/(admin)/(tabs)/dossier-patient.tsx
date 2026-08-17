import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter, Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { dossierService, DossierPatient } from '../../../api/dossierService';
import { PrescriptionsListe, formatDateCourte } from '../../../components/PrescriptionsListe';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { libelleEtablissement, origineCompte } from '@/utils/roles';
import { dateNaissanceAvecAge } from '@/utils/dateNaissance';
import AppHeader from '../../../components/AppHeader';
import AvatarUtilisateur from '../../../components/AvatarUtilisateur';

/** Ligne « libellé / valeur » des cartes d'information. */
function Info({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValeur}>{valeur}</Text>
    </View>
  );
}

/** Liste de mots-clés (allergies, antécédents) sous forme de pastilles. */
function Pastilles({ valeurs, couleur, fond }: { valeurs: string[]; couleur: string; fond: string }) {
  if (valeurs.length === 0) {
    return <Text style={styles.aucun}>Aucun élément signalé.</Text>;
  }
  return (
    <View style={styles.pastilles}>
      {valeurs.map((v, i) => (
        <View key={i} style={[styles.pastille, { backgroundColor: fond }]}>
          <Text style={[styles.pastilleTxt, { color: couleur }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Dossier d'un patient, consulté depuis l'espace administration.
 * Lecture seule : l'admin consulte, il ne modifie pas un dossier médical.
 */
export default function DossierPatientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [dossier, setDossier] = useState<DossierPatient | null>(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async (uid: string) => {
    try {
      setDossier(await dossierService.getPatient(uid));
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
        <AppHeader subtitle="Dossier patient" />
        <View style={styles.center}><ActivityIndicator color={Colors.patient} /></View>
      </SafeAreaView>
    );
  }

  if (!dossier) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Dossier patient" />
        <View style={styles.center}>
          <Text style={styles.aucun}>Dossier indisponible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { observance } = dossier;
  // Part des prises effectivement honorées, hors doses encore à venir.
  const echues = observance.pris + observance.manque;
  const tauxObservance = echues > 0 ? Math.round((observance.pris / echues) * 100) : null;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Dossier patient" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.head}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          {/* La photo est chargée ICI et nulle part ailleurs : une seule requête
              pour un écran ouvert à la demande, là où les listes en auraient
              lancé une par ligne. */}
          <AvatarUtilisateur
            photoURL={dossier.photoURL}
            email={dossier.email}
            taille={44}
            couleur={Colors.patient}
            fond={Colors.patientBg}
            icone="person"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.titre} numberOfLines={1}>{dossier.identite}</Text>
            <Text style={styles.sousTitre} numberOfLines={1}>
              {dossier.numeroPatient || dossier.email}
            </Text>
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
            <Text style={styles.chiffreValeur}>{dossier.nbPrescriptions}</Text>
            <Text style={styles.chiffreLabel}>Ordonnances</Text>
          </View>
          <View style={styles.chiffre}>
            <Text style={styles.chiffreValeur}>{observance.total}</Text>
            <Text style={styles.chiffreLabel}>Prises prévues</Text>
          </View>
          <View style={styles.chiffre}>
            <Text style={[styles.chiffreValeur, { color: tauxObservance === null ? Colors.textMuted : Colors.success }]}>
              {tauxObservance === null ? '—' : `${tauxObservance}%`}
            </Text>
            <Text style={styles.chiffreLabel}>Observance</Text>
          </View>
        </View>

        {/* Identité */}
        <Text style={styles.section}>Identité</Text>
        <View style={styles.carte}>
          <Info label="Email" valeur={dossier.email} />
          <Info label="Téléphone" valeur={dossier.telephone} />
          <Info label="Sexe" valeur={dossier.sexe === 'M' ? 'Masculin' : dossier.sexe === 'F' ? 'Féminin' : null} />
          {/* `dateNaissanceAvecAge` et non `formatDateCourte` : la date est une
              chaîne 'AAAA-MM-JJ' que `new Date()` interpréterait en UTC, et
              c'est l'âge qui intéresse le lecteur du dossier. */}
          <Info label="Naissance" valeur={dateNaissanceAvecAge(dossier.dateNaissance)} />
          <Info label="Adresse" valeur={dossier.adresse} />
          <Info label="Inscrit le" valeur={formatDateCourte(dossier.dateCreation)} />
          {/* Établissement où le patient est suivi. Distinct de « Créé par » :
              un patient peut avoir été enregistré par l'administration puis
              transféré, l'origine et le rattachement actuel ne coïncident pas
              forcément. */}
          <Info
            label="Suivi à"
            valeur={libelleEtablissement(dossier.etablissement, 'patient')}
          />
          <Info label="Créé par" valeur={origineCompte(dossier)} />
          <Info label="Identifiant" valeur={dossier.uid} />
        </View>

        {/* Données médicales */}
        <Text style={styles.section}>Données médicales</Text>
        <View style={styles.carte}>
          <Info label="Groupe sanguin" valeur={dossier.groupeSanguin || 'Non renseigné'} />

          <Text style={styles.sousSection}>Allergies</Text>
          <Pastilles valeurs={dossier.allergies} couleur={Colors.danger} fond={Colors.dangerBg} />

          <Text style={styles.sousSection}>Antécédents</Text>
          <Pastilles valeurs={dossier.antecedents} couleur={Colors.adminAccentDark} fond={Colors.adminAccentSoft} />

          {dossier.horairesRappel && (
            <>
              <Text style={styles.sousSection}>Horaires de rappel</Text>
              <Text style={styles.horaires}>
                Matin {dossier.horairesRappel.matin || '—'} · Midi {dossier.horairesRappel.midi || '—'} · Soir {dossier.horairesRappel.soir || '—'}
              </Text>
            </>
          )}
        </View>

        {/* Médecin traitant */}
        <Text style={styles.section}>Médecin traitant</Text>
        <View style={styles.carte}>
          {dossier.medecinTraitant ? (
            <TouchableOpacity
              style={styles.medecinRow}
              activeOpacity={0.85}
              onPress={() => router.push({
                pathname: APP_ROUTES.ADMIN.DOSSIER_MEDECIN,
                params: { id: dossier.medecinTraitant!.uid },
              } as Href)}
            >
              <View style={styles.avatarMedecin}>
                <Ionicons name="medkit" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medecinNom}>{dossier.medecinTraitant.nom}</Text>
                <Text style={styles.medecinMeta}>{dossier.medecinTraitant.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.aucun}>Aucun médecin traitant rattaché.</Text>
          )}

          {/* Le transfert est la SEULE écriture de cet écran, par ailleurs en
              lecture seule : ce n'est pas un acte médical mais un mouvement
              organisationnel, qui relève bien de l'administration. */}
          <TouchableOpacity
            style={styles.transfertBtn}
            activeOpacity={0.85}
            onPress={() => router.push(
              `${APP_ROUTES.ADMIN.PATIENT_TRANSFERT}?id=${dossier.uid}` as Href,
            )}
          >
            <Ionicons name="swap-horizontal" size={16} color={Colors.adminAccent} />
            <Text style={styles.transfertTxt}>Transférer vers un autre établissement</Text>
          </TouchableOpacity>
        </View>

        {/* Historique des prescriptions */}
        <Text style={styles.section}>
          Historique des ordonnances{' '}
          <Text style={styles.sectionCompte}>· {dossier.nbPrescriptions}</Text>
        </Text>
        <View style={styles.carte}>
          <PrescriptionsListe
            prescriptions={dossier.prescriptions}
            vide="Aucune ordonnance pour ce patient."
          />
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
    backgroundColor: Colors.patientBg,
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
  sectionCompte: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
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
  pastille: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  pastilleTxt: { fontSize: 12, fontWeight: '700' },
  aucun: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  horaires: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  medecinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarMedecin: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  medecinNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  medecinMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  transfertBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: Spacing.md, paddingVertical: 11,
    borderRadius: Radius.md, backgroundColor: Colors.adminAccentBg,
  },
  transfertTxt: { fontSize: 13, fontWeight: '700', color: Colors.adminAccent },
});
