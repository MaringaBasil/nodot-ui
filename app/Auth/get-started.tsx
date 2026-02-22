import React from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';
import { PressableScale } from '@/components/ui/PressableScale';
import * as Haptics from 'expo-haptics';

const BRAND = '#4EC831';
const NAVY = '#1B2C3A';

export default function GetStartedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const GREEN_H = Math.min(height * 0.54, 400);

  return (
    <View style={styles.root}>
      {/* ── Green top zone ── */}
      <View style={[styles.greenZone, { height: GREEN_H, paddingTop: insets.top + 20 }]}>
        {/* Faint decorative geometry */}
        <View style={[styles.decoBlobTL]} />
        <View style={[styles.decoBlobBR]} />
        <View style={[styles.decoRectLeft]} />
        <View style={[styles.decoRectRight]} />

        {/* Logo */}
        <View style={styles.logoCircle}>
          <Ionicons name="sync" size={44} color={BRAND} />
        </View>

        {/* Title */}
        <Text style={styles.titleText}>GET STARTED</Text>
        <View style={styles.titleUnderline} />
      </View>

      {/* ── White bottom panel ── */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}>
        {/* Primary action buttons */}
        <PressableScale
          style={styles.navyBtn}
          onPress={() => router.push('/Auth/sign-in')}
          haptic={Haptics.ImpactFeedbackStyle.Medium}
          scaleTo={0.97}
        >
          <Text style={styles.navyBtnText}>SIGN IN</Text>
        </PressableScale>

        <PressableScale
          style={styles.ghostBtn}
          onPress={() => router.push('/Auth/register')}
          scaleTo={0.97}
        >
          <Text style={styles.ghostBtnText}>CREATE ACCOUNT</Text>
        </PressableScale>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social login row */}
        <View style={styles.socialRow}>
          <PressableScale style={styles.socialBtn} scaleTo={0.9} haptic={Haptics.ImpactFeedbackStyle.Light}>
            <Ionicons name="logo-google" size={24} color="#FFFFFF" />
          </PressableScale>

          <PressableScale style={styles.socialBtn} scaleTo={0.9} haptic={Haptics.ImpactFeedbackStyle.Light}>
            <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
          </PressableScale>

          <PressableScale style={styles.socialBtn} scaleTo={0.9} haptic={Haptics.ImpactFeedbackStyle.Light}>
            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND,
  },

  /* ── Green zone ── */
  greenZone: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 36,
    overflow: 'hidden',
  },
  decoBlobTL: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    left: -70,
  },
  decoBlobBR: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 20,
    right: -50,
  },
  decoRectLeft: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: '30%',
    left: 24,
    transform: [{ rotate: '20deg' }],
  },
  decoRectRight: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: '20%',
    right: 30,
    transform: [{ rotate: '35deg' }],
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  titleText: {
    fontFamily: F.black,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  /* ── White panel ── */
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    gap: 14,
  },
  navyBtn: {
    backgroundColor: NAVY,
    borderRadius: 32,
    paddingVertical: 17,
    alignItems: 'center',
  },
  navyBtnText: {
    fontFamily: F.display,
    color: BRAND,
    fontSize: 14,
    letterSpacing: 1.4,
  },
  ghostBtn: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: F.display,
    color: NAVY,
    fontSize: 14,
    letterSpacing: 1.4,
  },

  /* OR divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: '#9E9E9E',
    letterSpacing: 0.5,
  },

  /* Social buttons */
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
