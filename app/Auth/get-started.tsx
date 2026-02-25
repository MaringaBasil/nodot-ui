import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';
import { PressableScale } from '@/components/ui/PressableScale';
import * as Haptics from 'expo-haptics';

const BRAND = '#4EC831';
const NAVY  = '#1B2C3A';

const BG_LIGHT = require('@/assets/images/get_started_sign_in_bg.webp');
const BG_DARK  = require('@/assets/images/get_started_sign_in_bg_Dark.webp');

export default function GetStartedScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isDark  = useColorScheme() === 'dark';
  const bgSource = isDark ? BG_DARK : BG_LIGHT;

  // ── Glass material tokens ────────────────────────────────────────────────
  const blurTint      = isDark ? 'dark'       : 'extraLight';
  const rimColor      = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)';
  const glassBtnBg    = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.48)';
  const glassBtnBorder= isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.65)';
  const glassBtnText  = isDark ? '#FFFFFF' : NAVY;
  const dividerColor  = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)';
  const dividerLabel  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(27,44,58,0.45)';
  const socialBg      = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.52)';
  const socialBorder  = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.70)';
  const socialIcon    = isDark ? '#FFFFFF' : NAVY;

  // Subtle gradient: barely-there overlay so the image stays vivid
  const overlayColors = isDark
    ? ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)'] as const
    : ['rgba(0,0,0,0)',    'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.18)'] as const;

  const LOGO_AREA_H = height * 0.52;

  return (
    <View style={styles.root}>
      {/* ── Full-bleed background ── */}
      <Image source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={overlayColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Logo area — floats over the image ── */}
      <View style={[styles.logoArea, { height: LOGO_AREA_H, paddingTop: insets.top + 32 }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="sync" size={44} color={BRAND} />
        </View>
        <Text style={styles.titleText}>GET STARTED</Text>
        <View style={styles.titleUnderline} />
      </View>

      {/* ── Glass panel ── */}
      <BlurView
        intensity={85}
        tint={blurTint}
        style={[styles.panel, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Specular top rim — the hallmark of iOS glass */}
        <View style={[styles.panelRim, { backgroundColor: rimColor }]} />

        {/* Primary CTA — solid navy pops out of the glass */}
        <PressableScale
          style={styles.navyBtn}
          onPress={() => router.push('/Auth/sign-in')}
          haptic={Haptics.ImpactFeedbackStyle.Medium}
          scaleTo={0.97}
        >
          <Text style={styles.navyBtnText}>SIGN IN</Text>
        </PressableScale>

        {/* Secondary — glass treatment */}
        <PressableScale
          style={[styles.glassBtn, { backgroundColor: glassBtnBg, borderColor: glassBtnBorder }]}
          onPress={() => router.push('/Auth/register')}
          scaleTo={0.97}
        >
          <Text style={[styles.glassBtnText, { color: glassBtnText }]}>CREATE ACCOUNT</Text>
        </PressableScale>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
          <Text style={[styles.dividerText, { color: dividerLabel }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
        </View>

        {/* Social — glass circles */}
        <View style={styles.socialRow}>
          {(['logo-google', 'logo-facebook', 'logo-apple'] as const).map((icon) => (
            <PressableScale
              key={icon}
              style={[styles.socialBtn, { backgroundColor: socialBg, borderColor: socialBorder }]}
              scaleTo={0.9}
              haptic={Haptics.ImpactFeedbackStyle.Light}
            >
              <Ionicons name={icon} size={24} color={socialIcon} />
            </PressableScale>
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C1520',
  },

  /* ── Logo area ── */
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 8,
  },
  titleText: {
    fontFamily: F.black,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  /* ── Glass panel ── */
  panel: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 14,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // 1px specular rim — subtle highlight that sells the glass illusion
  panelRim: {
    position: 'absolute',
    top: 0,
    left: 36,
    right: 36,
    height: 1,
  },
  navyBtn: {
    backgroundColor: NAVY,
    borderRadius: 32,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  navyBtnText: {
    fontFamily: F.display,
    color: BRAND,
    fontSize: 14,
    letterSpacing: 1.4,
  },
  glassBtn: {
    borderWidth: 1,
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  glassBtnText: {
    fontFamily: F.display,
    fontSize: 14,
    letterSpacing: 1.4,
  },

  /* OR divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: F.semibold,
    fontSize: 13,
    letterSpacing: 0.5,
  },

  /* Social — glass circles */
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
