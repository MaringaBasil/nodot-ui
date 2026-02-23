import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';

const ND = Platform.OS !== 'web';
const BRAND = '#4EC831';
const NAVY = '#1B2C3A';

const SLIDES = [
  {
    id: '1',
    step: '1/3',
    icon: 'trash-outline' as const,
    accentIcon: 'leaf-outline' as const,
    title: 'Scan, Earn\n& Recycle',
    desc: 'Scan barcodes on recyclable items and earn real cash value for every item you recycle.',
    background: require('@/assets/images/onboarding-1-scan-earn.png'),
  },
  {
    id: '2',
    step: '2/3',
    icon: 'scan-outline' as const,
    accentIcon: 'flash-outline' as const,
    title: 'Track Your\nImpact',
    desc: "Monitor your environmental impact in real-time. See exactly how much you've contributed.",
    background: require('@/assets/images/onboarding-2-track-impact.png'),
  },
  {
    id: '3',
    step: '3/3',
    icon: 'earth-outline' as const,
    accentIcon: 'sunny-outline' as const,
    title: 'Save the\nPlanet',
    desc: 'Join thousands making a difference. Together we build a sustainable future for all.',
    background: require('@/assets/images/onboarding-3-save-planet.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const slide = SLIDES[index];

  const changeSlide = (next: number) => {
    Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: ND }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: ND }).start();
    });
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) changeSlide(index + 1);
    else router.replace('/Auth/get-started');
  };

  const handleGetStarted = () => router.replace('/Auth/get-started');

  // Responsive illustration height: 56% of screen on tall phones, but cap it
  const illustrationH = Math.min(height * 0.56, 420);

  return (
    <View style={[styles.root, { width }]}>
      {/* Full-bleed background image per slide */}
      <Image
        source={slide.background}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Optional: tint overlay so text stays readable; tune opacity as needed */}
      <View style={styles.backgroundOverlay} pointerEvents="none" />
      {/* ── Illustration ── */}
      <Animated.View style={[styles.illustrationArea, { height: illustrationH, opacity: fade }]}>
        {/* Concentric ring decorations */}
        <View style={[styles.ring, { width: 300, height: 300, opacity: 0.18 }]} />
        <View style={[styles.ring, { width: 220, height: 220, opacity: 0.14 }]} />

        {/* Top-right floating accent badge */}
        <View style={styles.accentBadge}>
          <Ionicons name={slide.accentIcon} size={22} color="rgba(255,255,255,0.85)" />
        </View>

        {/* Bottom-left floating dot cluster */}
        <View style={[styles.floatDot, { bottom: 60, left: 32, width: 8, height: 8 }]} />
        <View style={[styles.floatDot, { bottom: 44, left: 52, width: 5, height: 5 }]} />
        <View style={[styles.floatDot, { top: 56, right: 80, width: 6, height: 6 }]} />

        {/* Main icon block */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name={slide.icon} size={80} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>

      {/* ── Content ── */}
      <Animated.View
        style={[
          styles.contentArea,
          { paddingBottom: insets.bottom + 28, opacity: fade },
        ]}
      >
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>{slide.step}</Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>

        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.nextCircle, pressed && { opacity: 0.7 }]}
            onPress={handleNext}
          >
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88 }]}
            onPress={handleGetStarted}
          >
            <Text style={styles.ctaText}>GET STARTED</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND,
    opacity: 0.35,
  },

  /* ── Illustration ── */
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  accentBadge: {
    position: 'absolute',
    top: 48,
    right: 36,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  iconOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Content ── */
  contentArea: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  stepText: {
    fontFamily: F.semibold,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: F.display,
    fontSize: 34,
    color: NAVY,
    letterSpacing: -0.8,
    lineHeight: 41,
    marginBottom: 12,
  },
  desc: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(27,44,58,0.72)',
    lineHeight: 23,
    marginBottom: 28,
  },

  /* ── Buttons ── */
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nextCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: F.display,
    color: NAVY,
    fontSize: 14,
    letterSpacing: 1.2,
  },
});
