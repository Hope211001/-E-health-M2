import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../../api/firebase';
import { prescriptionService } from '../../../../api/prescriptionService';
import Toast from 'react-native-toast-message';
import { APP_ROUTES } from '@/constants/routes';
import { imprimerOrdonnance } from '@/utils/printOrdonnance';
import { getEtablissementEntete, getMedecinLabel, getPatientEntete } from '@/utils/ordonnanceLabels';
import AppHeader from '../../../../components/AppHeader';

export default function HistoriquePrescriptions() {
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      if (patientId) {
        // Depuis le dossier d'un patient → ses ordonnances uniquement
        const data = await prescriptionService.getPrescriptionsByPatient(patientId as string);
        setPrescriptions(data);
      } else {
        // Onglet « Ordonnances » → TOUTES les ordonnances du médecin connecté
        const user = auth.currentUser;
        if (!user) { setPrescriptions([]); return; }

        const snap = await getDocs(query(
          collection(db, 'prescriptions'),
          where('medecinId', '==', user.uid),
        ));

        // Normalise les dates Firestore (Timestamp → ISO) puis trie (récent d'abord)
        const list = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            ...data,
            dateCreation: data.dateCreation?.toDate
              ? data.dateCreation.toDate().toISOString()
              : data.dateCreation,
          };
        });
        list.sort((a, b) =>
          new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime());

        // Enrichit chaque ordonnance avec le n°/email du patient concerné
        const ids = [...new Set(list.map((p) => p.patientId).filter(Boolean))];
        const patientMap: Record<string, any> = {};
        await Promise.all(ids.map(async (pid) => {
          try {
            const ps = await getDocs(query(collection(db, 'patients'), where('userId', '==', pid)));
            if (!ps.empty) patientMap[pid] = ps.docs[0].data();
          } catch { /* patient introuvable : on ignore */ }
        }));

        setPrescriptions(list.map((p) => ({ ...p, _patient: patientMap[p.patientId] })));
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger les ordonnances' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  // Recharge à chaque retour sur l'écran (ex: après création d'une ordonnance)
  useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Impression / export PDF d'une ordonnance (boîte de dialogue système)
  const handlePrint = async (item: any) => {
    try {
      setPrintingId(item.id);
      const [patient, medecinLabel, etablissement] = await Promise.all([
        getPatientEntete(item.patientId),
        getMedecinLabel(item.medecinId || auth.currentUser?.uid),
        getEtablissementEntete(item.etablissementId, item.medecinId || auth.currentUser?.uid),
      ]);
      await imprimerOrdonnance({
        ...item,
        patientLabel: patient.label
          || (patientName as string)
          || item._patient?.numeroPatient
          || item._patient?.email,
        patientDetail: patient.details,
        medecinLabel,
        etablissementLabel: etablissement.label,
        etablissementDetail: etablissement.details,
        etablissementContact: etablissement.contact,
      });
    } catch (error: any) {
      // L'annulation de la boîte système lève aussi une erreur : on reste discret
      if (!/cancel/i.test(error?.message || '')) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: "Impression impossible" });
      }
    } finally {
      setPrintingId(null);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <View className="flex-row mb-1">
      {/* Colonne Timeline (Ligne et Point) */}
      <View className="items-center mr-4 w-5">
        <View className="w-3 h-3 rounded-full bg-emerald-600 z-10 mt-6" />
        {index !== prescriptions.length - 1 && (
          <View className="w-[2px] flex-1 bg-slate-200 -mt-1" />
        )}
      </View>

      {/* Carte Ordonnance */}
      <TouchableOpacity 
        className="flex-1 bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-100"
        onPress={() => router.push({ pathname: APP_ROUTES.MEDECIN.ORDONNANCE.DETAIL, params: { id: item.id } })}
      >
        {item._patient && (
          <View className="flex-row items-center mb-3 bg-emerald-50 self-start px-3 py-1 rounded-full border border-emerald-100">
            <Ionicons name="person-circle" size={14} color="#059669" />
            <Text className="text-emerald-700 font-bold text-[11px] ml-1">
              {item._patient.numeroPatient || item._patient.email || 'Patient'}
            </Text>
          </View>
        )}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-emerald-600 font-bold text-sm">
            {new Date(item.dateCreation).toLocaleDateString('fr-FR', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#34D399" />
        </View>

        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Diagnostic</Text>
        <Text className="text-slate-900 text-base leading-6 mb-4" numberOfLines={2}>
            {item.diagnostic || "Non renseigné"}
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {item.medicaments?.slice(0, 2).map((med: any, i: number) => (
            <View key={i} className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <Text className="text-emerald-700 text-[10px] font-bold">{med.nomMedicament}</Text>
            </View>
          ))}
          {item.medicaments?.length > 2 && (
            <Text className="text-slate-400 text-[10px] self-center">+{item.medicaments.length - 2} autres</Text>
          )}
        </View>

        {/* Actions : impression / export PDF de l'ordonnance */}
        <View className="flex-row mt-4 pt-4 border-t border-slate-100">
          <TouchableOpacity
            className="flex-row items-center bg-slate-900 px-4 py-2.5 rounded-xl"
            disabled={printingId === item.id}
            onPress={() => handlePrint(item)}
          >
            {printingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="print-outline" size={15} color="#fff" />
            )}
            <Text className="text-white font-bold text-[11px] ml-2">Imprimer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Ordonnances" />
      {/* Header Moderne Tailwind */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-slate-50 p-3 rounded-2xl mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">{patientId ? 'Historique de' : 'Toutes les'}</Text>
          <Text className="text-xl font-black text-slate-900">{patientId ? (patientName || 'Dossier Patient') : 'Mes ordonnances'}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-slate-100 p-8 rounded-full mb-6">
                <Ionicons name="document-text-outline" size={50} color="#94A3B8" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">Aucune ordonnance</Text>
              <Text className="text-slate-400 text-center mt-2">
                Ce patient n'a pas encore d'historique médical enregistré.
              </Text>
              <TouchableOpacity 
                className="mt-8 bg-emerald-600 px-8 py-4 rounded-2xl"
                onPress={() => router.push((patientId
                  ? { pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT, params: { patientId } }
                  : APP_ROUTES.MEDECIN.ORDONNANCE.ADD) as any)}
              >
                <Text className="text-white font-bold">Créer une ordonnance</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}