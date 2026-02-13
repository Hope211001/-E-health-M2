import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { authController } from '../../controller/authController';
import { APP_ROUTES } from '../../constants/routes';

export default function RegisterMedecin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', tel: '', spec: '', ordre: '', pass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const res = await authController.handleMedecinRegistration(form.email, form.pass, form.confirm, form.tel, form.spec, form.ordre);
    setLoading(false);
    if (res.success) router.replace(APP_ROUTES.MEDECIN.HOME as Href) ; 
    else Alert.alert("Erreur", res.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Espace Praticien</Text>
      <Text style={styles.subtitle}>Rejoignez le réseau médical professionnel</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Email professionnel" value={form.email} onChangeText={(v)=>setForm({...form, email: v})} />
        <TextInput style={styles.input} placeholder="Spécialité(s)" value={form.spec} onChangeText={(v)=>setForm({...form, spec: v})} />
        <TextInput style={styles.input} placeholder="N° d'ordre national" value={form.ordre} onChangeText={(v)=>setForm({...form, ordre: v})} />
        <TextInput style={styles.input} placeholder="Téléphone" value={form.tel} onChangeText={(v)=>setForm({...form, tel: v})} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={form.pass} onChangeText={(v)=>setForm({...form, pass: v})} />
        <TextInput style={styles.input} placeholder="Confirmer mot de passe" secureTextEntry value={form.confirm} onChangeText={(v)=>setForm({...form, confirm: v})} />

        <TouchableOpacity style={styles.btnMed} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>S'inscrire comme Médecin</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#F5F3FF', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#5B21B6', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: 30 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5 },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  btnMed: { backgroundColor: '#7C3AED', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});