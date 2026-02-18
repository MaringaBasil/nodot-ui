import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

const roles = [
  { title: 'Citizen', detail: 'Scan, earn, and track impact', icon: 'person', route: '/Citizen/home', badge: 'Popular' },
  { title: 'Picker Mode', detail: 'Route tasks and instant payouts', icon: 'local-shipping', route: '/Picker/home', badge: null },
  { title: 'Business', detail: 'Compliance and reports', icon: 'apartment', route: '/Business/dashboard', badge: 'Pro' },
  { title: 'Admin', detail: 'Heatmaps and analytics', icon: 'admin-panel-settings', route: '/Admin/dashboard', badge: null },
];

// Social login options
const socialProviders = [
  { id: 'google', name: 'Google', icon: 'logo-google', color: '#4285F4' },
  { id: 'apple', name: 'Apple', icon: 'logo-apple', color: '#000000' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
];

// Benefits list
const benefits = [
  { icon: 'leaf', text: 'Track your environmental impact' },
  { icon: 'wallet', text: 'Earn rewards for recycling' },
  { icon: 'shield-checkmark', text: 'Secure and verified transactions' },
];

const useNativeDriver = Platform.OS !== 'web';

export default function LoginScreen() {
  const router = useRouter();
  const hero = useRef(new Animated.Value(0)).current;
  const cards = useMemo(() => roles.map(() => new Animated.Value(0)), []);
  const { width } = Dimensions.get('window');
  const { t } = useTranslation();
  const isWide = width >= 520;
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'fullName' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(hero, { toValue: 1, duration: 500, useNativeDriver }),
      Animated.stagger(
        120,
        cards.map((card) => Animated.timing(card, { toValue: 1, duration: 450, useNativeDriver }))
      ),
    ]).start();
  }, [cards, hero]);

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(route);
    setTimeout(() => {
      router.push(route);
      setLoading(null);
    }, 300);
  };

  const validate = () => {
    if (!email || !password) return 'Please enter your email and password.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (authMode === 'signup' && !fullName.trim()) return 'Please add your full name to create an account.';
    return '';
  };

  const handleAuth = (mode: 'signin' | 'signup') => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(mode);
    setTimeout(() => {
      setLoading(null);
      Alert.alert(mode === 'signin' ? t('auth.alertSignedIn') : t('auth.alertAccountCreated'), t('auth.alertWorkspace'));
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.background}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <View style={styles.blobThree} />
        <View style={styles.pattern} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: hero,
              transform: [{ translateY: hero.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}>
          <View style={styles.heroCard}>
            <View style={styles.heroBrandRow}>
              <View style={styles.heroLogoCircle}>
                <MaterialIcons name="recycling" size={20} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.heroBrandText}>{t('common.appName')} OS</Text>
            </View>
            <Text style={styles.heroTitle}>{t('auth.heroTitle')}</Text>
            <Text style={styles.heroDetail}>
              {t('auth.heroSubtitle')}
            </Text>
            <View style={styles.heroMetaRow}>
              <MaterialIcons name="shield-checkmark-outline" size={18} color={Theme.colors.greenDark} />
              <Text style={styles.heroMetaText}>{t('auth.shield')}</Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>24.6kg</Text>
                <Text style={styles.statLabel}>{t('auth.statsMonth')}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>R352</Text>
                <Text style={styles.statLabel}>{t('auth.statsEarned')}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>{t('auth.statsPickups')}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.authCard}>
          <View style={styles.authToggleRow}>
            <Pressable style={[styles.authToggle, authMode === 'signin' && styles.authToggleActive]} onPress={() => setAuthMode('signin')}>
              <Text style={[styles.authToggleText, authMode === 'signin' && styles.authToggleTextActive]}>Sign in</Text>
            </Pressable>
            <Pressable style={[styles.authToggle, authMode === 'signup' && styles.authToggleActive]} onPress={() => setAuthMode('signup')}>
              <Text style={[styles.authToggleText, authMode === 'signup' && styles.authToggleTextActive]}>Create account</Text>
            </Pressable>
          </View>
          <View style={styles.authHeader}>
            <Text style={styles.sectionLabel}>
              {authMode === 'signin' ? t('auth.welcomeBack') : t('auth.createProfile')}
            </Text>
          </View>
          <View style={styles.inputGroup}>
            {authMode === 'signup' && (
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>{t('auth.fullName')}</Text>
                <TextInput
                  placeholder="Jane Citizen"
                  placeholderTextColor={Theme.colors.muted}
                  style={[styles.input, focusedField === 'fullName' && styles.inputFocused, fullName && styles.inputFilled]}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            )}
            <View style={styles.inputWrap}>
              <Text style={styles.fieldLabel}>{t('auth.workEmail')}</Text>
              <TextInput
                placeholder="you@company.com"
                placeholderTextColor={Theme.colors.muted}
                style={[styles.input, focusedField === 'email' && styles.inputFocused, email && styles.inputFilled]}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.inputWrap}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>{t('auth.password')}</Text>
                <Text style={styles.fieldHint}>{t('auth.passwordHint')}</Text>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={Theme.colors.muted}
                  style={[styles.input, styles.inputWithIcon, focusedField === 'password' && styles.inputFocused, password && styles.inputFilled]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable style={styles.inputIcon} onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                  <MaterialIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Theme.colors.muted} />
                </Pressable>
              </View>
            </View>
          </View>
          <View style={styles.inlineRow}>
            <Pressable style={styles.inlineControl} onPress={() => setKeepSignedIn((prev) => !prev)} hitSlop={8}>
              <MaterialIcons name={keepSignedIn ? 'checkbox' : 'square-outline'} size={18} color={Theme.colors.greenDark} />
            </Pressable>
            <Text style={styles.inlineLabel}>{t('auth.keepSignedIn')}</Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.authActions}>
            <Pressable style={[styles.primaryButton, loading === authMode && styles.primaryButtonDisabled]} onPress={() => handleAuth(authMode)} disabled={loading !== null}>
              {loading === authMode ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{authMode === 'signin' ? t('auth.buttons.signIn') : t('auth.buttons.createAccount')}</Text>}
            </Pressable>
            {authMode === 'signin' ? (
              <TouchableOpacity onPress={() => Alert.alert(t('auth.forgotPassword'), t('auth.resetSent'))}>
                <Text style={styles.helperLink}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.helperText}>{t('auth.terms')}</Text>
            )}
          </View>
          <Text style={styles.helperText}>{t('auth.afterAuth')}</Text>
        </View>

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>{t('auth.chooseWorkspace')}</Text>
          <Text style={styles.sectionMeta}>{t('auth.workspaceMeta')}</Text>
        </View>

        <View style={[styles.roleGrid, { justifyContent: isWide ? 'space-between' : 'flex-start' }]}>
          {roles.map((role, index) => (
            <Animated.View
              key={role.title}
              style={[
                styles.roleCard,
                {
                  width: isWide ? (width - 84) / 2 : '100%',
                  opacity: cards[index],
                  transform: [{ translateY: cards[index].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                },
              ]}>
              <Pressable style={styles.rolePress} onPress={() => handlePress(role.route)} disabled={!!loading}>
                {loading === role.route ? (
                  <ActivityIndicator size="small" color={Theme.colors.greenDark} />
                ) : (
                  <>
                    <View style={styles.roleIcon}>
                      <MaterialIcons name={role.icon as any} size={22} color={Theme.colors.greenDark} />
                    </View>
                    <View style={styles.roleText}>
                      <Text style={styles.roleTitle}>{t(`auth.roles.${role.icon === 'local-shipping' ? 'picker' : role.icon === 'apartment' ? 'business' : role.icon === 'admin-panel-settings' ? 'admin' : 'citizen'}`)}</Text>
                      <Text style={styles.roleDetail}>{t(`auth.roleDetails.${role.icon === 'local-shipping' ? 'picker' : role.icon === 'apartment' ? 'business' : role.icon === 'admin-panel-settings' ? 'admin' : 'citizen'}`)}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color={Theme.colors.greenDark} />
                  </>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.paper,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    top: -120,
    right: -160,
  },
  blobTwo: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 248, 225, 0.5)',
    bottom: -200,
    left: -160,
  },
  blobThree: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(227, 242, 253, 0.5)',
    top: 240,
    left: -80,
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 18,
  },
  hero: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
    gap: 8,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  heroBrandText: {
    fontSize: 16,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.2,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    marginBottom: 4,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroDetail: {
    fontSize: 15,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginBottom: 16,
    lineHeight: 22,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  heroMetaText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.l,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  roleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  rolePress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    minHeight: 96,
    justifyContent: 'center',
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.2,
  },
  roleDetail: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: Theme.radius.l,
    backgroundColor: Theme.colors.greenDark,
    alignItems: 'center',
    ...Theme.shadow.subtle,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  authCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  authToggleRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    padding: 5,
  },
  authToggle: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Theme.radius.s,
  },
  authToggleActive: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadow.subtle,
  },
  authToggleText: {
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    fontSize: 14,
  },
  authToggleTextActive: {
    color: Theme.colors.ink,
    fontFamily: Theme.fonts.display,
  },
  authHeader: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputGroup: {
    gap: 10,
  },
  inputWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  fieldHint: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.m,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.ink,
    backgroundColor: Theme.colors.paper,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  inputFocused: {
    borderColor: Theme.colors.greenDark,
    backgroundColor: '#FFFFFF',
    ...Theme.shadow.subtle,
  },
  inputFilled: {
    borderColor: Theme.colors.green,
    backgroundColor: '#FFFFFF',
  },
  passwordRow: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  inlineControl: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: Theme.colors.wash,
  },
  inlineLabel: {
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
    fontSize: 14,
  },
  authActions: {
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: Theme.radius.l,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
  },
  secondaryButtonText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  helperText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  helperLink: {
    fontFamily: Theme.fonts.display,
    fontSize: 13,
    color: Theme.colors.greenDark,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#B3261E',
    marginTop: 2,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: Theme.colors.ink,
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
  },
});
