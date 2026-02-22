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
    accentIcon: 'flash-outline' as const,
    title: 'Scan, Earn\n& Recycle',
    desc: 'Scan barcodes on recyclable items and earn real cash value for every item you recycle.',
    image: require('@/assets/images/person_scanning.png') as number,
  },
  {
    id: '2',
    step: '2/3',
    accentIcon: 'leaf-outline' as const,
    title: 'Track Your\nImpact',
    desc: "Monitor your environmental impact in real-time. See exactly how much you've contributed.",
    image: require('@/assets/images/person_standing.png') as number,
  },
  {
    id: '3',
    step: '3/3',
    accentIcon: 'sunny-outline' as const,
    title: 'Save the\nPlanet',
    desc: 'Join thousands making a difference. Together we build a sustainable future for all.',
    image: require('@/assets/images/world_Recycle.png') as number,
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
      {/* ── Illustration ── */}
      <Animated.View style={[styles.illustrationArea, { height: illustrationH, opacity: fade }]}>
        {/* Full-bleed photo */}
        <Image source={slide.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {/* Scrim so text/controls stay legible */}
        <View style={styles.imageScrim} />

        {/* Top-right floating accent badge */}
        <View style={styles.accentBadge}>
          <Ionicons name={slide.accentIcon} size={22} color="rgba(255,255,255,0.85)" />
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

  /* ── Illustration ── */
  illustrationArea: {
    overflow: 'hidden',
  },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
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
