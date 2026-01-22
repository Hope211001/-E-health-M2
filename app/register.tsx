import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../api/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient'); // Par défaut on est patient
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      // 1. Création de l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Création du profil dans Firestore avec le rôle
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nom: name,
        email: email,
        role: role, // 'medecin' ou 'patient'
        createdAt: new Date()
      });

      Alert.alert("Succès", "Compte créé avec succès !");
      
      // 3. Redirection automatique selon le rôle
      if (role === 'medecin') {
        router.replace('/medecin_home');
      } else {
        router.replace('/patient_home');
      }

    } catch (error: any) {
      Alert.alert("Erreur d'inscription", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Nom complet" 
        value={name} 
        onChangeText={setName} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Mot de passe" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <Text style={styles.label}>Je suis un :</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'patient' && styles.activeRole]} 
          onPress={() => setRole('patient')}
        >
          <Text style={role === 'patient' ? styles.activeText : {}}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, role === 'medecin' && styles.activeRole]} 
          onPress={() => setRole('medecin')}
        >
          <Text style={role === 'medecin' ? styles.activeText : {}}>Médecin</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={{ color: '#3498db', textAlign: 'center' }}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', borderRadius: 10, marginHorizontal: 5 },
  activeRole: { backgroundColor: '#3498db', borderColor: '#3498db' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});