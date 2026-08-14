import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
  Keyboard, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import PharmaciesMap, { PharmaciesMapHandle, UserLocation } from '../../components/PharmaciesMap';
import { fetchPharmacies, filterPharmacies, Pharmacy } from '../../api/pharmacyService';
import { Colors, Radius, Shadows } from '@/constants/theme';

export default function PharmaciesMapScreen() {
  const router = useRouter();
  const mapRef = useRef<PharmaciesMapHandle>(null);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => (query.trim() ? filterPharmacies(pharmacies, query).slice(0, 8) : []),
    [query, pharmacies],
  );

  // Chargement des pharmacies (API Overpass / OpenStreetMap).
  useEffect(() => {
    (async () => {
      try {
        setPharmacies(await fetchPharmacies());
      } catch {
        Toast.show({ type: 'error', text1: 'Carte', text2: 'Impossible de charger les pharmacies.' });
      } finally {
        setLoading(false);
      }
    })();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'info',
          text1: 'Position désactivée',
          text2: 'La carte reste centrée sur Madagascar.',
        });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      console.warn('Géolocalisation:', e);
    } finally {
      setLocating(false);
    }
  };

  const handleRecenter = () => {
    if (userLocation) mapRef.current?.centerOnUser();
    else requestLocation();
  };

  const handleSelect = (p: Pharmacy) => {
    Keyboard.dismiss();
    setQuery('');
    mapRef.current?.focusOn(p.id);
  };

  return (
    <View style={styles.container}>
      <PharmaciesMap ref={mapRef} pharmacies={pharmacies} userLocation={userLocation} />

      {/* Barre supérieure : retour + recherche */}
      <SafeAreaView edges={['top']} style={styles.topArea} pointerEvents="box-none">
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une pharmacie / ville..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Résultats de recherche */}
        {results.length > 0 && (
          <View style={styles.results}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.map((p) => (
                <TouchableOpacity key={p.id} style={styles.resultRow} onPress={() => handleSelect(p)}>
                  <Ionicons name="location" size={16} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>{p.name}</Text>
                    {(p.city || p.street) ? (
                      <Text style={styles.resultSub} numberOfLines={1}>
                        {[p.street, p.city].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {/* Compteur */}
      {!loading && (
        <View style={styles.countBadge} pointerEvents="none">
          <Ionicons name="medkit" size={13} color={Colors.primary} />
          <Text style={styles.countTxt}>{pharmacies.length} pharmacies</Text>
        </View>
      )}

      {/* Bouton recentrer sur ma position */}
      <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.85}>
        {locating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="locate" size={22} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {/* Chargement initial */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTxt}>Chargement de la carte...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topArea: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 44,
    ...Shadows.md,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  results: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginTop: 8,
    marginLeft: 52,
    maxHeight: 260,
    overflow: 'hidden',
    ...Shadows.md,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  resultSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  countBadge: {
    position: 'absolute', bottom: 24, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadows.md,
  },
  countTxt: { color: Colors.textPrimary, fontWeight: '700', fontSize: 12 },
  recenterBtn: {
    position: 'absolute', bottom: 24, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    paddingVertical: 20, paddingHorizontal: 28,
    borderRadius: Radius.lg, alignItems: 'center',
    ...Shadows.md,
  },
  loadingTxt: { marginTop: 12, color: Colors.textSecondary, fontWeight: '600' },
});
