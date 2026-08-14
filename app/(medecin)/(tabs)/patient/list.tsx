import React, { useState, useCallback } from 'react'; // Ajout de useCallback ici
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Href } from 'expo-router'; // Importation de useFocusEffect
import Toast from 'react-native-toast-message';

import { patientService } from '../../../../api/patientService';
import { conversationService } from '../../../../api/conversationService';
import { Patient } from '../../../../types/collection';
import { APP_ROUTES } from '@/constants/routes';
import AppHeader from '../../../../components/AppHeader';
import AvatarUtilisateur from '../../../../components/AvatarUtilisateur';
import { libelleAge } from '@/utils/dateNaissance';

/** Nom affichable d'un patient, avec repli sur l'email si l'état civil manque. */
const nomAffiche = (p: Patient) =>
  (p.prenom || p.nom) ? `${p.prenom || ''} ${p.nom || ''}`.trim() : p.email;

export default function ListePatients() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. La fonction de récupération reste la même
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getMyPatients();
      setPatients(data);
    } catch (error: any) {
      console.error("Erreur Fetch :", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les patients'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. REMPLACEMENT DU useEffect PAR useFocusEffect
  // Cette fonction s'exécute à CHAQUE FOIS que l'écran devient actif (même après un router.back())
  useFocusEffect(
    useCallback(() => {
      fetchPatients();

      // Optionnel : cleanup si nécessaire
      return () => { };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, []);

  // --- LE RESTE DU CODE (renderItem, return, etc.) RESTE IDENTIQUE ---
  const renderPatientItem = ({ item }: { item: Patient }) => (
    <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
      <View className="flex-row items-center">
        {/* Volontairement SANS `photoURL` : une liste de 30 patients
            déclencherait 30 téléchargements Cloudinary au défilement, pour des
            vignettes de 56 px. L'avatar retombe alors sur les initiales, qui
            identifient tout aussi bien et ne coûtent aucune requête. La photo
            est chargée une seule fois, sur l'écran de détail. */}
        <AvatarUtilisateur
          prenom={item.prenom}
          nom={item.nom}
          email={item.email}
          taille={56}
        />

        <View className="flex-1 ml-4">
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ID: {item.numeroPatient}</Text>
          {/* Le nom en titre, l'email seulement en repli : un médecin cherche
              ses patients par leur nom, pas par leur adresse électronique. */}
          <Text className="text-slate-900 font-extrabold text-base" numberOfLines={1}>
            {nomAffiche(item)}
          </Text>
          {nomAffiche(item) !== item.email && (
            <Text className="text-slate-400 text-xs" numberOfLines={1}>{item.email}</Text>
          )}
          <View className="flex-row items-center mt-1">
            <Ionicons name="call-outline" size={12} color="#64748b" />
            {/* Si tu as bien fait la modif backend, item.telephone sera affiché ici */}
            <Text className="text-slate-500 text-xs ml-1">{item.telephone || "Pas de numéro"}</Text>
          </View>
          {/* Sexe et âge : deux données cliniques qui conditionnent les
              posologies. Sur leur propre ligne, la précédente étant déjà prise
              par le téléphone. Chacune est facultative, d'où le filtrage. */}
          {(item.sexe || libelleAge(item.dateNaissance)) ? (
            <View className="flex-row items-center mt-1">
              <Ionicons name="information-circle-outline" size={12} color="#64748b" />
              <Text className="text-slate-500 text-xs ml-1" numberOfLines={1}>
                {[
                  item.sexe === 'M' ? 'Masculin' : item.sexe === 'F' ? 'Féminin' : null,
                  libelleAge(item.dateNaissance),
                ].filter(Boolean).join('  ·  ')}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="bg-green-100 px-3 py-1 rounded-lg">
          <Text className="text-green-700 text-[10px] font-black">ACTIF</Text>
        </View>
      </View>

      <View className="h-[1px] bg-slate-50 my-5" />

      <View className="flex-row gap-3">
        {/* Ouvre la fiche complète : photo, données médicales et horaires de
            rappel. Tout ce qui coûte à charger y est repoussé, pour que cette
            liste reste une liste. */}
        <TouchableOpacity
          className="flex-1 bg-slate-100 h-12 rounded-2xl flex-row items-center justify-center"
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.PATIENT.DETAIL,
            params: { id: item.id }
          })}
        >
          <Ionicons name="eye-outline" size={18} color="#475569" />
          <Text className="text-slate-600 font-bold ml-2">Détail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-slate-100 h-12 rounded-2xl flex-row items-center justify-center"
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.HISTORY,
            params: { patientId: item.id }
          })}
        >
          <Ionicons name="folder-open-outline" size={18} color="#475569" />
          <Text className="text-slate-600 font-bold ml-2">Dossier</Text>
        </TouchableOpacity>

      </View>

      {/* Deuxième rangée plutôt qu'une seule de quatre : « Prescrire » et
          « Message » côte à côte tiennent, quatre libellés français sur une
          ligne seraient tronqués sur un écran étroit. */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          className="flex-1 bg-emerald-50 h-12 rounded-2xl flex-row items-center justify-center border border-emerald-100"
          onPress={async () => {
            try {
              const conv = await conversationService.getOrCreate({ patientId: item.userId || item.id });
              router.push({ pathname: '/(conversation)/chat', params: { conversationId: conv.id, contactName: nomAffiche(item) } } as any);
            } catch (e) { console.error(e); }
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#059669" />
          <Text className="text-emerald-700 font-bold ml-2">Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-emerald-600 h-12 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-200"
          onPress={() => router.push({
            pathname: APP_ROUTES.MEDECIN.ORDONNANCE.ADD_BY_PATIENT,
            params: { patientId: item.id }
          })}
        >
          <Ionicons name="medical-outline" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Prescrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Mes patients" />
      <View className="bg-white px-6 pt-4 pb-8 rounded-b-[40px] shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-emerald-600 font-bold text-xs tracking-widest">DOCTEUR</Text>
            <Text className="text-2xl font-black text-slate-900">Mes Patients</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 h-14">
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : (
        <FlatList
          data={patients.filter(p => {
            const search = searchQuery.toLowerCase();
            // Le nom fait partie des critères : c'est le titre affiché sur la
            // carte, chercher « Rakoto » sans le trouver passerait pour un bug.
            // Sécurité ?. sur les champs au cas où ils seraient nuls.
            return (p.numeroPatient?.toLowerCase() || "").includes(search) ||
              (p.email?.toLowerCase() || "").includes(search) ||
              (p.nom?.toLowerCase() || "").includes(search) ||
              (p.prenom?.toLowerCase() || "").includes(search);
          })}
          // CORRECTION ICI : On force le retour d'une string même si l'ID est absent
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderPatientItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        className="absolute bottom-10 right-8 bg-emerald-600 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-emerald-400"
        onPress={() => router.push(APP_ROUTES.MEDECIN.PATIENT.ADD as Href)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}