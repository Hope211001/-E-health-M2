import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const DEFAUT_HORAIRES = { matin: '08:00', midi: '12:00', soir: '20:00' };

export default function Parametres() {
  const router = useRouter();
  const [horaires, setHoraires] = useState(DEFAUT_HORAIRES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescriptionsEnCours, setPrescriptionsEnCours] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Horaires par défaut du patient
        const patientSnap = await getDoc(doc(db, 'patients', user.uid));
        if (patientSnap.exists() && patientSnap.data().horairesRappel) {
          setHoraires({ ...DEFAUT_HORAIRES, ...patientSnap.data().horairesRappel });
        }

        // Prescriptions actives (chaque ordonnance a ses propres horaires)
        const q = query(
          collection(db, 'prescriptions'),
          where('patientId', '==', user.uid),
          where('statut', 'in', ['en_attente', 'en_cours'])
        );
        const snap = await getDocs(q);
        setPrescriptionsEnCours(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(horaires)) {
      if (!isValidTime(value)) {
        return Toast.show({
          type: 'error',
          text1: 'Format invalide',
          text2: `L'heure "${key}" doit être au format HH:MM (ex: 08:00)`,
        });
      }
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDoc(doc(db, 'patients', user.uid), { horairesRappel: horaires });
      Toast.show({
        type: 'success',
        text1: 'Horaires par défaut sauvegardés',
        text2: 'Vos prochaines ordonnances utiliseront ces horaires',
      });
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de sauvegarder' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <View className="bg-sky-50 p-3 rounded-2xl mr-4">
          <Ionicons name="settings" size={20} color="#0EA5E9" />
        </View>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">Mes</Text>
          <Text className="text-xl font-black text-slate-900">Paramètres</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>

        {/* AVERTISSEMENT IMPORTANT */}
        <View className="bg-amber-50 rounded-2xl p-4 flex-row items-start mb-6 border border-amber-200">
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <View className="flex-1 ml-3">
            <Text className="text-amber-900 text-xs font-black mb-1">À LIRE</Text>
            <Text className="text-amber-800 text-xs leading-5">
              Les horaires ci-dessous sont des <Text className="font-black">valeurs par défaut</Text> utilisées
              uniquement pour <Text className="font-black">les nouvelles ordonnances</Text> que vous démarrez.
              {'\n\n'}
              ➡️ Vos ordonnances <Text className="font-black">déjà en cours</Text> conservent leurs propres horaires
              (modifiables individuellement depuis la page de détail de chaque ordonnance).
            </Text>
          </View>
        </View>

        {/* Section Horaires par défaut */}
        <View className="bg-white rounded-[30px] p-6 border border-slate-100 shadow-sm mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="alarm" size={22} color="#0EA5E9" />
            <Text className="text-lg font-black text-slate-900 ml-3">Horaires par défaut</Text>
          </View>
          <Text className="text-slate-400 text-sm mb-6">
            Heures préremplies lorsqu'une nouvelle ordonnance est ouverte pour la première fois.
          </Text>

          <HoraireInput label="Matin" icon="sunny" color="#F59E0B"
            bgColor="bg-amber-50" borderColor="border-amber-200"
            value={horaires.matin}
            onChange={(v: string) => setHoraires({ ...horaires, matin: v })} />

          <HoraireInput label="Midi" icon="partly-sunny" color="#F97316"
            bgColor="bg-orange-50" borderColor="border-orange-200"
            value={horaires.midi}
            onChange={(v: string) => setHoraires({ ...horaires, midi: v })} />

          <HoraireInput label="Soir" icon="moon" color="#6366F1"
            bgColor="bg-sky-50" borderColor="border-sky-200"
            value={horaires.soir}
            onChange={(v: string) => setHoraires({ ...horaires, soir: v })} />

          <TouchableOpacity
            className="bg-sky-600 rounded-2xl py-4 items-center mt-4"
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text className="text-white font-bold text-sm ml-2">Sauvegarder les valeurs par défaut</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Section Mes ordonnances en cours / en attente */}
        <View className="bg-white rounded-[30px] p-6 border border-slate-100 shadow-sm mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="document-text" size={22} color="#0EA5E9" />
            <Text className="text-lg font-black text-slate-900 ml-3">Mes ordonnances</Text>
          </View>
          <Text className="text-slate-400 text-sm mb-4">
            Chaque ordonnance possède ses propres horaires. Touchez-en une pour les modifier.
          </Text>

          {prescriptionsEnCours.length === 0 ? (
            <View className="bg-slate-50 rounded-2xl p-4 items-center">
              <Text className="text-slate-400 text-xs">Aucune ordonnance active</Text>
            </View>
          ) : (
            prescriptionsEnCours.map((p) => (
              <TouchableOpacity
                key={p.id}
                className="bg-slate-50 rounded-2xl p-4 mb-2 border border-slate-100 flex-row items-center"
                onPress={() => router.push({ pathname: '/(patient)/detail-prescription', params: { id: p.id } } as any)}
              >
                <View className={`p-2 rounded-xl mr-3 ${p.statut === 'en_cours' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  <Ionicons
                    name={p.statut === 'en_cours' ? 'play-circle' : 'time'}
                    size={18}
                    color={p.statut === 'en_cours' ? '#3B82F6' : '#F59E0B'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                    {p.diagnostic || 'Ordonnance'}
                  </Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5">
                    {p.horairesRappel
                      ? `${p.horairesRappel.matin} • ${p.horairesRappel.midi} • ${p.horairesRappel.soir}`
                      : 'Horaires non configurés'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          className="bg-red-50 rounded-2xl py-4 items-center border border-red-200"
          onPress={handleLogout}
        >
          <View className="flex-row items-center">
            <Ionicons name="log-out" size={18} color="#EF4444" />
            <Text className="text-red-600 font-bold text-sm ml-2">Se déconnecter</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HoraireInput({ label, icon, color, bgColor, borderColor, value, onChange }: any) {
  return (
    <View className={`flex-row items-center ${bgColor} rounded-2xl p-4 mb-3 border ${borderColor}`}>
      <Ionicons name={icon} size={24} color={color} />
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
