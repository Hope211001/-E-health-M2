import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { prescriptionService } from '../../api/prescriptionService';
import {
  requestNotificationPermission,
  schedulePrescriptionNotifications,
  cancelPrescriptionNotifications,
} from '../../api/notificationLocal';
import Toast from 'react-native-toast-message';
import { imprimerOrdonnance, partagerOrdonnancePdf } from '@/utils/printOrdonnance';
import { getEtablissementEntete, getMedecinLabel, getPatientEntete } from '@/utils/ordonnanceLabels';

const DEFAUT_HORAIRES = { matin: '08:00', midi: '12:00', soir: '20:00' };

export default function DetailPrescription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Horaires personnalisés du patient
  const [horaires, setHoraires] = useState(DEFAUT_HORAIRES);
  const [savingHoraires, setSavingHoraires] = useState(false);
  // Une fois le traitement démarré, les horaires sont affichés en lecture seule
  // et ne deviennent modifiables qu'après un appui sur « Modifier ».
  const [editingHoraires, setEditingHoraires] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) return;

        // Charger la prescription
        const prescSnap = await getDoc(doc(db, 'prescriptions', id as string));
        if (!prescSnap.exists()) {
          setLoading(false);
          return;
        }
        const prescData: any = { id: prescSnap.id, ...prescSnap.data() };
        setPrescription(prescData);

        // Priorité : horaires propres à la prescription > horaires du patient (par défaut) > valeurs par défaut
        if (prescData.horairesRappel) {
          setHoraires({ ...DEFAUT_HORAIRES, ...prescData.horairesRappel });
        } else {
          const patientSnap = await getDoc(doc(db, 'patients', user.uid));
          if (patientSnap.exists() && patientSnap.data().horairesRappel) {
            setHoraires({ ...DEFAUT_HORAIRES, ...patientSnap.data().horairesRappel });
          }
        }
      } catch (e) {
        console.error(e);
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger la prescription' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  /** Imprime l'ordonnance ou l'exporte en PDF (à présenter en pharmacie). */
  const handleExport = async (mode: 'print' | 'share') => {
    try {
      setPrinting(true);
      const [patient, medecinLabel, etablissement] = await Promise.all([
        getPatientEntete(prescription.patientId || auth.currentUser?.uid),
        getMedecinLabel(prescription.medecinId),
        getEtablissementEntete(prescription.etablissementId, prescription.medecinId),
      ]);
      const document = {
        ...prescription,
        patientLabel: patient.label,
        patientDetail: patient.details,
        medecinLabel,
        etablissementLabel: etablissement.label,
        etablissementDetail: etablissement.details,
        etablissementContact: etablissement.contact,
      };
      await (mode === 'print' ? imprimerOrdonnance(document) : partagerOrdonnancePdf(document));
    } catch (error: any) {
      // L'annulation du dialogue système lève aussi une erreur : on reste discret
      if (!/cancel/i.test(error?.message || '')) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Export impossible' });
      }
    } finally {
      setPrinting(false);
    }
  };

  const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

  const handleSaveHoraires = async () => {
    for (const [key, value] of Object.entries(horaires)) {
      if (!isValidTime(value)) {
        return Toast.show({ type: 'error', text1: 'Format invalide', text2: `"${key}" doit être au format HH:MM` });
      }
    }
    setSavingHoraires(true);
    try {
      // Sauvegarde des horaires propres à CETTE prescription (pas au profil patient)
      await prescriptionService.updatePrescriptionHoraires(prescription.id, horaires);
      setPrescription((p: any) => ({ ...p, horairesRappel: horaires }));

      if (prescription.statut === 'en_cours') {
        // Traitement déjà démarré : les rappels du téléphone ont été programmés
        // avec les anciennes heures, il faut les annuler et les reprogrammer
        // sur les jours restants (sans dépasser la date de fin d'origine).
        await cancelPrescriptionNotifications(prescription.id);
        const finDate = prescription.dateFin?.toDate ? prescription.dateFin.toDate() : new Date(prescription.dateFin);
        const joursRestants = Math.max(1, Math.ceil((finDate.getTime() - Date.now()) / 86400000));
        await schedulePrescriptionNotifications({
          prescriptionId: prescription.id,
          medicaments: prescription.medicaments || [],
          horaires,
          dureeDefaut: joursRestants,
        });
      }

      setEditingHoraires(false);
      Toast.show({ type: 'success', text1: 'Horaires sauvegardés pour cette ordonnance' });
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de sauvegarder' });
    } finally {
      setSavingHoraires(false);
    }
  };

  const handleStartPrescription = async () => {
    // D'abord sauvegarder les horaires
    for (const [key, value] of Object.entries(horaires)) {
      if (!isValidTime(value)) {
        return Toast.show({ type: 'error', text1: 'Format invalide', text2: `Corrigez l'heure "${key}" avant de démarrer` });
      }
    }

    setStarting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Démarrer la prescription en envoyant les horaires propres à cette ordonnance
      const demarrage = await prescriptionService.startPrescription(prescription.id, horaires);

      // Le serveur saute les prises dont l'heure est déjà passée : la première
      // dose peut donc être ce soir, ou demain matin. Le dire explicitement
      // évite de laisser croire qu'un rappel va sonner dans la minute.
      const premiere = demarrage?.premierePrise ? new Date(demarrage.premierePrise) : null;
      const quandPremiere = premiere
        ? premiere.toDateString() === new Date().toDateString()
          ? `Première prise aujourd'hui à ${premiere.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
          : `Première prise demain à ${premiere.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        : null;

      // Planifier les notifications locales sur le téléphone
      const granted = await requestNotificationPermission();
      if (granted) {
        const { count } = await schedulePrescriptionNotifications({
          prescriptionId: prescription.id,
          medicaments: prescription.medicaments || [],
          horaires,
          dureeDefaut: parseInt(String(prescription.duree)) || 7,
        });
        Toast.show({
          type: 'success',
          text1: 'Traitement démarré !',
          text2: quandPremiere
            ?? `${count} rappel${count > 1 ? 's' : ''} programmé${count > 1 ? 's' : ''} sur votre téléphone`,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Traitement démarré',
          text2: 'Activez les notifications pour recevoir les rappels',
        });
      }

      setModalVisible(false);
      router.back();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Impossible de démarrer';
      Toast.show({ type: 'error', text1: 'Erreur', text2: message });
    } finally {
      setStarting(false);
    }
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'en_cours': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'En cours', color: '#3B82F6' };
      case 'active': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active', color: '#10B981' };
      case 'terminee': return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', label: 'Terminée', color: '#64748B' };
      case 'annulee': return { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', label: 'Annulée', color: '#EF4444' };
      default: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'En attente', color: '#F59E0B' };
    }
  };

  // Parse la fréquence pour afficher les moments
  const parseMoments = (frequence: string) => {
    if (!frequence) return [];
    const moments: { label: string; qty: number }[] = [];
    const matinMatch = frequence.match(/[Mm]atin\s*:\s*(\d+)/);
    const midiMatch = frequence.match(/[Mm]idi\s*:\s*(\d+)/);
    const soirMatch = frequence.match(/[Ss]oir\s*:\s*(\d+)/);
    if (matinMatch) moments.push({ label: 'Matin', qty: parseInt(matinMatch[1]) });
    if (midiMatch) moments.push({ label: 'Midi', qty: parseInt(midiMatch[1]) });
    if (soirMatch) moments.push({ label: 'Soir', qty: parseInt(soirMatch[1]) });
    return moments;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center px-10">
        <Ionicons name="alert-circle-outline" size={60} color="#94A3B8" />
        <Text className="text-slate-500 text-center mt-4">Prescription introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-sky-600 px-6 py-3 rounded-2xl">
          <Text className="text-white font-bold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statut = getStatutStyle(prescription.statut);
  const canStart = prescription.statut === 'en_attente' || prescription.statut === 'active';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-50 p-3 rounded-2xl mr-4">
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-bold uppercase">Détail</Text>
          <Text className="text-lg font-black text-slate-900">Prescription</Text>
        </View>
        <View className={`${statut.bg} px-4 py-2 rounded-full border ${statut.border}`}>
          <Text className={`${statut.text} font-bold text-xs uppercase`}>{statut.label}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* --- DIAGNOSTIC --- */}
        <View className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="medkit" size={18} color="#0EA5E9" />
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">Diagnostic</Text>
          </View>
          <Text className="text-slate-900 text-base leading-6">{prescription.diagnostic || 'Non renseigné'}</Text>
        </View>

        {/* --- OBSERVATIONS --- */}
        {prescription.observations ? (
          <View className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="chatbubble-ellipses" size={18} color="#0EA5E9" />
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">Observations</Text>
            </View>
            <Text className="text-slate-700 text-sm leading-6">{prescription.observations}</Text>
          </View>
        ) : null}

        {/* --- DATES --- */}
        <View className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar" size={18} color="#0EA5E9" />
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">Dates</Text>
          </View>
          <View className="gap-3">
            <DateRow label="Créée le" value={formatDate(prescription.dateCreation)} icon="create-outline" />
            <DateRow label="Début" value={canStart ? "À définir (aujourd'hui si démarré)" : formatDate(prescription.dateDebut)} icon="play-outline" />
            <DateRow label="Fin prévue" value={canStart ? `${prescription.duree || '?'} jours après le début` : formatDate(prescription.dateFin)} icon="flag-outline" />
            <DateRow label="Durée" value={`${prescription.duree || '?'} jours`} icon="time-outline" />
          </View>
        </View>

        {/* --- MÉDICAMENTS --- */}
        <View className="mb-4">
          <View className="flex-row items-center mb-3 px-2">
            <Ionicons name="medical" size={18} color="#0EA5E9" />
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">
              Médicaments ({prescription.medicaments?.length || 0})
            </Text>
          </View>

          {prescription.medicaments?.map((med: any, i: number) => {
            const moments = parseMoments(med.frequence);
            return (
              <View key={i} className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm mb-3">
                <Text className="text-slate-900 font-black text-lg mb-1">{med.nomMedicament}</Text>
                <Text className="text-sky-600 font-bold text-sm mb-4">{med.dosage}</Text>

                {/* Fréquence Matin / Midi / Soir */}
                {moments.length > 0 ? (
                  <View className="flex-row gap-2 mb-3">
                    {moments.map((m, j) => (
                      <View key={j} className={`flex-1 rounded-2xl p-3 items-center border ${m.qty > 0 ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-100'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${m.qty > 0 ? 'text-sky-600' : 'text-slate-300'}`}>{m.label}</Text>
                        <Text className={`text-2xl font-black mt-1 ${m.qty > 0 ? 'text-sky-900' : 'text-slate-300'}`}>{m.qty}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="bg-slate-50 rounded-2xl p-3 mb-3 border border-slate-100">
                    <Text className="text-slate-500 text-xs">{med.frequence || 'Fréquence non précisée'}</Text>
                  </View>
                )}

                {/* Durée + instructions */}
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#94A3B8" />
                  <Text className="text-slate-400 text-xs ml-2">Durée : {med.duree || prescription.duree || '?'} jours</Text>
                </View>
                {med.instructions ? (
                  <View className="flex-row items-start mt-2">
                    <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                    <Text className="text-slate-500 text-xs ml-2 italic flex-1">{med.instructions}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* --- PARAMÈTRES HORAIRES (avant démarrage : configuration initiale, toujours modifiable) --- */}
        {(canStart || prescription.statut === 'en_cours') && (
          <View className="bg-white rounded-[28px] p-6 border border-sky-200 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="alarm" size={20} color="#0EA5E9" />
                <Text className="text-lg font-black text-slate-900 ml-3">Horaires de rappel</Text>
              </View>
              {!canStart && !editingHoraires && (
                <TouchableOpacity onPress={() => setEditingHoraires(true)} className="bg-sky-50 rounded-xl px-3 py-2 flex-row items-center">
                  <Ionicons name="create-outline" size={14} color="#0EA5E9" />
                  <Text className="text-sky-600 font-bold text-xs ml-1">Modifier</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* En cours + pas en édition : affichage lecture seule */}
            {!canStart && !editingHoraires ? (
              <View className="flex-row gap-3 mt-3">
                <HoraireBadge label="Matin" heure={horaires.matin} icon="sunny" color="#F59E0B" />
                <HoraireBadge label="Midi" heure={horaires.midi} icon="partly-sunny" color="#F97316" />
                <HoraireBadge label="Soir" heure={horaires.soir} icon="moon" color="#6366F1" />
              </View>
            ) : (
              <>
                <Text className="text-slate-400 text-sm mb-5">
                  {canStart
                    ? "Configurez vos heures de prise avant de démarrer le traitement."
                    : "Les rappels restants sont automatiquement reprogrammés après la sauvegarde."}
                </Text>

                <HoraireInput label="Matin" icon="sunny" color="#F59E0B" bgColor="bg-amber-50" borderColor="border-amber-200"
                  value={horaires.matin} onChange={(v: string) => setHoraires({ ...horaires, matin: v })} />
                <HoraireInput label="Midi" icon="partly-sunny" color="#F97316" bgColor="bg-orange-50" borderColor="border-orange-200"
                  value={horaires.midi} onChange={(v: string) => setHoraires({ ...horaires, midi: v })} />
                <HoraireInput label="Soir" icon="moon" color="#6366F1" bgColor="bg-sky-50" borderColor="border-sky-200"
                  value={horaires.soir} onChange={(v: string) => setHoraires({ ...horaires, soir: v })} />

                <View className="flex-row gap-3 mt-2">
                  {!canStart && (
                    <TouchableOpacity onPress={() => setEditingHoraires(false)} disabled={savingHoraires}
                      className="bg-slate-100 rounded-2xl py-4 px-6 items-center justify-center">
                      <Text className="text-slate-500 font-bold text-sm">Annuler</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleSaveHoraires} disabled={savingHoraires}
                    className="flex-1 bg-sky-600 rounded-2xl py-4 items-center justify-center shadow-lg shadow-sky-200">
                    {savingHoraires ? <ActivityIndicator color="white" /> : (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text className="text-white font-bold text-sm ml-2">Sauvegarder les horaires</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* --- BOUTON DÉMARRER --- */}
        {canStart && (
          <TouchableOpacity
            className="bg-sky-600 rounded-2xl py-5 items-center shadow-lg shadow-sky-200 mb-4"
            onPress={() => setModalVisible(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="play-circle" size={22} color="white" />
              <Text className="text-white font-bold text-base ml-2">Commencer ce traitement aujourd'hui</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* --- IMPRIMER / PARTAGER (ordonnance à présenter en pharmacie) --- */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white border border-slate-200 rounded-2xl py-4"
            disabled={printing}
            onPress={() => handleExport('print')}
          >
            {printing
              ? <ActivityIndicator size="small" color="#0EA5E9" />
              : <Ionicons name="print-outline" size={18} color="#0EA5E9" />}
            <Text className="text-slate-700 font-bold text-sm ml-2">Imprimer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white border border-slate-200 rounded-2xl py-4"
            disabled={printing}
            onPress={() => handleExport('share')}
          >
            <Ionicons name="share-outline" size={18} color="#0EA5E9" />
            <Text className="text-slate-700 font-bold text-sm ml-2">Partager PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODAL CONFIRMATION --- */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-[30px] p-8 w-full max-w-sm">
            <View className="items-center mb-5">
              <View className="bg-sky-100 p-5 rounded-full">
                <Ionicons name="medical" size={36} color="#0EA5E9" />
              </View>
            </View>

            <Text className="text-slate-900 text-xl font-black text-center mb-2">Confirmer le démarrage ?</Text>
            <Text className="text-slate-500 text-center text-sm mb-5">
              Le traitement commencera aujourd'hui avec vos horaires de rappel configurés.
            </Text>

            {/* Résumé horaires */}
            <View className="bg-slate-50 rounded-2xl p-4 mb-5 flex-row justify-around">
              <View className="items-center">
                <Ionicons name="sunny" size={18} color="#F59E0B" />
                <Text className="text-slate-900 font-black text-sm mt-1">{horaires.matin}</Text>
                <Text className="text-slate-400 text-[10px]">Matin</Text>
              </View>
              <View className="items-center">
                <Ionicons name="partly-sunny" size={18} color="#F97316" />
                <Text className="text-slate-900 font-black text-sm mt-1">{horaires.midi}</Text>
                <Text className="text-slate-400 text-[10px]">Midi</Text>
              </View>
              <View className="items-center">
                <Ionicons name="moon" size={18} color="#6366F1" />
                <Text className="text-slate-900 font-black text-sm mt-1">{horaires.soir}</Text>
                <Text className="text-slate-400 text-[10px]">Soir</Text>
              </View>
            </View>

            <TouchableOpacity className="bg-sky-600 rounded-2xl py-4 items-center mb-3"
              onPress={handleStartPrescription} disabled={starting}>
              {starting ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-bold text-base">Oui, démarrer maintenant</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="bg-slate-100 rounded-2xl py-4 items-center"
              onPress={() => setModalVisible(false)} disabled={starting}>
              <Text className="text-slate-600 font-bold text-base">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DateRow({ label, value, icon }: any) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={16} color="#94A3B8" />
      <Text className="text-slate-400 text-xs font-bold ml-3 w-20">{label}</Text>
      <Text className="text-slate-800 text-sm font-medium flex-1">{value}</Text>
    </View>
  );
}

function HoraireInput({ label, icon, color, bgColor, borderColor, value, onChange }: any) {
  return (
    <View className={`flex-row items-center ${bgColor} rounded-2xl p-4 mb-3 border ${borderColor}`}>
      <Ionicons name={icon} size={22} color={color} />
      <Text className="text-slate-800 font-bold text-base ml-4 flex-1">{label}</Text>
      <TextInput
        className="bg-white px-4 py-2 rounded-xl text-center text-lg font-black text-slate-900 w-24 border border-slate-200"
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );
}

function HoraireBadge({ label, heure, icon, color }: any) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3 items-center border border-sky-100">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-slate-900 font-black text-base mt-1">{heure}</Text>
      <Text className="text-slate-400 text-[10px] font-bold uppercase">{label}</Text>
    </View>
  );
}
