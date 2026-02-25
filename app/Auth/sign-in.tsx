import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function SignInScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isDark  = useColorScheme() === 'dark';
  const bgSource = isDark ? BG_DARK : BG_LIGHT;

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focused, setFocused]       = useState<'username' | 'password' | null>(null);

  const handleSignIn = () => router.replace('/Citizen/home');

  // ── Glass material tokens ────────────────────────────────────────────────
  const blurTint         = isDark ? 'dark'       : 'extraLight';
  const rimColor         = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)';
  const headingColor     = isDark ? '#FFFFFF'     : NAVY;
  const subColor         = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(27,44,58,0.55)';
  const labelColor       = isDark ? 'rgba(255,255,255,0.80)' : NAVY;
  const inputBg          = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)';
  const inputBorder      = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.65)';
  const inputBorderFocus = BRAND;
  const inputText        = isDark ? '#FFFFFF'     : NAVY;
  const placeholderColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(27,44,58,0.35)';
  const iconColor        = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(27,44,58,0.40)';
  const rememberColor    = isDark ? 'rgba(255,255,255,0.75)' : NAVY;
  const signupTextColor  = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(27,44,58,0.50)';
  const signupLinkColor  = isDark ? '#FFFFFF'     : NAVY;

  const overlayColors = isDark
    ? ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)'] as const
    : ['rgba(0,0,0,0)',    'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.18)'] as const;

  const LOGO_AREA_H = height * 0.30;

  return (
    <View style={styles.root}>
      {/* ── Full-bleed background ── */}
      <Image source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={overlayColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Back button — glass pill ── */}
      <BlurView
        intensity={60}
        tint="dark"
        style={[styles.backBtnBlur, { top: insets.top + 12 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.backBtnInner, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
      </BlurView>

      {/* ── Logo — floats over image ── */}
      <View style={[styles.logoArea, { height: LOGO_AREA_H, paddingTop: insets.top + 52 }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="sync" size={38} color={BRAND} />
        </View>
      </View>

      {/* ── Glass panel with form ── */}
      <BlurView
        intensity={85}
        tint={blurTint}
        style={styles.panel}
      >
        {/* Specular top rim */}
        <View style={[styles.panelRim, { backgroundColor: rimColor }]} />

        <ScrollView
          contentContainerStyle={[styles.panelContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={styles.headingWrap}>
            <Text style={[styles.heading, { color: headingColor }]}>Welcome back</Text>
            <Text style={[styles.subheading, { color: subColor }]}>
              Sign in to continue recycling & earning
            </Text>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: labelColor }]}>Email</Text>
            <View style={[
              styles.inputRow,
              { backgroundColor: inputBg, borderColor: focused === 'username' ? inputBorderFocus : inputBorder },
            ]}>
              <Ionicons name="mail-outline" size={18} color={iconColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: inputText }]}
                placeholder="your@email.com"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: labelColor }]}>Password</Text>
            <View style={[
              styles.inputRow,
              { backgroundColor: inputBg, borderColor: focused === 'password' ? inputBorderFocus : inputBorder },
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={iconColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1, color: inputText }]}
                placeholder="Enter your password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showPw}
                textContentType="password"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10} style={styles.eyeBtn}>
                <Ionicons
                  name={showPw ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={iconColor}
                />
              </Pressable>
            </View>
          </View>

          {/* Remember + Forgot */}
          <View style={styles.rememberRow}>
            <Pressable style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} hitSlop={8}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={[styles.rememberText, { color: rememberColor }]}>Remember me</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/Auth/forgot-password')} hitSlop={12}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Sign in — solid navy stands out from glass */}
          <PressableScale
            style={styles.navyBtn}
            onPress={handleSignIn}
            haptic={Haptics.ImpactFeedbackStyle.Medium}
            scaleTo={0.97}
          >
            <Text style={styles.navyBtnText}>SIGN IN</Text>
          </PressableScale>

          {/* No account nudge */}
          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: signupTextColor }]}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/Auth/register')} hitSlop={10}>
              <Text style={[styles.signupLink, { color: signupLinkColor }]}>Create one</Text>
            </Pressable>
          </View>
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C1520',
  },

  /* ── Back button — glass pill ── */
  backBtnBlur: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    zIndex: 10,
  },
  backBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Logo area ── */
  logoArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },

  /* ── Glass panel ── */
  panel: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  panelRim: {
    position: 'absolute',
    top: 0,
    left: 36,
    right: 36,
    height: 1,
    zIndex: 1,
  },
  panelContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    gap: 16,
  },

  /* Fields */
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  inputIcon: {
    width: 20,
  },
  input: {
    fontFamily: F.body,
    flex: 1,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },

  /* Remember / Forgot */
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  rememberText: {
    fontFamily: F.body,
    fontSize: 14,
  },
  forgotText: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: BRAND,
  },

  /* Heading */
  headingWrap: {
    marginBottom: 4,
  },
  heading: {
    fontFamily: F.display,
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: F.body,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Buttons */
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
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  signupText: {
    fontFamily: F.body,
    fontSize: 14,
  },
  signupLink: {
    fontFamily: F.semibold,
    fontSize: 14,
  },
});
