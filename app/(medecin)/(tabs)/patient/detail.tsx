/**
 * Fiche d'un patient, vue par son médecin traitant.
 *
 * Raison d'être : la liste des patients ne charge délibérément aucune photo —
 * une vignette par ligne, c'est autant de requêtes Cloudinary au défilement,
 * pour des images de 56 px. Tout ce qui coûte à afficher est repoussé ici, sur
 * un écran ouvert à la demande : la photo en taille lisible, et les données
 * qui ne tiennent pas sur une carte de liste (groupe sanguin, allergies,
 * antécédents, horaires de rappel).
 *
 * L'état civil y est en lecture seule : le corriger appartient au titulaire du
 * compte et à l'administration (PATCH /auth/profile/:uid). Le dossier médical,
 * lui, est éditable — c'est le médecin traitant qui le tient, et l'API n'admet
 * que lui (PATCH /patients/:id/dossier-medical).
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter, Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { patientService } from '../../../../api/patientService';
import { conversationService } from '../../../../api/conversationService';
import { Patient } from '../../../../types/collection';
import AppHeader from '../../../../components/AppHeader';
import AvatarUtilisateur from '../../../../components/AvatarUtilisateur';
import ChampListe from '../../../../components/ChampListe';
import SelecteurGroupeSanguin from '../../../../components/SelecteurGroupeSanguin';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { dateNaissanceAvecAge } from '@/utils/dateNaissance';

/** Les trois données du dossier médical, éditables une par une. */
type ChampMedical = 'groupeSanguin' | 'allergies' | 'antecedents';

/** Message de confirmation, propre à la donnée enregistrée. */
const LIBELLES: Record<ChampMedical, string> = {
  groupeSanguin: 'Groupe sanguin enregistré',
  allergies: 'Allergies enregistrées',
  antecedents: 'Antécédents enregistrés',
};

/**
 * Titre d'une donnée médicale, avec son bouton d'édition à droite.
 *
 * Le libellé du bouton dépend de l'état : « Ajouter » quand il n'y a rien —
 * c'est l'action attendue sur un dossier vide — et « Modifier » ensuite.
 */
