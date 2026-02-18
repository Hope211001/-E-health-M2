import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { authController } from '../../../controller/authController';
import { APP_ROUTES } from '../../../constants/routes';
import { auth } from '../../../api/firebase';

export default function RegisterPatient() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', tel: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Petit check de sécurité côté client
    if (!form.email || !form.pass) {
      Alert.alert("Erreur", "Veuillez remplir les informations de connexion.");
      return;
    }

    setLoading(true);
    const res = await authController.handlePatientRegistration(form.email, form.pass, form.confirm, form.tel, auth.currentUser?.uid!,);
    setLoading(false);

    if (res.success) {
      router.replace(APP_ROUTES.MEDECIN.ORDONNANCE.ADD as Href);
    } else {
      Alert.alert("Erreur", res.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Espace Patient</Text>
            <Text style={styles.subtitle}>Créez votre dossier médical sécurisé</Text>

            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                value={form.tel}
                onChangeText={(v) => setForm({ ...form, tel: v })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                secureTextEntry
                value={form.pass}
                onChangeText={(v) => setForm({ ...form, pass: v })}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer mot de passe"
                secureTextEntry
                value={form.confirm}
                onChangeText={(v) => setForm({ ...form, confirm: v })}
              />

              <TouchableOpacity
                style={styles.btn}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>S'inscrire comme Patient</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F9FF', // Fond bleu clair patient
    paddingBottom: 40
  },
  inner: {
    padding: 25,
    flex: 1,
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0369A1', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: 30 },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  btn: {
    backgroundColor: '#0EA5E9',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});