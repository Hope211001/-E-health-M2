import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Href, useRouter } from 'expo-router'; // 1. Import du router
import { authController } from '../../controller/authController';
import { Colors } from '../../constants/theme';
import { APP_ROUTES } from '@/constants/routes';


export default function LoginScreen() {
  const router = useRouter(); // 2. Initialisation du router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Erreur", "Remplissez tous les champs");

    setLoading(true);
    const result = await authController.handleLogin(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert("Échec de connexion", result.message);
    } else {
      // Redirection automatique après login gérée par ton AuthContext ou manuellement ici
      router.replace(APP_ROUTES.MEDECIN.HOME as Href);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>PatientMed</Text>
        <Text style={styles.subtitle}>Espace de santé sécurisé</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Adresse Email</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: jean.dupont@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.forgotPass}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Footer modifié pour proposer les deux types d'inscription */}
      {/* <View style={styles.footer}>
        <Text style={styles.footerText}>Nouveau sur l'application ?</Text>
        
        <View style={styles.registerLinks}>
          <TouchableOpacity onPress={() => router.push('/register-patient')}>
            <Text style={styles.linkTextPatient}>Je suis un Patient</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity onPress={() => router.push('/register-medecin')}>
            <Text style={styles.linkTextMedecin}>Je suis un Médecin</Text>
          </TouchableOpacity>
        </View>
      </View> */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 5 },
  form: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, fontSize: 16, color: '#1E293B' },
  forgotPass: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: '#3B82F6', fontWeight: '500' },
  button: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Nouveaux styles pour le footer
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#64748B', marginBottom: 15, fontSize: 15 },
  registerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    width: '100%',
    elevation: 2
  },
  linkTextPatient: { color: '#0EA5E9', fontWeight: 'bold', fontSize: 14 }, // Bleu Patient
  linkTextMedecin: { color: '#7C3AED', fontWeight: 'bold', fontSize: 14 }, // Violet Médecin
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 15
  }
});