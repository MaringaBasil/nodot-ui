import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';

const BRAND = '#4EC831';
const NAVY = '#1B2C3A';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const GREEN_H = Math.min(height * 0.40, 320);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focused, setFocused] = useState<'username' | 'password' | null>(null);

  const handleSignIn = () => {
    // Navigate to citizen home – auth logic wired in later
    router.replace('/Citizen/home');
  };

  return (
    <View style={styles.root}>
      {/* ── Green top zone ── */}
      <View style={[styles.greenZone, { height: GREEN_H, paddingTop: insets.top + 8 }]}>
        {/* Faint decorative geometry */}
        <View style={styles.decoBlobTL} />
        <View style={styles.decoBlobBR} />

        {/* Back button */}
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoCircle}>
          <Ionicons name="sync" size={38} color={BRAND} />
        </View>
      </View>

      {/* ── White panel ── */}
      <ScrollView
        style={styles.panelScroll}
        contentContainerStyle={[styles.panelContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue recycling & earning</Text>
        </View>

        {/* Email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.inputRow, focused === 'username' && styles.inputRowFocused]}>
            <Ionicons name="mail-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#C0C0C0"
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
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputRow, focused === 'password' && styles.inputRowFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor="#C0C0C0"
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
                color="#B0B0B0"
              />
            </Pressable>
          </View>
        </View>

        {/* Remember me + Forgot password */}
        <View style={styles.rememberRow}>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setRememberMe(!rememberMe)}
            hitSlop={8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/Auth/forgot-password')} hitSlop={12}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Sign in button */}
        <Pressable
          style={({ pressed }) => [styles.navyBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSignIn}
        >
          <Text style={styles.navyBtnText}>SIGN IN</Text>
        </Pressable>

        {/* Create account button */}
        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push('/Auth/register')}
        >
          <Text style={styles.ghostBtnText}>CREATE ACCOUNT</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 32,
    overflow: 'hidden',
  },
  decoBlobTL: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    left: -60,
  },
  decoBlobBR: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    right: -40,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  /* ── White panel ── */
  panelScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    color: '#1A1D1A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    gap: 10,
  },
  inputRowFocused: {
    borderColor: BRAND,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    width: 20,
  },
  input: {
    fontFamily: F.body,
    flex: 1,
    fontSize: 15,
    color: '#1A1D1A',
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
    color: '#1A1D1A',
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
    color: NAVY,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: F.body,
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 20,
  },

  /* Buttons */
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
});
