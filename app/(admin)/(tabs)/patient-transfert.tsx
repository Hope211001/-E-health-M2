/**
 * patient-transfert.tsx
 *
 * Transfert d'un patient vers un autre établissement. Attend `?id=<uid>`.
 *
 * C'est l'écran qui répond concrètement à « et si un patient change
 * d'hôpital ? » : son identité reste la même — un seul compte dans le pays —
 * seul son rattachement change, et l'opération est datée et signée.
 *
 * Deux champs indissociables, volontairement : l'établissement d'arrivée ET le
 * médecin qui l'y prendra en charge. Transférer sans praticien sur place
 * rendrait le patient invisible au lieu de le rattacher — plus personne pour
 * lire ses alertes de prise ni renouveler son traitement.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../../api/authService';
import { dossierService, DossierPatient } from '../../../api/dossierService';
import { patientService } from '../../../api/patientService';
import SelecteurEtablissement from '../../../components/SelecteurEtablissement';
import AvatarUtilisateur from '../../../components/AvatarUtilisateur';
import type { User } from '../../../types/collection';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { libelleEtablissement } from '@/utils/roles';
import { useAuth } from '../../../hooks/useAuth';

/** Nom affichable d'un médecin, avec repli sur l'email. */
const nomMedecin = (m: User) =>
  (m.prenom || m.nom) ? `Dr ${`${m.prenom || ''} ${m.nom || ''}`.trim()}` : m.email;

