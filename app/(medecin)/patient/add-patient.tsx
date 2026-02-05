import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 1. On importe 'auth' depuis ta config firebase pour avoir l'utilisateur courant
import { auth } from '../../../api/firebase'; 
import { createPatient } from '../../../api/servicePatient';

export default function AddPatientScreen() {
    const router = useRouter();

    // États du formulaire (Seulement nom et email, l'ID médecin est automatique)
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fonction de validation et soumission
    const handleCreate = async () => {
        if (!nom || !email) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        // 2. Vérification que le médecin est bien connecté
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Erreur", "Vous n'êtes pas connecté. Impossible de créer un patient.");
            return;
        }

        setIsLoading(true);
        try {
            // 3. On passe l'ID du médecin connecté (user.uid)
            const result = await createPatient(nom, email, user.uid);

            // Succès : On affiche le code généré au médecin
            Alert.alert(
                "Patient créé avec succès !",
                `Voici le code d'accès à donner au patient :\n\nCODE : ${result.accessCode}`,
                [
                    { text: "OK", onPress: () => router.back() } 
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de créer le patient. Vérifiez votre connexion.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Nouveau Patient</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#7f8c8d" />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Jean Dupont"
                        value={nom}
                        onChangeText={setNom}
                    />
                </View>

                <Text style={styles.label}>Adresse Email</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#7f8c8d" />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: jean.dupont@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#3498db" />
                    <Text style={styles.infoText}>
                        Un code d'accès sera généré automatiquement. Vous devrez le communiquer au patient pour sa première connexion.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Créer le dossier patient</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        elevation: 2,
        paddingTop: 50, 
    },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
    form: { padding: 20 },
    label: { fontSize: 16, color: '#34495e', marginBottom: 8, fontWeight: '600' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bdc3c7',
    },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#e1f5fe',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
        alignItems: 'center',
    },
    infoText: { flex: 1, marginLeft: 10, color: '#2980b9', fontSize: 14 },
    button: {
        backgroundColor: '#2ecc71',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    buttonDisabled: { backgroundColor: '#95a5a6' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});