import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { conversationService } from '../../api/conversationService';
import { auth } from '../../api/firebase';

const POLL_INTERVAL = 5000; // Rafraîchir les messages toutes les 5 secondes

export default function ChatScreen() {
  const { conversationId, contactName } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  const fetchMessages = async () => {
    try {
      const data = await conversationService.getMessages(conversationId as string);
      setMessages(data);
      // Marquer comme lu
      await conversationService.markAsRead(conversationId as string);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Polling pour les nouveaux messages
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSend = async () => {
    const contenu = text.trim();
    if (!contenu || sending) return;

    setSending(true);
    setText('');

    try {
      const newMsg = await conversationService.sendMessage(conversationId as string, contenu);
      setMessages(prev => [...prev, newMsg]);

      // Scroll vers le bas
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.error(e);
      setText(contenu); // Remettre le texte en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].dateEnvoi).toDateString();
    const previous = new Date(messages[index - 1].dateEnvoi).toDateString();
    return current !== previous;
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.senderId === currentUserId;

    return (
      <View>
        {/* Séparateur de date */}
        {shouldShowDateSeparator(index) && (
          <View className="items-center my-4">
            <View className="bg-slate-200 px-4 py-1.5 rounded-full">
              <Text className="text-slate-500 text-[10px] font-bold uppercase">
                {formatDateSeparator(item.dateEnvoi)}
              </Text>
            </View>
          </View>
        )}

        {/* Bulle de message */}
        <View className={`flex-row mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <View className={`max-w-[75%] rounded-3xl px-5 py-3 ${
            isMe
              ? 'bg-purple-600 rounded-br-lg'
              : 'bg-white border border-slate-100 rounded-bl-lg'
          }`}>
            <Text className={`text-[15px] leading-6 ${isMe ? 'text-white' : 'text-slate-800'}`}>
              {item.contenu}
            </Text>
            <View className={`flex-row items-center mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <Text className={`text-[10px] ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                {formatTime(item.dateEnvoi)}
              </Text>
              {isMe && (
                <Ionicons
                  name={item.lu ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={item.lu ? '#A78BFA' : '#C4B5FD'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-50 p-2.5 rounded-xl mr-3">
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View className="bg-purple-100 w-10 h-10 rounded-xl items-center justify-center mr-3">
          <Ionicons name="person" size={18} color="#7C3AED" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>
            {contactName || 'Conversation'}
          </Text>
          <Text className="text-slate-400 text-[10px] font-bold uppercase">En ligne</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#7C3AED" size="large" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="bg-purple-50 p-6 rounded-full mb-4">
                <Ionicons name="chatbubble-outline" size={40} color="#A78BFA" />
              </View>
              <Text className="text-slate-500 text-center text-sm">
                Envoyez votre premier message !
              </Text>
            </View>
          }
        />
      )}

      {/* Barre de saisie */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="bg-white px-4 py-3 border-t border-slate-100 flex-row items-end">
          <TextInput
            className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-slate-900 text-[15px] max-h-[120px] border border-slate-100"
            placeholder="Écrire un message..."
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            className={`ml-3 w-12 h-12 rounded-2xl items-center justify-center ${text.trim() ? 'bg-purple-600' : 'bg-slate-200'}`}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={18} color={text.trim() ? 'white' : '#94A3B8'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
