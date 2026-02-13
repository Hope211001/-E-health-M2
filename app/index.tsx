import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Inclus par défaut dans Expo
import { LinearGradient } from 'expo-linear-gradient'; // npx expo install expo-linear-gradient

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Cercle décoratif en arrière-plan */}
      <View style={styles.circleDecorator} />

      <View style={styles.content}>
        {/* LOGO MÉDICAL MODERNE */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.logoCircle}
          >
            <Ionicons name="medical" size={60} color="white" />
          </LinearGradient>
          <View style={styles.pulseDecorator} />
        </View>

        {/* TEXTES */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>PatientMed</Text>
          <Text style={styles.tagline}>Votre santé, notre priorité numérique</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.description}>
            Plateforme de gestion patient sécurisée pour les médecins et les patients.
          </Text>
        </View>

        {/* BOUTON COMMENCER */}
        <View style={styles.buttonWrapper}>
          <Link href="/login" asChild>
            <TouchableOpacity activeOpacity={0.8} style={styles.button}>
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Commencer l'aventure</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* FOOTER - PROJET M2 GL */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Projet de fin d'études</Text>
        <Text style={styles.authorText}>Pascaline — M2 GL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  circleDecorator: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    zIndex: 2,
  },
  pulseDecorator: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 5,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#BFDBFE',
    borderRadius: 2,
    marginVertical: 20,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
});