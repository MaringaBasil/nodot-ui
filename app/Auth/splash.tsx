import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';

const ND = Platform.OS !== 'web';
const BRAND = '#4EC831';
const NAVY = '#1B2C3A';

export default function SplashScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: ND }),
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: ND }),
    ]).start();

    const t = setTimeout(() => router.replace('/Auth/onboarding'), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      {/* Decorative geometric overlays – light opacity polygons matching the PDF */}
      <View style={[styles.deco, styles.decoTL]} />
      <View style={[styles.deco, styles.decoTR]} />
      <View style={[styles.deco, styles.decoBL]} />
      <View style={[styles.deco, styles.decoBR]} />
      <View style={[styles.deco, styles.decoCenterDiamond]} />
      <View style={[styles.deco, styles.decoTriangleBottom]} />

      {/* Animated logo */}
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        {/* "no-" top line */}
        <Text style={styles.wordTop}>no-</Text>

        {/* "d⊙t" bottom line where ⊙ = recycling circle */}
        <View style={styles.wordBottomRow}>
          <Text style={styles.wordChar}>d</Text>
          <View style={styles.dotCircle}>
            <Ionicons name="sync" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.wordChar}>t</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Decorative geometry ── */
  deco: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decoTL: {
    width: 180,
    height: 180,
    top: -40,
    left: -40,
    transform: [{ rotate: '20deg' }],
  },
  decoTR: {
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -80,
  },
  decoBL: {
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -80,
    left: -60,
  },
  decoBR: {
    width: 160,
    height: 160,
    bottom: -30,
    right: -30,
    transform: [{ rotate: '35deg' }],
  },
  decoCenterDiamond: {
    width: 120,
    height: 120,
    top: '35%',
    right: 20,
    transform: [{ rotate: '45deg' }],
    opacity: 0.05,
  },
  decoTriangleBottom: {
    width: 200,
    height: 200,
    bottom: 80,
    left: '30%',
    transform: [{ rotate: '15deg' }],
    opacity: 0.05,
  },

  /* ── Wordmark ── */
  logoWrap: {
    alignItems: 'flex-start',
  },
  wordTop: {
    fontFamily: F.black,
    fontSize: 60,
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 66,
  },
  wordBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordChar: {
    fontFamily: F.black,
    fontSize: 60,
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  dotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 4,
  },
});
