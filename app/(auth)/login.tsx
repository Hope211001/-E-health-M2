import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { APP_ROUTES } from '@/constants/routes';

// On importe directement le SERVICE et non le controller
import { authService } from '../../api/authService';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Format email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit faire au moins 6 caractères" }),
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Validation locale avec Zod
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Erreur de validation";
    Toast.show({
      type: 'error',
      text1: 'Champs invalides',
      text2: errorMessage
    });
    return;
  }

    setLoading(true);

    try {
      // 2. Appel direct du SERVICE (Axios -> Express -> Firebase)
      const user = await authService.login(email, password);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: `Bienvenue, ${user.role}`
      });

      // 3. Redirection basée sur le rôle reçu du Backend
      if (user.role === 'medecin') {
        router.replace(APP_ROUTES.MEDECIN.HOME);
      } else if (user.role === 'patient') {
        router.replace(APP_ROUTES.PATIENT.HOME );
      } else if (user.role === 'superadmin') {
        router.replace(APP_ROUTES.MEDECIN.HOME);
      }

    } catch (error: any) {
      // Gestion des erreurs (Email incorrect, mot de passe faux, etc.)
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: error.response?.data?.error || "Identifiants incorrects"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-extrabold text-blue-600">PatientMed</Text>
        <Text className="text-slate-500 mt-2">Connectez-vous à votre espace</Text>
      </View>

      <View className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
        <Text className="text-slate-700 font-bold mb-2 ml-1">Email</Text>
        <TextInput
          className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200 text-slate-900"
          placeholder="email@exemple.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text className="text-slate-700 font-bold mb-2 ml-1">Mot de passe</Text>
        <TextInput
          className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-200 text-slate-900"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-2xl items-center shadow-lg shadow-blue-300"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        className="mt-8 items-center" 
        onPress={() => router.push(APP_ROUTES.AUTH.REGISTER)}
      >
        <Text className="text-slate-500 text-base">
          Pas de compte ? <Text className="text-blue-600 font-bold">Inscrivez-vous</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}