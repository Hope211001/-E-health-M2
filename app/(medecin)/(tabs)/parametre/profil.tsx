import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../../components/AppHeader';
import { AppScrollView } from '../../../../components/AppScrollView';
import CarteProfilCompte from '../../../../components/CarteProfilCompte';
import { Colors, Spacing } from '@/constants/theme';

export default function ProfilScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppHeader subtitle="Mon profil" />

      <AppScrollView contentContainerStyle={styles.scroll} bottomOffset={20}>
        <Text style={styles.titre}>Mon profil</Text>

        <CarteProfilCompte
          couleur={Colors.primary}
          fond={Colors.primaryBg}
          icone="medkit"
          roleLabel="Médecin"
        />

        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoTxt}>
            Votre nom et votre photo sont visibles par vos patients, dans leurs
            ordonnances et dans la messagerie.
          </Text>
        </View>
      </AppScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  titre: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  info: {
    flexDirection: 'row', gap: 8,
    marginTop: Spacing.lg, paddingHorizontal: 4,
  },
  infoTxt: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
});