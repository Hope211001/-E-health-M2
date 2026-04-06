import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const DEFAUT_HORAIRES = { matin: '08:00', midi: '12:00', soir: '20:00' };

export default function Parametres() {
  const [horaires, setHoraires] = useState(DEFAUT_HORAIRES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snap = await getDoc(doc(db, 'patients', user.uid));
        if (snap.exists() && snap.data().horairesRappel) {
          setHoraires({ ...DEFAUT_HORAIRES, ...snap.data().horairesRappel });
        }
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
    // Valider le format HH:MM
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
      await updateDoc(doc(db, 'patients', user.uid), {
        horairesRappel: horaires,
      });
      Toast.show({ type: 'success', text1: 'Horaires sauvegardés', text2: 'Vos rappels utiliseront ces horaires' });
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de sauvegarder' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <View className="bg-indigo-50 p-3 rounded-2xl mr-4">
          <Ionicons name="settings" size={20} color="#4F46E5" />
        </View>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">Mes</Text>
          <Text className="text-xl font-black text-slate-900">Paramètres</Text>
        </View>
      </View>

      <View className="p-6">
        {/* Section Horaires */}
        <View className="bg-white rounded-[30px] p-6 border border-slate-100 shadow-sm mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="alarm" size={22} color="#4F46E5" />
            <Text className="text-lg font-black text-slate-900 ml-3">Horaires de rappel</Text>
          </View>
          <Text className="text-slate-400 text-sm mb-6">
            Définissez à quelle heure vous souhaitez être rappelé pour chaque moment de la journée.
          </Text>

          {/* Matin */}
          <HoraireInput
            label="Matin"
            icon="sunny"
            color="#F59E0B"
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
            value={horaires.matin}
            onChange={(v) => setHoraires({ ...horaires, matin: v })}
          />

          {/* Midi */}
          <HoraireInput
            label="Midi"
            icon="partly-sunny"
            color="#F97316"
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            value={horaires.midi}
            onChange={(v) => setHoraires({ ...horaires, midi: v })}
          />

          {/* Soir */}
          <HoraireInput
            label="Soir"
            icon="moon"
            color="#6366F1"
            bgColor="bg-indigo-50"
            borderColor="border-indigo-200"
            value={horaires.soir}
            onChange={(v) => setHoraires({ ...horaires, soir: v })}
          />
        </View>

        {/* Info */}
        <View className="bg-indigo-50 rounded-2xl p-4 flex-row items-start mb-6 border border-indigo-100">
          <Ionicons name="information-circle" size={20} color="#4F46E5" />
          <Text className="text-indigo-700 text-xs ml-3 flex-1 leading-5">
            Ces horaires seront utilisés pour générer vos rappels de médicaments quand vous démarrez une prescription. Modifiez-les avant de démarrer un traitement.
          </Text>
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity
          className="bg-indigo-600 rounded-2xl py-5 items-center shadow-lg shadow-indigo-200"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">Sauvegarder mes horaires</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
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
