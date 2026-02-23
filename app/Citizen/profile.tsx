import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F, Theme } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const achievements = [
  { id: 'first',    icon: 'trophy',             label: 'First Scan',   unlocked: true,  color: '#4EC831',          date: 'Jan 15'           },
  { id: 'streak',   icon: 'flame',              label: '7-Day Streak', unlocked: true,  color: Theme.colors.orange, date: 'Jan 22'           },
  { id: 'eco',      icon: 'leaf',               label: 'Eco Warrior',  unlocked: true,  color: Theme.colors.green,  date: 'Feb 1'            },
  { id: 'hub',      icon: 'storefront-outline', label: 'Hub Regular',  unlocked: false, color: '',                  progress: '2/5 visits'   },
  { id: 'volume',   icon: 'arrow-up-outline',   label: '50kg Club',    unlocked: false, color: '',                  progress: '15.2/50 kg'   },
  { id: 'referral', icon: 'people-outline',     label: 'Social Star',  unlocked: false, color: '',                  progress: '1/3 referrals'},
];

// ─── Animated stat ─────────────────────────────────────────────────────────
const AnimatedStat: React.FC<{ value: string; label: string; delay: number; icon: string }> = ({
  value, label, delay, icon,
}) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const valueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 6 }),
        Animated.timing(valueAnim, { toValue: 1, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[styles.stat, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon as any} size={14} color={C.greenDark} />
      </View>
      <Animated.Text style={[styles.statValue, { opacity: valueAnim }]}>{value}</Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Achievement badge ──────────────────────────────────────────────────────
const AchievementBadge: React.FC<{ achievement: typeof achievements[0]; index: number }> = ({
  achievement, index,
}) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300 + index * 100),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 5 }),
    ]).start();
  }, [index]);

  const lockedBg = isDark ? C.neutral200 : C.neutral200;

  return (
    <Animated.View style={[styles.achievementBadge, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color : lockedBg }]}>
        <Ionicons
          name={achievement.icon as any}
          size={18}
          color={achievement.unlocked ? C.card : C.muted}
        />
      </View>
      <Text style={[styles.achievementLabel, !achievement.unlocked && styles.achievementLabelLocked]}>
        {achievement.label}
      </Text>
      {!achievement.unlocked && (
        <View style={styles.achievementLock}>
          <Ionicons name="lock-closed" size={10} color={C.muted} />
        </View>
      )}
    </Animated.View>
  );
};

