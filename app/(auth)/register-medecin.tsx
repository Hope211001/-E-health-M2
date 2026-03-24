import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { authService } from '../../api/authService';
import { APP_ROUTES } from '@/constants/routes';

// Schéma de validation Zod spécifique au médecin
const medecinSchema = z.object({
  email: z.string().email({ message: "Email professionnel invalide" }),
  spec: z.string().min(3, { message: "La spécialité est requise" }),
  ordre: z.string().min(5, { message: "N° d'ordre national requis" }),
  tel: z.string().min(8, { message: "Numéro de téléphone trop court" }),
  pass: z.string().min(6, { message: "Mot de passe : 6 caractères minimum" }),
  confirm: z.string()
}).refine((data) => data.pass === data.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
});

export default function RegisterMedecin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', tel: '', spec: '', ordre: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const validation = medecinSchema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: validation.error.issues[0].message
      });
      return;
    }

    setLoading(true);
    try {
      // Transformation des spécialités en tableau (séparées par des virgules)
      const specArray = form.spec.split(',').map(s => s.trim());

      await authService.registerMedecin(form.email, form.pass, form.tel, specArray, form.ordre);

      Toast.show({ type: 'success', text1: 'Compte créé', text2: 'Bienvenue au réseau PatientMed' });
      router.replace(APP_ROUTES.MEDECIN.HOME); // Redirection vers l'espace médecin

    } catch (error: any) {
      console.log("FULL ERROR OBJ:", error); // Regarde ton terminal VS Code (Front)

      Toast.show({
        type: 'error',
        text1: 'Détail Erreur',
        text2: error.response?.data?.error || error.message || "Erreur réseau"
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-violet-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>

        <View className="items-center mb-8">
          <Text className="text-3xl font-black text-violet-800">Espace Praticien</Text>
          <Text className="text-slate-500 mt-2 text-center">Créez votre profil professionnel sécurisé</Text>
        </View>

        <View className="bg-white p-6 rounded-[32px] shadow-xl shadow-violet-100 border border-white">
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="Email professionnel"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View className="flex-row gap-3 mb-4">
            <TextInput
              className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"
              placeholder="Spécialité"
              value={form.spec}
              onChangeText={(v) => setForm({ ...form, spec: v })}
            />
            <TextInput
              className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"
              placeholder="N° Ordre"
              value={form.ordre}
              onChangeText={(v) => setForm({ ...form, ordre: v })}
            />
          </View>

          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="Téléphone"
            value={form.tel}
            onChangeText={(v) => setForm({ ...form, tel: v })}
            keyboardType="phone-pad"
          />

          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="Mot de passe"
            secureTextEntry
            value={form.pass}
            onChangeText={(v) => setForm({ ...form, pass: v })}
          />

          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100"
            placeholder="Confirmer mot de passe"
            secureTextEntry
            value={form.confirm}
            onChangeText={(v) => setForm({ ...form, confirm: v })}
          />

          <TouchableOpacity
            className="bg-violet-600 p-5 rounded-2xl items-center shadow-lg shadow-violet-200"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">S'inscrire</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-8 items-center" onPress={() => router.back()}>
          <Text className="text-slate-400">Déjà membre ? <Text className="text-violet-600 font-bold">Se connecter</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}