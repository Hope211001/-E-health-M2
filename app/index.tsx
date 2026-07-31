import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { APP, Colors, Radius, Shadows, Spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Cercles décoratifs en arrière-plan */}
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.content}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary]}
            style={styles.logoCircle}
          >
            <Image
              source={require('../assets/images/icon-sante.png')}
              style={{ width: 76, height: 76, borderRadius: 18 }}
              resizeMode="contain"
            />
          </LinearGradient>
          <View style={styles.pulseRing} />
        </View>

        {/* TEXTES */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{APP.name}</Text>
          <Text style={styles.tagline}>{APP.tagline}</Text>

          <View style={styles.divider} />

          <Text style={styles.description}>{APP.description}</Text>
        </View>

        {/* BOUTON */}
        <View style={styles.buttonWrapper}>
          <Link href="/login" asChild>
            <TouchableOpacity activeOpacity={0.85} style={styles.button}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Projet de fin d&apos;études</Text>
        <Text style={styles.authorText}>Pascaline — M2 GL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  circleBig: {
    position: 'absolute',
    top: -width * 0.3,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: Colors.primaryBg,
  },
  circleSmall: {
    position: 'absolute',
    bottom: -width * 0.2,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: Colors.primarySoft,
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing['2xl'],
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Shadows.primary,
  },
  pulseRing: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    borderColor: Colors.primarySoft,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  divider: {
    width: 48,
    height: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
    marginVertical: Spacing.xl,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