// ─── Styles factory ────────────────────────────────────────────────────────
function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.surface },
    headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(78,200,49,0.05)' },
    content: { padding: 16, paddingTop: 12, paddingBottom: 120, gap: 14 },

    profileCard: {
      backgroundColor: C.card, borderRadius: 24, padding: 20, gap: 20,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: isDark ? '#000' : '#0C120D', shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarContainer: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
    avatar: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: C.green,
      alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.card,
    },
    avatarText: { fontSize: 22, fontFamily: F.display, color: C.card, letterSpacing: -0.5 },
    verifiedBadge: {
      position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11,
      backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: C.card,
    },
    profileInfo: { flex: 1 },
    name: { fontSize: 22, fontFamily: F.display, color: C.ink, letterSpacing: -0.3 },
    roleBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandLight,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start',
    },
    roleText: { fontSize: 11, fontFamily: F.display, color: C.greenDark },
    memberSince: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    memberSinceText: { fontSize: 11, fontFamily: F.body, color: C.muted },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    stat: {
      flex: 1, paddingVertical: 14, backgroundColor: C.brandLight, borderRadius: 18,
      alignItems: 'center', gap: 4, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
    },
    statIconWrap: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: isDark ? 'rgba(46,125,50,0.2)' : 'rgba(46,125,50,0.1)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 2,
    },
    statValue: { fontSize: 17, fontFamily: F.display, color: C.greenDark },
    statLabel: { fontSize: 10, fontFamily: F.body, color: C.muted, textAlign: 'center' },

    card: {
      backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 14,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: isDark ? '#000' : '#0C120D', shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },

    achievementsRow: { flexDirection: 'row', gap: 12, paddingVertical: 4, paddingLeft: 2 },
    achievementBadge: { alignItems: 'center', width: 70 },
    achievementIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    achievementLabel: { fontSize: 10, fontFamily: F.body, color: C.ink, textAlign: 'center' },
    achievementLabelLocked: { color: C.muted },
    achievementLock: {
      position: 'absolute', top: 30, right: 10, width: 16, height: 16, borderRadius: 8,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },

    impactRow: { flexDirection: 'row', gap: 10 },
    impactCard: {
      flex: 1, paddingVertical: 16, borderRadius: 18, backgroundColor: C.brandLight,
      alignItems: 'center', gap: 6, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
    },
    impactIconWrap: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandLight,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    impactValue: { fontSize: 18, fontFamily: F.display, color: C.ink },
    impactLabel: { fontSize: 10, fontFamily: F.body, color: C.muted, textAlign: 'center' },

    listRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
      borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8,
    },
    listRowPressed: { backgroundColor: C.wash },
    listIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.wash, alignItems: 'center', justifyContent: 'center' },
    listText: { flex: 1, fontSize: 15, fontFamily: F.body, color: C.ink },
    listBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 4 },
    listBadgeText: { fontSize: 11, fontFamily: F.display, color: C.ink },
    listMeta: { fontSize: 13, fontFamily: F.body, color: C.muted, marginRight: 4 },

    logoutButton: {
      backgroundColor: isDark ? 'rgba(176,38,30,0.15)' : '#FFEBEE',
      borderRadius: 18, paddingVertical: 16, alignItems: 'center',
      flexDirection: 'row', justifyContent: 'center', gap: 10,
      borderWidth: 1, borderColor: isDark ? 'rgba(176,38,30,0.3)' : '#FFCDD2',
    },
    logoutButtonPressed: { backgroundColor: isDark ? 'rgba(176,38,30,0.25)' : '#FFCDD2' },
    logoutText: { fontSize: 15, fontFamily: F.display, color: '#B3261E' },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 40, gap: 8,
      shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontFamily: F.display, color: C.ink, marginBottom: 12, letterSpacing: -0.3 },
    modalOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.wash, marginTop: 4,
    },
    modalOptionActive: { backgroundColor: C.brandLight, borderWidth: 1, borderColor: 'rgba(78,200,49,0.3)' },
    modalOptionPressed: { opacity: 0.8 },
    modalOptionText: { fontSize: 15, fontFamily: F.body, color: C.ink },
    modalOptionTextActive: { color: C.greenDark, fontFamily: F.display },
  });
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function CitizenProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const { t } = useTranslation();
  const { language, changeLanguage, languages } = useLanguage();
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const cardsAnim   = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const avatarScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE_DRIVER }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 4 }),
    ]).start();
    Animated.stagger(150, cardsAnim.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 6 })
    )).start();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handlePress = useCallback((action: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const earnedCount = achievements.filter((a) => a.unlocked).length;

  // Notification badge color adapts to dark mode
  const notifBadgeBg = isDark ? 'rgba(176,38,30,0.2)' : '#FFEBEE';

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        <Animated.View style={[styles.headerBackground, { opacity: headerAnim }]} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile card */}
          <Animated.View
            style={[styles.profileCard, {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
                  <Text style={styles.avatarText}>JD</Text>
                </Animated.View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>John Doe</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="leaf" size={12} color={C.greenDark} />
                  <Text style={styles.roleText}>{t('citizen.profile.title')}</Text>
                </View>
                <View style={styles.memberSince}>
                  <Ionicons name="time-outline" size={12} color={C.muted} />
                  <Text style={styles.memberSinceText}>Member since Jan 2024</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <AnimatedStat value="15.2kg" label={t('citizen.profile.stats.recycled')} delay={200} icon="sync-outline" />
              <AnimatedStat value="R 325"  label={t('citizen.profile.stats.earned')}   delay={350} icon="cash-outline" />
              <AnimatedStat value="8"      label={t('citizen.profile.stats.streak')}   delay={500} icon="flame" />
            </View>
          </Animated.View>

          {/* Achievements card */}
          <Animated.View
            style={[styles.card, {
              opacity: cardsAnim[0],
              transform: [{ translateY: cardsAnim[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}
          >
            <SectionHeader title="Achievements" meta={`${earnedCount} of ${achievements.length} unlocked`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsRow}>
              {achievements.map((achievement, index) => (
                <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Impact card */}
          <Animated.View
            style={[styles.card, {
              opacity: cardsAnim[1],
              transform: [{ translateY: cardsAnim[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}
          >
            <SectionHeader title={t('citizen.profile.impact')} meta={t('citizen.profile.impactMeta')} />
            <View style={styles.impactRow}>
              <View style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                  <Ionicons name="leaf-outline" size={20} color={C.greenDark} />
                </View>
                <Text style={styles.impactValue}>12</Text>
                <Text style={styles.impactLabel}>Trees saved</Text>
              </View>
              <View style={styles.impactCard}>
                <View style={[styles.impactIconWrap, { backgroundColor: isDark ? 'rgba(44,110,145,0.2)' : 'rgba(44,110,145,0.12)' }]}>
                  <Ionicons name="water-outline" size={20} color={C.blue} />
                </View>
                <Text style={styles.impactValue}>840L</Text>
                <Text style={styles.impactLabel}>Water saved</Text>
              </View>
              <View style={styles.impactCard}>
                <View style={[styles.impactIconWrap, { backgroundColor: isDark ? 'rgba(226,143,60,0.2)' : 'rgba(226,143,60,0.12)' }]}>
                  <Ionicons name="flash-outline" size={20} color={C.orange} />
                </View>
                <Text style={styles.impactValue}>24kg</Text>
                <Text style={styles.impactLabel}>CO₂ avoided</Text>
              </View>
            </View>
          </Animated.View>

          {/* Account card */}
          <Animated.View
            style={[styles.card, {
              opacity: cardsAnim[2],
              transform: [{ translateY: cardsAnim[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}
          >
            <SectionHeader title={t('citizen.profile.account')} meta="Manage your preferences" />
            {[
              { label: t('citizen.profile.wallet'),        icon: 'wallet-outline',       badge: 'R 325', badgeColor: C.brandLight,  onPress: () => router.push('/Citizen/wallet' as any) },
              { label: t('citizen.profile.notifications'), icon: 'notifications-outline', badge: '3',     badgeColor: notifBadgeBg,  onPress: () => router.push('/Citizen/profile-notifications' as any) },
              { label: t('citizen.profile.language'),      icon: 'globe-outline',         value: languages.find((l) => l.code === language)?.label, onPress: () => setLanguageOpen(true) },
              { label: t('citizen.profile.support'),       icon: 'help-circle-outline',   onPress: () => router.push('/Citizen/support' as any) },
            ].map((item, idx) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.listIcon}>
                    <Ionicons name={item.icon as any} size={18} color={C.greenDark} />
                  </View>
                  <Text style={styles.listText}>{item.label}</Text>
                  {item.badge && (
                    <View style={[styles.listBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.listBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.value ? <Text style={styles.listMeta}>{item.value}</Text> : null}
                  <Ionicons name="chevron-forward" size={18} color={C.muted} />
                </Pressable>
                {idx < 3 && <Divider inset={54} />}
              </View>
            ))}
          </Animated.View>

          {/* Logout */}
          <Animated.View style={{
            opacity: cardsAnim[3],
            transform: [{ translateY: cardsAnim[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}>
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={() => handlePress(() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast(t('citizen.profile.loggingOut'), 'info');
                setTimeout(() => router.replace('/Auth/login'), 800);
              })}
              accessibilityRole="button"
              accessibilityLabel={t('citizen.profile.logout')}
            >
              <Ionicons name="log-out-outline" size={18} color="#B3261E" />
              <Text style={styles.logoutText}>{t('citizen.profile.logout')}</Text>
            </Pressable>
          </Animated.View>

          {/* Language modal */}
          <Modal transparent animationType="fade" visible={languageOpen} onRequestClose={() => setLanguageOpen(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setLanguageOpen(false)}>
              <Animated.View style={styles.modalCard}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{t('citizen.profile.chooseLanguage')}</Text>
                {languages.map((option) => (
                  <Pressable
                    key={option.code}
                    style={({ pressed }) => [
                      styles.modalOption,
                      option.code === language && styles.modalOptionActive,
                      pressed && styles.modalOptionPressed,
                    ]}
                    onPress={() => {
                      changeLanguage(option.code);
                      setLanguageOpen(false);
                      showToast(t('citizen.profile.toasts.languageSet', { language: option.label }), 'success');
                    }}
                  >
                    <Text style={[styles.modalOptionText, option.code === language && styles.modalOptionTextActive]}>
                      {option.label}
                    </Text>
                    {option.code === language && (
                      <Ionicons name="checkmark-circle" size={18} color={C.greenDark} />
                    )}
                  </Pressable>
                ))}
              </Animated.View>
            </Pressable>
          </Modal>

        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