export default function PatientTransfertScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [dossier, setDossier] = useState<DossierPatient | null>(null);
  const [chargement, setChargement] = useState(true);

  const [etablissementId, setEtablissementId] = useState('');
  const [medecinId, setMedecinId] = useState('');
  const [motif, setMotif] = useState('');

  const [medecins, setMedecins] = useState<User[]>([]);
  const [chargementMedecins, setChargementMedecins] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!id) return;
    let annule = false;
    (async () => {
      try {
        const d = await dossierService.getPatient(id);
        if (!annule) setDossier(d);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Chargement impossible',
          text2: error.response?.data?.error || 'Patient introuvable',
        });
        router.back();
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Médecins de l'établissement choisi.
   *
   * `all: true` et filtrage sur le bloc `etablissement` renvoyé par l'API : il
   * n'existe pas de recherche de médecins par établissement côté serveur, et
   * une liste paginée tronquerait silencieusement les praticiens du bas de
   * l'alphabet — dans un sélecteur, c'est un bug invisible.
   *
   * L'API borne d'elle-même ce que voit l'appelant : un admin ne reçoit que les
   * médecins de son établissement, donc ne peut transférer que VERS le sien.
   */
  const chargerMedecins = useCallback(async (cible: string) => {
    if (!cible) { setMedecins([]); return; }
    setChargementMedecins(true);
    try {
      const page = await authService.listUsers('medecin', { all: true });
      setMedecins(page.data.filter((m) => m.etablissement?.id === cible));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Médecins indisponibles',
        text2: error.response?.data?.error || 'Réessayez',
      });
      setMedecins([]);
    } finally {
      setChargementMedecins(false);
    }
  }, []);

  useEffect(() => {
    // Le médecin choisi appartenait à l'établissement précédent : le garder
    // enverrait une combinaison que le serveur refuse.
    setMedecinId('');
    chargerMedecins(etablissementId);
  }, [etablissementId, chargerMedecins]);

  const origine = libelleEtablissement(dossier?.etablissement, 'patient');
  const memeEtablissement = Boolean(
    etablissementId && dossier?.etablissement?.id === etablissementId,
  );

  const handleSubmit = () => {
    if (!etablissementId || !medecinId || !id) return;

    const medecin = medecins.find((m) => m.uid === medecinId);
    Alert.alert(
      'Confirmer le transfert ?',
      `${dossier?.identite} sera désormais suivi par ${medecin ? nomMedecin(medecin) : 'ce médecin'}. `
      + `Ses ordonnances passées restent rattachées à ${origine} : ce sont des actes datés, `
      + `ils ne changent pas d'établissement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Transférer',
          onPress: async () => {
            setEnvoi(true);
            try {
              await patientService.transferer(id, {
                etablissementId, medecinTraitantId: medecinId, motif,
              });
              Toast.show({ type: 'success', text1: 'Patient transféré' });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Transfert impossible',
                text2: error.response?.data?.error || 'Réessayez',
              });
            } finally {
              setEnvoi(false);
            }
          },
        },
      ],
    );
  };

  if (chargement) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.adminAccent} />
      </View>
    );
  }

  return (
    <AppScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Transférer le patient</Text>
          <Text style={styles.subtitle}>Changement d&apos;établissement de suivi</Text>
        </View>
      </View>

      <View style={styles.card}>
        {/* Situation actuelle : sans ce rappel, on transfère à l'aveugle. */}
        <View style={styles.patient}>
          <AvatarUtilisateur
            prenom={dossier?.identite?.split(' ')[0]}
            nom={dossier?.identite?.split(' ').slice(1).join(' ')}
            email={dossier?.email}
            photoURL={dossier?.photoURL}
            taille={44}
            couleur={Colors.patient}
            fond={Colors.patientBg}
            icone="people"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.patientNom} numberOfLines={1}>{dossier?.identite}</Text>
            <Text style={styles.patientMeta} numberOfLines={1}>
              {origine}
            </Text>
            <Text style={styles.patientMeta} numberOfLines={1}>
              Médecin actuel : {dossier?.medecinTraitant?.nom || 'aucun'}
            </Text>
          </View>
        </View>

        <SelecteurEtablissement
          valeur={etablissementId}
          onChange={setEtablissementId}
          role={user?.role}
          couleur={Colors.adminAccent}
          fond={Colors.adminAccentBg}
        />

        {memeEtablissement && (
          <View style={styles.alerte}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.alerteTxt}>
              Le patient est déjà suivi ici. Choisissez un autre établissement.
            </Text>
          </View>
        )}

        {etablissementId && !memeEtablissement && (
          <>
            <Text style={styles.label}>Nouveau médecin traitant</Text>
            {chargementMedecins ? (
              <ActivityIndicator color={Colors.adminAccent} style={{ marginBottom: Spacing.md }} />
            ) : medecins.length === 0 ? (
              <View style={styles.alerte}>
                <Ionicons name="warning-outline" size={16} color={Colors.warning} />
                <Text style={styles.alerteTxt}>
                  Aucun médecin n&apos;exerce dans cet établissement. Le transfert
                  laisserait le patient sans praticien pour suivre son traitement.
                </Text>
              </View>
            ) : (
              <View style={styles.liste}>
                {medecins.map((m) => {
                  const choisi = m.uid === medecinId;
                  return (
                    <TouchableOpacity
                      key={m.uid}
                      onPress={() => setMedecinId(m.uid)}
                      activeOpacity={0.8}
                      style={[
                        styles.ligne,
                        choisi && {
                          backgroundColor: Colors.adminAccentBg,
                          borderColor: Colors.adminAccent,
                        },
                      ]}
                    >
                      <Ionicons
                        name={choisi ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={choisi ? Colors.adminAccent : Colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.ligneNom, choisi && { color: Colors.adminAccent }]}
                          numberOfLines={1}
                        >
                          {nomMedecin(m)}
                        </Text>
                        <Text style={styles.ligneMeta} numberOfLines={1}>{m.email}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>Motif</Text>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              style={[styles.input, styles.inputMulti]}
              placeholder="Facultatif — ex : déménagement, orientation vers un service spécialisé"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={200}
            />
          </>
        )}

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!etablissementId || !medecinId || memeEtablissement) && styles.primaryBtnOff,
          ]}
          onPress={handleSubmit}
          disabled={envoi || !etablissementId || !medecinId || memeEtablissement}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.adminAccent, Colors.adminAccentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {envoi
              ? <ActivityIndicator color="white" />
              : <Text style={styles.primaryBtnText}>Transférer le patient</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelTxt}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.xl, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  patient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt,
  },
  patientNom: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  patientMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  label: {
    color: Colors.textPrimary, fontWeight: '700',
    marginBottom: 6, marginLeft: 4, fontSize: 14,
  },
  liste: { gap: 8, marginBottom: Spacing.md },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
  },
  ligneNom: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  ligneMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  alerte: {
    flexDirection: 'row', gap: 8,
    padding: 12, borderRadius: Radius.md,
    backgroundColor: Colors.infoBg,
    marginBottom: Spacing.md,
  },
  alerteTxt: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  primaryBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg },
  primaryBtnOff: { opacity: 0.5 },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
