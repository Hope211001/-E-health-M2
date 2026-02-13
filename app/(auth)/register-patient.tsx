import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { authController } from '../../controller/authController';
import { APP_ROUTES } from '../../constants/routes';

export default function RegisterPatient() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', tel: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const res = await authController.handlePatientRegistration(form.email, form.pass, form.confirm, form.tel);
    setLoading(false);
    if (res.success) router.replace(APP_ROUTES.PATIENT.HOME as Href);
    else Alert.alert("Erreur", res.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Espace Patient</Text>
      <Text style={styles.subtitle}>Créez votre dossier médical sécurisé</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
        <TextInput style={styles.input} placeholder="Téléphone" value={form.tel} onChangeText={(v) => setForm({ ...form, tel: v })} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={form.pass} onChangeText={(v) => setForm({ ...form, pass: v })} />
        <TextInput style={styles.input} placeholder="Confirmer mot de passe" secureTextEntry value={form.confirm} onChangeText={(v) => setForm({ ...form, confirm: v })} />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>S'inscrire comme Patient</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#F0F9FF', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0369A1', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: 30 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5 },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  btn: { backgroundColor: '#0EA5E9', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});