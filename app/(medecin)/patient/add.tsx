import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { authService } from '../../../api/authService';
import { auth } from '../../../api/firebase';

// Schéma de validation Zod
const patientSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  tel: z.string()
    .refine((v) => v.replace(/\D/g, '').length >= 9, {
      message: "Numéro trop court (ex: 0341234567)"
    })
    .refine((v) => v.replace(/\D/g, '').length <= 15, {
      message: "Numéro trop long"
    }),
  pass: z.string().min(6, { message: "Le mot de passe doit faire 6 caractères minimum" }),
  confirm: z.string()
}).refine((data) => data.pass === data.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
});


export default function AddPatient() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', tel: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // 1. Validation Zod
    const validation = patientSchema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de saisie',
        text2: validation.error.issues[0].message
      });
      return;
    }

    // Vérification avant l'appel
    console.log("Utilisateur actuel avant appel :", auth.currentUser?.email);

    if (!auth.currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Erreur session',
        text2: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
      return;
    }

    setLoading(true);


    try {
      // 2. Appel au Service (Backend)
      await authService.registerPatient(form.email, form.pass, form.tel);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Le dossier patient a été créé avec succès'
      });

      router.back(); // Retour à la liste des patients
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || "Une erreur est survenue"
      });
      console.log(error.response?.data?.error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-sky-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

        <View className="items-center mb-8">
          <Text className="text-3xl font-black text-sky-700">Nouveau Patient</Text>
          <Text className="text-slate-500 mt-2 text-center">Enregistrez un patient pour commencer son suivi médical</Text>
        </View>

        <View className="bg-white p-6 rounded-[32px] shadow-xl shadow-sky-100 border border-white">
          <Text className="text-slate-700 font-bold mb-2 ml-1">Adresse Email</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="patient@email.com"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Téléphone</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-1 border border-slate-100"
            placeholder="034 12 345 67"
            value={form.tel}
            onChangeText={(v) => setForm({ ...form, tel: v })}
            keyboardType="phone-pad"
          />
          <Text className="text-slate-400 text-xs ml-1 mb-4">Format Madagascar — 10 chiffres commençant par 0</Text>

          <View className="h-[1px] bg-slate-100 my-4" />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Mot de passe provisoire</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="••••••••"
            secureTextEntry
            value={form.pass}
            onChangeText={(v) => setForm({ ...form, pass: v })}
          />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Confirmer</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100"
            placeholder="••••••••"
            secureTextEntry
            value={form.confirm}
            onChangeText={(v) => setForm({ ...form, confirm: v })}
          />

          <TouchableOpacity
            className="bg-sky-600 p-5 rounded-2xl items-center shadow-lg shadow-sky-200"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Créer le dossier</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-6 items-center" onPress={() => router.back()}>
          <Text className="text-slate-400 font-medium">Annuler l'enregistrement</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}