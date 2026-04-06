import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { notificationService } from '../../api/notificationService';
import Toast from 'react-native-toast-message';

export default function NotificationList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger les notifications' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (item: any) => {
    try {
      await notificationService.markAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, lue: true } : n));

      // Si c'est un message, naviguer vers la conversation
      if (item.type === 'nouveau_message' && item.conversationId) {
        router.push({ pathname: '/(conversation)/chat', params: { conversationId: item.conversationId, contactName: '' } } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      Toast.show({ type: 'success', text1: 'Tout lu' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur' });
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  };

  const unreadCount = notifications.filter(n => !n.lue).length;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className={`rounded-3xl p-5 mb-3 border shadow-sm ${
        item.lue ? 'bg-white border-slate-100'
        : item.type === 'nouveau_message' ? 'bg-purple-50 border-purple-200'
        : 'bg-red-50 border-red-200'
      }`}
      onPress={() => handleMarkRead(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Icône selon le type */}
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
          item.lue ? 'bg-slate-100' : item.type === 'nouveau_message' ? 'bg-purple-100' : 'bg-red-100'
        }`}>
          <Ionicons
            name={item.type === 'nouveau_message' ? 'chatbubble' : 'warning'}
            size={22}
            color={item.lue ? '#94A3B8' : item.type === 'nouveau_message' ? '#7C3AED' : '#EF4444'}
          />
        </View>

        {/* Contenu */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className={`font-bold text-sm ${
              item.lue ? 'text-slate-500' : item.type === 'nouveau_message' ? 'text-purple-700' : 'text-red-700'
            }`}>
              {item.titre}
            </Text>
            {!item.lue && <View className="w-2.5 h-2.5 rounded-full bg-red-500" />}
          </View>

          <Text className={`text-sm leading-5 mb-2 ${item.lue ? 'text-slate-400' : 'text-slate-700'}`}>
            {item.message}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <Text className="text-slate-400 text-[10px] font-bold ml-1">
                {item.dateCreation ? formatTimeAgo(item.dateCreation) : ''}
              </Text>
            </View>
            {item.heurePrevu ? (
              <View className="flex-row items-center">
                <Ionicons name="alarm-outline" size={12} color="#94A3B8" />
                <Text className="text-slate-400 text-[10px] font-bold ml-1">Prévu à {item.heurePrevu}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-slate-50 p-3 rounded-2xl mr-4">
            <Ionicons name="arrow-back" size={20} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase">Centre</Text>
            <Text className="text-lg font-black text-slate-900">Notifications</Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
            <Text className="text-purple-700 font-bold text-xs">Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Badge résumé */}
      {unreadCount > 0 && (
        <View className="mx-5 mt-4 mb-2 bg-red-50 rounded-2xl p-3 flex-row items-center border border-red-100">
          <Ionicons name="notifications" size={18} color="#EF4444" />
          <Text className="text-red-700 font-bold text-xs ml-2">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-slate-100 p-8 rounded-full mb-6">
                <Ionicons name="notifications-off-outline" size={50} color="#94A3B8" />
              </View>
              <Text className="text-slate-900 text-lg font-bold">Aucune notification</Text>
              <Text className="text-slate-400 text-center mt-2">
                Vos alertes et messages apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
