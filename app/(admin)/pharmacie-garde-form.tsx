import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Switch,
} from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { pharmacieGardeService } from '../../api/pharmacieGardeService';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const schema = z.object({
  urlPost: z.string().url('Lien invalide (http://...)'),
  textPost: z.string().optional(),
});

export default function PharmacieGardeFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [idpost, setIdpost] = useState('');
  const [urlPost, setUrlPost] = useState('');
  const [textPost, setTextPost] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [attachements, setAttachements] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await pharmacieGardeService.getById(id!);
        setIdpost(p.idpost);
        setUrlPost(p.urlPost);
        setTextPost(p.textPost);
        setIsVisible(p.isVisible);
        setAttachements(p.attachement.length ? p.attachement : ['']);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: error.response?.data?.error || 'Chargement impossible',
        });
        router.back();
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const updateAttachement = (index: number, value: string) => {
    setAttachements((prev) => prev.map((a, i) => (i === index ? value : a)));
  };
  const addAttachement = () => setAttachements((prev) => [...prev, '']);
  const removeAttachement = (index: number) =>
    setAttachements((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const validation = schema.safeParse({ urlPost, textPost });
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: validation.error.issues[0]?.message,
      });
      return;
    }

    const attachement = attachements.map((a) => a.trim()).filter(Boolean);

    setLoading(true);
    try {
      if (isEdit) {
        await pharmacieGardeService.update(id!, { urlPost, textPost, isVisible, attachement });
        Toast.show({ type: 'success', text1: 'Modifié' });
      } else {
        await pharmacieGardeService.create({
          idpost: idpost.trim() || undefined,
          urlPost, textPost, isVisible, attachement,
        });
        Toast.show({ type: 'success', text1: 'Ajouté' });
      }
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || 'Enregistrement impossible',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <AppScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isEdit ? 'Modifier la pharmacie' : 'Ajouter une pharmacie'}
          </Text>
          <Text style={styles.subtitle}>Pharmacie de garde</Text>
        </View>
      </View>

      <View style={styles.card}>
        {!isEdit && (
          <>
            <Text style={styles.label}>Identifiant du post (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 1234567890"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              value={idpost}
              onChangeText={setIdpost}
            />
          </>
        )}

        <Text style={styles.label}>Lien du post *</Text>
        <TextInput
          style={styles.input}
          placeholder="https://facebook.com/..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
          value={urlPost}
          onChangeText={setUrlPost}
        />

        <Text style={styles.label}>Texte</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Contenu de la publication..."
          placeholderTextColor={Colors.textMuted}
          multiline
          value={textPost}
          onChangeText={setTextPost}
        />

        <Text style={styles.label}>Pièces jointes (URLs images)</Text>
        {attachements.map((att, i) => (
          <View key={i} style={styles.attachRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="https://.../image.jpg"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
              value={att}
              onChangeText={(v) => updateAttachement(i, v)}
            />
            {attachements.length > 1 && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachement(i)}>
                <Ionicons name="close" size={18} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addAttachBtn} onPress={addAttachement}>
          <Ionicons name="add" size={16} color={Colors.info} />
          <Text style={styles.addAttachTxt}>Ajouter une pièce jointe</Text>
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Visible publiquement</Text>
            <Text style={styles.switchHint}>Affiché côté patient si activé</Text>
          </View>
          <Switch
            value={isVisible}
            onValueChange={setIsVisible}
            trackColor={{ false: Colors.border, true: Colors.success }}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.admin, Colors.adminDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.primaryBtnText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelTxt}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.md,
  },
  label: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 6, marginLeft: 4, fontSize: 14 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    padding: 14, borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: 15,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  removeBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center', justifyContent: 'center',
  },
  addAttachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: Spacing.lg,
  },
  addAttachTxt: { color: Colors.info, fontWeight: '700', fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  switchHint: { color: Colors.textMuted, fontSize: 12, marginLeft: 4 },
  primaryBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg },
  primaryBtnGradient: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontWeight: '600' },
});
