import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StatusBar, Image,
  TouchableOpacity, RefreshControl, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, Href } from 'expo-router';
import Toast from 'react-native-toast-message';
import { pharmacieGardeService } from '../../api/pharmacieGardeService';
import { PharmacieGarde } from '../../types/collection';
import { ZoomableImageViewer } from '../../components/ZoomableImageViewer';
import { APP_ROUTES } from '../../constants/routes';

const { width } = Dimensions.get('window');
const CARD_W = width - 40; // marge horizontale mx-5 (20px de chaque côté)

export default function PatientPharmaciesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PharmacieGarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems(await pharmacieGardeService.listVisible());
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Chargement impossible',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* --- HEADER --- */}
      <View className="px-6 pt-4 pb-6 bg-sky-500 rounded-b-[40px] shadow-lg shadow-sky-200">
        <Text className="text-sky-100 font-bold text-xs uppercase tracking-[2px]">Mediora · Santé</Text>
        <Text className="text-3xl font-black text-white mt-1">Pharmacies de garde</Text>
        <View className="flex-row items-center mt-2">
          <Ionicons name="time-outline" size={14} color="#E0F2FE" />
          <Text className="text-sky-100 ml-1 text-sm">
            {items.length} publication{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Bouton : toutes les pharmacies de Madagascar sur la carte */}
        <TouchableOpacity
          className="bg-white rounded-2xl mt-4 px-4 py-3 flex-row items-center"
          activeOpacity={0.9}
          onPress={() => router.push(APP_ROUTES.PATIENT.PHARMACIES_MAP as Href)}
        >
          <View className="bg-sky-100 w-9 h-9 rounded-xl items-center justify-center">
            <Ionicons name="map" size={18} color="#0EA5E9" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-slate-900 font-black text-sm">Carte des pharmacies</Text>
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Toute Madagascar · autour de moi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text className="mt-4 text-slate-400 font-medium">Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#0EA5E9"
            />
          }
        >
          {items.length === 0 ? (
            <View className="items-center mt-24 px-10">
              <View className="bg-sky-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name="medical-outline" size={36} color="#38BDF8" />
              </View>
              <Text className="text-slate-800 font-black text-lg text-center">Aucune pharmacie de garde</Text>
              <Text className="text-slate-400 text-center mt-1">
                Les listes publiées apparaîtront ici.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <PharmacieCard
                key={item.id}
                item={item}
                expanded={!!expanded[item.id]}
                onToggle={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}
                onZoom={setZoomUri}
              />
            ))
          )}
        </ScrollView>
      )}

      <ZoomableImageViewer
        uri={zoomUri}
        visible={!!zoomUri}
        onClose={() => setZoomUri(null)}
      />
    </SafeAreaView>
  );
}

function PharmacieCard({
  item, expanded, onToggle, onZoom,
}: {
  item: PharmacieGarde;
  expanded: boolean;
  onToggle: () => void;
  onZoom: (uri: string) => void;
}) {
  const [page, setPage] = useState(0);
  const images = item.attachement;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / CARD_W));
  };

  return (
    <View
      className="mx-5 mt-5 bg-white rounded-[28px] border border-slate-100 overflow-hidden"
      style={{ elevation: 3, shadowColor: '#0EA5E9', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
    >
      {/* Carrousel d'images */}
      {images.length > 0 && (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
          >
            {images.map((url, i) => (
              <TouchableOpacity key={i} activeOpacity={0.95} onPress={() => onZoom(url)}>
                <Image
                  source={{ uri: url }}
                  style={{ width: CARD_W, height: CARD_W, backgroundColor: '#F1F5F9' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Badge "loupe" */}
          <View className="absolute top-3 right-3 bg-black/40 px-2.5 py-1 rounded-full flex-row items-center">
            <Ionicons name="scan-outline" size={12} color="white" />
            <Text className="text-white text-[10px] font-bold ml-1">Zoom</Text>
          </View>

          {/* Points de pagination */}
          {images.length > 1 && (
            <View className="absolute bottom-3 self-center flex-row" style={{ left: 0, right: 0, justifyContent: 'center' }}>
              {images.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full mx-0.5 ${i === page ? 'bg-sky-500 w-4' : 'bg-white/70 w-1.5'}`}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Contenu */}
      <View className="p-5">
        <View className="flex-row items-center mb-3">
          <View className="bg-emerald-50 px-3 py-1 rounded-full flex-row items-center">
            <Ionicons name="medical" size={12} color="#059669" />
            <Text className="text-emerald-700 font-black text-[10px] uppercase tracking-wide ml-1">De garde</Text>
          </View>
          {images.length > 0 && (
            <Text className="text-slate-400 text-[11px] font-bold ml-2">
              {images.length} affiche{images.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {item.textPost ? (
          <>
            <Text
              className="text-slate-600 text-sm leading-5"
              numberOfLines={expanded ? undefined : 3}
            >
              {item.textPost}
            </Text>
            {item.textPost.length > 120 && (
              <TouchableOpacity onPress={onToggle} hitSlop={8}>
                <Text className="text-sky-600 font-bold text-xs mt-1">
                  {expanded ? 'Lire moins ▲' : 'Lire plus ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}
