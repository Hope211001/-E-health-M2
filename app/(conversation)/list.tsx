import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { conversationService } from '../../api/conversationService';
import { auth, db } from '../../api/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

export default function ConversationList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Modal choix médecin
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [creatingConvFor, setCreatingConvFor] = useState<string | null>(null);

  const currentUserId = auth.currentUser?.uid;

  const fetchData = async () => {
    try {
      if (currentUserId) {
        const userSnap = await getDoc(doc(db, 'users', currentUserId));
        if (userSnap.exists()) setUserRole(userSnap.data().role || '');
      }
      const data = await conversationService.getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  /**
   * Récupère tous les médecins du patient :
   * - medecinTraitantId depuis le dossier patient
   * - tous les medecinId distincts depuis les prescriptions
   */
  const fetchDoctors = async () => {
    if (!currentUserId) return;
    setLoadingDoctors(true);
    try {
      const medecinIds = new Set<string>();

      // 1. Médecin traitant
      const patientSnap = await getDoc(doc(db, 'patients', currentUserId));
      if (patientSnap.exists() && patientSnap.data().medecinTraitantId) {
        medecinIds.add(patientSnap.data().medecinTraitantId);
      }

      // 2. Médecins des prescriptions
      const prescSnap = await getDocs(
        query(collection(db, 'prescriptions'), where('patientId', '==', currentUserId))
      );
      prescSnap.docs.forEach(d => {
        const medecinId = d.data().medecinId;
        if (medecinId) medecinIds.add(medecinId);
      });

      if (medecinIds.size === 0) {
        Toast.show({ type: 'info', text1: 'Aucun médecin', text2: 'Aucun médecin associé à votre dossier' });
        return;
      }

      // 3. Récupérer les infos de chaque médecin
      const medecinTraitantId = patientSnap.exists() ? patientSnap.data().medecinTraitantId : null;
      const doctorsList: any[] = [];

      for (const id of medecinIds) {
        const userSnap = await getDoc(doc(db, 'users', id));
        const medecinSnap = await getDoc(doc(db, 'medecins', id));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const medecinData = medecinSnap.exists() ? medecinSnap.data() : {};

        const nom = `${userData.prenom || ''} ${userData.nom || ''}`.trim();
        doctorsList.push({
          uid: id,
          nom: nom || userData.email || 'Médecin',
          email: userData.email || '',
          specialite: medecinData.specialite?.[0] || 'Médecin Généraliste',
          isTraitant: id === medecinTraitantId,
        });
      }

      // Médecin traitant en premier
      doctorsList.sort((a, b) => (b.isTraitant ? 1 : 0) - (a.isTraitant ? 1 : 0));
      setDoctors(doctorsList);
      setShowDoctorModal(true);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger vos médecins' });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSelectDoctor = async (medecinId: string, medecinNom: string) => {
    setCreatingConvFor(medecinId);
    try {
      const conv = await conversationService.getOrCreate({ medecinId });
      setShowDoctorModal(false);
      router.push({ pathname: '/(conversation)/chat', params: { conversationId: conv.id, contactName: medecinNom } } as any);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de créer la conversation' });
    } finally {
      setCreatingConvFor(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Maintenant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCurrentMedecin = item.medecinId === currentUserId;
    const contactName = isCurrentMedecin ? item.patientNom : item.medecinNom;
    const contactRole = isCurrentMedecin ? 'Patient' : 'Dr.';
    const unread = isCurrentMedecin ? item.nonLuMedecin : item.nonLuPatient;

    return (
      <TouchableOpacity
        className={`bg-white rounded-3xl p-5 mb-3 border shadow-sm ${unread > 0 ? 'border-purple-200' : 'border-slate-100'}`}
        onPress={() => router.push({ pathname: '/(conversation)/chat', params: { conversationId: item.id, contactName } } as any)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${unread > 0 ? 'bg-purple-100' : 'bg-slate-100'}`}>
            <Ionicons name="person" size={24} color={unread > 0 ? '#7C3AED' : '#94A3B8'} />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className={`font-bold text-base ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                {contactRole} {contactName}
              </Text>
              <Text className="text-slate-400 text-[10px] font-bold">
                {formatDate(item.dernierMessageDate)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className={`text-sm flex-1 mr-4 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`} numberOfLines={1}>
                {item.dernierMessage || 'Aucun message'}
              </Text>
              {unread > 0 && (
                <View className="bg-purple-600 min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5">
                  <Text className="text-white text-[10px] font-black">{unread}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-5 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-50 p-3 rounded-2xl mr-4">
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View className="bg-purple-50 p-3 rounded-2xl mr-4">
          <Ionicons name="chatbubbles" size={20} color="#7C3AED" />
        </View>
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase">Mes</Text>
          <Text className="text-xl font-black text-slate-900">Conversations</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-slate-100 p-8 rounded-full mb-6">
                <Ionicons name="chatbubbles-outline" size={50} color="#94A3B8" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">Aucune conversation</Text>
              <Text className="text-slate-400 text-center mt-2">
                {userRole === 'patient'
                  ? 'Appuyez sur le bouton + pour contacter un de vos médecins.'
                  : 'Vos échanges avec vos patients apparaîtront ici.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Bouton + nouvelle conversation (patient uniquement) */}
      {userRole === 'patient' && (
        <TouchableOpacity
          className="absolute bottom-10 right-8 bg-purple-600 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-purple-400"
          onPress={fetchDoctors}
          disabled={loadingDoctors}
        >
          {loadingDoctors ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="chatbubble-ellipses" size={28} color="white" />
          )}
        </TouchableOpacity>
      )}

      {/* Modal choix du médecin */}
      <Modal visible={showDoctorModal} transparent animationType="slide" onRequestClose={() => setShowDoctorModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[30px] px-6 pt-6 pb-10 max-h-[70%]">
            {/* Handle */}
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-5" />

            <Text className="text-xl font-black text-slate-900 mb-1">Contacter un médecin</Text>
            <Text className="text-slate-400 text-sm mb-6">Choisissez le médecin avec qui vous souhaitez discuter.</Text>

            <FlatList
              data={doctors}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-slate-50 rounded-2xl p-5 mb-3 border border-slate-100 flex-row items-center"
                  onPress={() => handleSelectDoctor(item.uid, item.nom)}
                  disabled={creatingConvFor === item.uid}
                >
                  <View className="bg-purple-100 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="person" size={22} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-slate-900 font-bold text-base">Dr. {item.nom}</Text>
                      {item.isTraitant && (
                        <View className="bg-emerald-100 px-2 py-0.5 rounded-full ml-2 border border-emerald-200">
                          <Text className="text-emerald-700 text-[9px] font-black uppercase">Traitant</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-slate-400 text-xs mt-0.5">{item.specialite}</Text>
                  </View>
                  {creatingConvFor === item.uid ? (
                    <ActivityIndicator color="#7C3AED" size="small" />
                  ) : (
                    <Ionicons name="chatbubble" size={20} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-slate-400">Aucun médecin trouvé</Text>
                </View>
              }
            />

            <TouchableOpacity
              className="bg-slate-100 rounded-2xl py-4 items-center mt-3"
              onPress={() => setShowDoctorModal(false)}
            >
              <Text className="text-slate-600 font-bold">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
