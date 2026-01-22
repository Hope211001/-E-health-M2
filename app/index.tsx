import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Link,useRouter } from 'expo-router';

export default function App() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion de Patients</Text>
      <Text style={styles.subtitle}>Projet de Pascaline (M2 GL)</Text>

      {/* <TouchableOpacity style={styles.button} onPress={() => alert('Bientôt : Connexion Firebase')}>
        <Text style={styles.buttonText}>Se Connecter</Text>
      </TouchableOpacity> */}

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Se Connecter</Text>
        </TouchableOpacity>
      </Link>

         <TouchableOpacity
          onPress={() => router.push('/register')}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: '#3498db', textAlign: 'center' }}>
            Pas de compte ? Créer un compte
          </Text>
        </TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});