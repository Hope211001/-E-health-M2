import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Linking,
} from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { pharmacieGardeService } from '../../../api/pharmacieGardeService';
import { PharmacieGarde } from '../../../types/collection';
import { ZoomableImageViewer } from '../../../components/ZoomableImageViewer';
import { APP_ROUTES } from '@/constants/routes';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export default function PharmacieGardeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<PharmacieGarde | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await pharmacieGardeService.getById(id!);
      setItem(data);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Chargement impossible',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  const handleToggle = async () => {
    if (!item) return;
    try {
      const { isVisible } = await pharmacieGardeService.toggleVisibilite(item.id);
      setItem({ ...item, isVisible });
      Toast.show({ type: 'success', text1: isVisible ? 'Rendu visible' : 'Masqué' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Action impossible',
      });
    }
  };

  if (loading || !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <AppScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Détail</Text>
          <Text style={styles.subtitle} numberOfLines={1}>#{item.idpost}</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({
            pathname: APP_ROUTES.ADMIN.PHARMACIE_GARDE_FORM,
            params: { id: item.id },
          })}
        >
          <Ionicons name="create-outline" size={20} color={Colors.info} />
        </TouchableOpacity>
      </View>

      {/* Visibilité */}
      <View style={styles.row}>
        <View style={[
          styles.badge,
          item.isVisible ? styles.badgeVisible : styles.badgeHidden,
        ]}>
          <View style={[styles.dot, { backgroundColor: item.isVisible ? Colors.success : Colors.textMuted }]} />
          <Text style={[styles.badgeTxt, { color: item.isVisible ? Colors.success : Colors.textMuted }]}>
            {item.isVisible ? 'Visible' : 'Masqué'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, item.isVisible ? styles.toggleMuted : styles.toggleSuccess]}
          onPress={handleToggle}
        >
          <Ionicons
            name={item.isVisible ? 'eye-off' : 'eye'}
            size={16}
            color={item.isVisible ? Colors.textMuted : Colors.success}
          />
          <Text style={[styles.toggleTxt, { color: item.isVisible ? Colors.textMuted : Colors.success }]}>
            {item.isVisible ? 'Masquer' : 'Afficher'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Texte complet */}
      {item.textPost ? (
        <View style={styles.textCard}>
          <Text style={styles.text}>{item.textPost}</Text>
        </View>
      ) : null}

      {/* Images en grand */}
      {item.attachement.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            {item.attachement.length} image(s) · appuyez pour zoomer
          </Text>
          {item.attachement.map((url, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => setZoomUri(url)}
            >
              <Image source={{ uri: url }} style={styles.bigImage} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <Text style={styles.empty}>Aucune image.</Text>
      )}

      {/* Lien vers le post original */}
      {item.urlPost ? (
        <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(item.urlPost)}>
          <Ionicons name="logo-facebook" size={18} color={Colors.info} />
          <Text style={styles.linkTxt}>Voir la publication Facebook</Text>
          <Ionicons name="open-outline" size={16} color={Colors.info} />
        </TouchableOpacity>
      ) : null}

      {/* Visualiseur plein écran : pincer pour zoomer */}
      <ZoomableImageViewer
        uri={zoomUri}
        visible={!!zoomUri}
        onClose={() => setZoomUri(null)}
      />
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: 56, paddingBottom: Spacing['3xl'] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.infoBg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  badgeVisible: { backgroundColor: Colors.successBg },
  badgeHidden: { backgroundColor: Colors.surfaceAlt },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md,
  },
  toggleSuccess: { backgroundColor: Colors.successBg },
  toggleMuted: { backgroundColor: Colors.surfaceAlt },
  toggleTxt: { fontSize: 13, fontWeight: '700' },
  textCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  text: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 },
  bigImage: {
    width: '100%',
    height: 460,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
    marginBottom: 12,
    ...Shadows.md,
  },
  empty: { color: Colors.textMuted, fontStyle: 'italic', marginVertical: Spacing.lg },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.infoBg,
    padding: 14, borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  linkTxt: { flex: 1, color: Colors.info, fontWeight: '700', fontSize: 14 },
});