function TitreDonnee({
  titre, vide, onPress, cache,
}: { titre: string; vide: boolean; onPress: () => void; cache?: boolean }) {
  return (
    <View style={styles.donneeEntete}>
      <Text style={styles.sousSection}>{titre}</Text>
      {!cache && (
        <TouchableOpacity onPress={onPress} hitSlop={8} style={styles.modifier} activeOpacity={0.7}>
          <Ionicons name={vide ? 'add-circle-outline' : 'create-outline'} size={15} color={Colors.primary} />
          <Text style={styles.modifierTxt}>{vide ? 'Ajouter' : 'Modifier'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Ligne « libellé / valeur ». Masquée quand la valeur est absente. */
function Info({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValeur}>{valeur}</Text>
    </View>
  );
}

/** Liste de pastilles (allergies, antécédents), avec un repli explicite. */
function Pastilles({ valeurs, couleur, fond }: { valeurs?: string[]; couleur: string; fond: string }) {
  if (!valeurs || valeurs.length === 0) {
    return <Text style={styles.vide}>Aucun élément renseigné</Text>;
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

export default function DetailPatientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Donnée médicale en cours d'édition, ou null.
   *
   * Une seule à la fois, et chacune avec son propre bouton : le médecin qui
   * ajoute une allergie ne vient pas revoir le groupe sanguin, et lui ouvrir
   * les trois champs l'obligerait à retrouver le sien parmi eux. C'est aussi
   * ce que permet l'API, dont chaque champ absent de la requête reste
   * inchangé — seul le champ édité part sur le réseau.
   */
  const [champEdite, setChampEdite] = useState<ChampMedical | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  // Les valeurs travaillent dans un état local et ne sont envoyées qu'à
  // l'enregistrement : sans cela, retirer une allergie par erreur serait
  // immédiatement écrit en base, sans possibilité d'annuler.
  const [groupeSanguin, setGroupeSanguin] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [antecedents, setAntecedents] = useState<string[]>([]);

  const ouvrirEdition = (champ: ChampMedical) => {
    if (!patient) return;
    // Reconstruit depuis le dossier courant : repartir d'une saisie abandonnée
    // ferait réapparaître des valeurs que le médecin avait renoncé à écrire.
    if (champ === 'groupeSanguin') setGroupeSanguin(patient.groupeSanguin || '');
    if (champ === 'allergies') setAllergies(patient.allergies || []);
    if (champ === 'antecedents') setAntecedents(patient.antecedents || []);
    setChampEdite(champ);
  };

  const enregistrer = async () => {
    if (!patient?.id || !champEdite) return;

    // N'envoie QUE le champ édité : les deux autres restent tels qu'ils sont en
    // base, même si l'écran affiche une version chargée il y a un moment.
    const modification =
      champEdite === 'groupeSanguin' ? { groupeSanguin }
        : champEdite === 'allergies' ? { allergies }
          : { antecedents };

    setEnregistrement(true);
    try {
      const misAJour = await patientService.updateDossierMedical(patient.id, modification);
      // La réponse porte les listes nettoyées par le serveur (doublons écartés,
      // espaces réduits) : on repart d'elle, pas de l'état local, sinon
      // l'écran afficherait autre chose que ce qui est réellement enregistré.
      setPatient((actuel) => (actuel ? { ...actuel, ...misAJour } : actuel));
      Toast.show({ type: 'success', text1: LIBELLES[champEdite] });
      setChampEdite(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Enregistrement impossible',
      });
    } finally {
      setEnregistrement(false);
    }
  };

  /** Boutons Annuler / Enregistrer, communs aux trois éditeurs. */
  const actionsEdition = (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.bouton, styles.boutonSecondaire]}
        onPress={() => setChampEdite(null)}
        disabled={enregistrement}
        activeOpacity={0.85}
      >
        <Text style={styles.boutonSecondaireTxt}>Annuler</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, styles.boutonPrincipal]}
        onPress={enregistrer}
        disabled={enregistrement}
        activeOpacity={0.85}
      >
        {enregistrement
          ? <ActivityIndicator color={Colors.textInverse} />
          : <Text style={styles.boutonPrincipalTxt}>Enregistrer</Text>}
      </TouchableOpacity>
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      // Rechargé à chaque prise de focus : le patient peut avoir complété son
      // profil entre deux consultations de la fiche.
      let actif = true;
      (async () => {
        if (!id) return;
        try {
          const data = await patientService.getPatientById(id);
          if (actif) setPatient(data);
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: error.response?.data?.error || 'Patient introuvable',
          });
        } finally {
          if (actif) setLoading(false);
        }
      })();
      return () => { actif = false; };
    }, [id]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Fiche patient" />
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppHeader subtitle="Fiche patient" />
        <View style={styles.centre}>
          <Text style={styles.vide}>Patient introuvable.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retour}>
            <Text style={styles.retourTxt}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const nomComplet = `${patient.prenom || ''} ${patient.nom || ''}`.trim();
  const horaires = (patient as any).horairesRappel as
    { matin?: string; midi?: string; soir?: string } | undefined;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Fiche patient" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* La photo n'est chargée que sur cet écran, jamais dans la liste. */}
          <AvatarUtilisateur
            photoURL={patient.photoURL}
            prenom={patient.prenom}
            nom={patient.nom}
            email={patient.email}
            taille={72}
            couleur={Colors.primary}
            fond={Colors.primaryBg}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.titre} numberOfLines={1}>
              {nomComplet || patient.email}
            </Text>
            <Text style={styles.sousTitre} numberOfLines={1}>
              {patient.numeroPatient || patient.email}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>Identité</Text>
        <View style={styles.carte}>
          <Info label="Email" valeur={patient.email} />
          <Info label="Téléphone" valeur={patient.telephone} />
          <Info
            label="Sexe"
            valeur={patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : null}
          />
          <Info label="Naissance" valeur={dateNaissanceAvecAge(patient.dateNaissance)} />
          <Info label="Adresse" valeur={patient.adresse} />
          <Info label="N° patient" valeur={patient.numeroPatient} />
        </View>

        <Text style={styles.section}>Données médicales</Text>
        <View style={styles.carte}>
          {/* Chaque donnée porte son propre bouton et s'édite seule : les deux
              autres restent lisibles pendant la saisie, et seule celle qui a
              changé part sur le réseau. */}
          <TitreDonnee
            titre="Groupe sanguin"
            vide={!patient.groupeSanguin}
            onPress={() => ouvrirEdition('groupeSanguin')}
            cache={champEdite !== null}
          />
          {champEdite === 'groupeSanguin' ? (
            <>
              <SelecteurGroupeSanguin
                valeur={groupeSanguin}
                onChange={setGroupeSanguin}
                label=""
                disabled={enregistrement}
              />
              {actionsEdition}
            </>
          ) : (
            <Text style={styles.valeurDonnee}>
              {patient.groupeSanguin || 'Non renseigné'}
            </Text>
          )}

          <View style={styles.separateur} />

          <TitreDonnee
            titre="Allergies"
            vide={!patient.allergies?.length}
            onPress={() => ouvrirEdition('allergies')}
            cache={champEdite !== null}
          />
          {champEdite === 'allergies' ? (
            <>
              <ChampListe
                label=""
                valeurs={allergies}
                onChange={setAllergies}
                placeholder="Ex : Pénicilline"
                vide="Aucune allergie connue"
                couleur={Colors.danger}
                fond={Colors.dangerBg}
                disabled={enregistrement}
              />
              {actionsEdition}
            </>
          ) : (
            <Pastilles valeurs={patient.allergies} couleur={Colors.danger} fond={Colors.dangerBg} />
          )}

          <View style={styles.separateur} />

          <TitreDonnee
            titre="Antécédents"
            vide={!patient.antecedents?.length}
            onPress={() => ouvrirEdition('antecedents')}
            cache={champEdite !== null}
          />
          {champEdite === 'antecedents' ? (
            <>
              <ChampListe
                label=""
                valeurs={antecedents}
                onChange={setAntecedents}
                placeholder="Ex : Hypertension"
                vide="Aucun antécédent connu"
                couleur={Colors.info}
                fond={Colors.infoBg}
                disabled={enregistrement}
              />
              {actionsEdition}
            </>
          ) : (
            <Pastilles valeurs={patient.antecedents} couleur={Colors.info} fond={Colors.infoBg} />
          )}
        </View>

        {/* Horaires de rappel : c'est le patient qui les règle, mais le médecin
            doit pouvoir les lire — une prise du soir prévue à 20h explique un
            oubli qu'une prescription « soir » seule ne laisse pas deviner. */}
        {horaires ? (
          <>
            <Text style={styles.section}>Horaires de rappel</Text>
            <View style={styles.carte}>
              <Info label="Matin" valeur={horaires.matin} />
              <Info label="Midi" valeur={horaires.midi} />
              <Info label="Soir" valeur={horaires.soir} />
            </View>
          </>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonSecondaire]}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: APP_ROUTES.MEDECIN.ORDONNANCE.HISTORY,
              params: { patientId: patient.id, patientName: nomComplet || patient.email },
            } as Href)}
          >
            <Ionicons name="folder-open-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.boutonSecondaireTxt}>Ordonnances</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, styles.boutonPrincipal]}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT,
              params: { patientId: patient.id },
            } as Href)}
          >
            <Ionicons name="medical-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.boutonPrincipalTxt}>Prescrire</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.bouton, styles.boutonMessage]}
          activeOpacity={0.85}
          onPress={async () => {
            try {
              const conv = await conversationService.getOrCreate({
                patientId: patient.userId || patient.id!,
              });
              router.push({
                pathname: '/(conversation)/chat',
                params: { conversationId: conv.id, contactName: nomComplet || patient.email },
              } as any);
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: error.response?.data?.error || "Impossible d'ouvrir la conversation",
              });
            }
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
          <Text style={styles.boutonMessageTxt}>Message</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  backBtn: { padding: 4 },
  titre: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sousTitre: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  section: {
    fontSize: 13, fontWeight: '800', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Spacing.sm, marginLeft: 4,
  },
  donneeEntete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  modifier: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modifierTxt: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  valeurDonnee: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  separateur: {
    height: 1, backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  carte: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: 7,
  },
  infoLabel: { fontSize: 13, color: Colors.textMuted },
  infoValeur: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right' },
  // Sans marge : le titre vit désormais dans une rangée avec son bouton, et
  // une marge verticale le décalerait par rapport à lui.
  sousSection: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pastille: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  pastilleTxt: { fontSize: 12, fontWeight: '700' },
  vide: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: Spacing.md },
  bouton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: Radius.lg,
  },
  boutonSecondaire: { backgroundColor: Colors.surfaceAlt },
  boutonSecondaireTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  boutonPrincipal: { backgroundColor: Colors.primary },
  boutonPrincipalTxt: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },
  boutonMessage: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1, borderColor: Colors.primary,
  },
  boutonMessageTxt: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  retour: { paddingHorizontal: Spacing.xl, paddingVertical: 10 },
  retourTxt: { color: Colors.primary, fontWeight: '700' },
});
