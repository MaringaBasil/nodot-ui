import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';

const ND = Platform.OS !== 'web';
const NAVY = '#1B2C3A';

const SLIDES = [
  {
    id: '1',
    step: '1/3',
    icon: 'trash-outline' as const,
    accentIcon: 'leaf-outline' as const,
    title: 'Scan, Earn\n& Recycle',
    desc: 'Scan barcodes on recyclable items and earn real cash value for every item you recycle.',
    bg:     require('@/assets/images/onboarding-1-scan-earn.webp'),
    bgDark: require('@/assets/images/onboarding-1-scan-earn_dark.webp'),
  },
  {
    id: '2',
    step: '2/3',
    icon: 'scan-outline' as const,
    accentIcon: 'flash-outline' as const,
    title: 'Track Your\nImpact',
    desc: "Monitor your environmental impact in real-time. See exactly how much you've contributed.",
    bg:     require('@/assets/images/onboarding-2-track-impact.webp'),
    bgDark: require('@/assets/images/onboarding-2-track-impact_dark.webp'),
  },
  {
    id: '3',
    step: '3/3',
    icon: 'earth-outline' as const,
    accentIcon: 'sunny-outline' as const,
    title: 'Save the\nPlanet',
    desc: 'Join thousands making a difference. Together we build a sustainable future for all.',
    bg:     require('@/assets/images/onboarding-3-save-planet.webp'),
    bgDark: require('@/assets/images/onboarding-3-save-planet_dark.webp'),
  },
];

// Gradient: top dark vignette (icon legibility) → transparent mid →
// dark-navy fade (text legibility). Tuned per colour scheme.
const OVERLAY_LIGHT = [
  'rgba(0,0,0,0.38)',
  'rgba(0,0,0,0.04)',
  'rgba(0,0,0,0)',
  'rgba(8,14,28,0.82)',
  'rgba(8,14,28,0.96)',
] as const;

const OVERLAY_DARK = [
  'rgba(0,0,0,0.52)',
  'rgba(0,0,0,0.06)',
  'rgba(0,0,0,0)',
  'rgba(4,8,18,0.90)',
  'rgba(4,8,18,0.98)',
] as const;

const OVERLAY_LOCATIONS = [0, 0.22, 0.42, 0.72, 1.0] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const isDark = useColorScheme() === 'dark';

  const slide = SLIDES[index];
  const bgSource = isDark ? slide.bgDark : slide.bg;
  const overlayColors = isDark ? OVERLAY_DARK : OVERLAY_LIGHT;

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

  const illustrationH = Math.min(height * 0.58, 440);

  return (
    <View style={[styles.root, { width, height }]}>
      {/* Full-bleed background image */}
      <Image
        source={bgSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Two-stop vignette: dark top + dark bottom; transparent mid reveals image */}
      <LinearGradient
        colors={overlayColors}
        locations={OVERLAY_LOCATIONS}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Illustration ── */}
      <Animated.View style={[styles.illustrationArea, { height: illustrationH, opacity: fade }]}>
        {/* Category accent badge — top-right corner */}
        <View style={styles.accentBadge}>
          <Ionicons name={slide.accentIcon} size={20} color="rgba(255,255,255,0.92)" />
        </View>

        {/* Floating ambient dots */}
        <View style={[styles.floatDot, { bottom: 60, left: 32, width: 8, height: 8 }]} />
        <View style={[styles.floatDot, { bottom: 44, left: 52, width: 5, height: 5 }]} />
        <View style={[styles.floatDot, { top: 56,  right: 80, width: 6, height: 6 }]} />

        {/* Glass-circle icon — no heavy rings that compete with the image */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name={slide.icon} size={72} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>

      {/* ── Content — rides on top of the dark-navy gradient ── */}
      <Animated.View
        style={[styles.contentArea, { paddingBottom: insets.bottom + 28, opacity: fade }]}
      >
        {/* Step counter */}
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>{slide.step}</Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>

        <View style={styles.btnRow}>
          {/* Arrow — next slide */}
          <Pressable
            style={({ pressed }) => [styles.nextCircle, pressed && { opacity: 0.65 }]}
            onPress={handleNext}
          >
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>

          {/* Get started CTA */}
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
    overflow: 'hidden',
    // Dark fallback shown while image loads
    backgroundColor: '#0C1520',
  },

  /* ── Illustration ── */
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBadge: {
    position: 'absolute',
    top: 48,
    right: 36,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  // Clean glass rings — border only, no heavy fill, so image shows through
  iconOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Content ── */
  contentArea: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
  },
  // Glass pill — blends with the dark gradient rather than punching a solid block
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
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
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 41,
    marginBottom: 12,
  },
  desc: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
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
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
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
