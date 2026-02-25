import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const TEAM = [
  { id: '1', name: 'Sarah Johnson',  role: 'Owner',   initials: 'SJ', color: '#4EC831' },
  { id: '2', name: 'Mike van der Berg', role: 'Manager', initials: 'MV', color: '#2C6E91' },
  { id: '3', name: 'Amara Dlamini',  role: 'Viewer',  initials: 'AD', color: '#7B52AB' },
];

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    header: {
      paddingHorizontal: 20, paddingBottom: 22,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    headerBlobTL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
    headerBlobBR: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { gap: 1 },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16, paddingBottom: 40 },
    section: { gap: 10 },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },

    /* Business profile card */
    profileCard: {
      backgroundColor: C.card, borderRadius: 20,
      borderWidth: 1, borderColor: cardBorder,
      padding: 20, gap: 16,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    profileAvatar: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'rgba(78,200,49,0.40)',
    },
    profileAvatarText: { fontFamily: F.display, fontSize: 20, color: C.brand },
    profileInfo: { flex: 1, gap: 3 },
    profileName: { fontFamily: F.display, fontSize: 18, color: C.ink, letterSpacing: -0.3 },
    profileReg: { fontFamily: F.body, fontSize: 13, color: C.muted },
    verifiedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: isDark ? 'rgba(78,200,49,0.15)' : 'rgba(78,200,49,0.10)',
      borderRadius: 12, borderWidth: 1, borderColor: 'rgba(78,200,49,0.35)',
    },
    verifiedText: { fontFamily: F.semibold, fontSize: 11, color: '#4EC831' },
    profileMetaRow: { flexDirection: 'row', gap: 8 },
    profileTag: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
      backgroundColor: isDark ? C.neutral100 : '#F0F0F0',
    },
    profileTagText: { fontFamily: F.semibold, fontSize: 11, color: C.muted },
    editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: cardBorder },
    editText: { fontFamily: F.semibold, fontSize: 13, color: C.brand },

    /* Card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },
    dividerFull: { height: 1, backgroundColor: cardBorder },

    /* Team rows */
    teamRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    teamAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    teamAvatarText: { fontFamily: F.bold, fontSize: 14, color: '#FFFFFF' },
    teamInfo: { flex: 1, gap: 2 },
    teamName: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    roleOwner: { backgroundColor: isDark ? 'rgba(78,200,49,0.15)' : 'rgba(78,200,49,0.10)' },
    roleManager: { backgroundColor: isDark ? 'rgba(44,110,145,0.18)' : '#EBF4FD' },
    roleViewer: { backgroundColor: isDark ? C.neutral100 : '#F5F5F5' },
    roleText: { fontFamily: F.semibold, fontSize: 11 },
    roleOwnerText: { color: '#4EC831' },
    roleManagerText: { color: '#2C6E91' },
    roleViewerText: { color: C.muted },
    inviteRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    inviteIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(78,200,49,0.25)', borderStyle: 'dashed' },
    inviteText: { fontFamily: F.semibold, fontSize: 14, color: C.brand },

    /* Plan card */
    planCard: {
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: cardBorder,
      overflow: 'hidden',
    },
    planInner: { padding: 16, gap: 4 },
    planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planName: { fontFamily: F.display, fontSize: 17, color: C.ink, letterSpacing: -0.2 },
    planRenewal: { fontFamily: F.body, fontSize: 13, color: C.muted },
    upgradePill: {
      paddingHorizontal: 12, paddingVertical: 5,
      backgroundColor: C.navy, borderRadius: 12,
      borderWidth: 1, borderColor: 'rgba(78,200,49,0.35)',
    },
    upgradeText: { fontFamily: F.semibold, fontSize: 12, color: C.brand },
    planDivider: { height: 1, backgroundColor: cardBorder },
    planFeatures: { flexDirection: 'row', padding: 14, gap: 8, flexWrap: 'wrap' },
    featurePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    featureText: { fontFamily: F.body, fontSize: 12, color: C.muted },

    /* Settings rows */
    settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    settingsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.brandLight },
    settingsIconDestructive: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },
    settingsLabel: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.ink },
    settingsLabelDestructive: { color: '#C62828' },
    settingsMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const sectionAnims = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;

  const animateIn = useCallback(() => {
    Animated.stagger(100, sectionAnims.map((anim) =>
      Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: UND })
    )).start();
  }, [sectionAnims]);

  useEffect(() => { animateIn(); }, [animateIn]);

  const animatedSection = (index: number) => ({
    opacity: sectionAnims[index],
    transform: [{ translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Owner':   return { pill: styles.roleOwner,   text: styles.roleOwnerText   };
      case 'Manager': return { pill: styles.roleManager, text: styles.roleManagerText };
      default:        return { pill: styles.roleViewer,  text: styles.roleViewerText  };
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        {/* ── Header ── */}
        <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerBlobTL} />
          <View style={styles.headerBlobBR} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerSub}>Your business</Text>
              <Text style={styles.headerTitle}>Account</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => router.push('/Business/notifications' as any)}>
              <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* ── Business profile ── */}
          <Animated.View style={animatedSection(0)}>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>RC</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Recycle Corp Pty</Text>
                  <Text style={styles.profileReg}>Reg: 2019/041234/07</Text>
                </View>
              </View>
              <View style={styles.profileMetaRow}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#4EC831" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>Commercial Waste</Text>
                </View>
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>Johannesburg</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [styles.editRow, pressed && styles.pressed]} onPress={() => haptic()}>
                <Ionicons name="pencil" size={14} color={C.brand} />
                <Text style={styles.editText}>Edit business details</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Team ── */}
          <Animated.View style={[styles.section, animatedSection(1)]}>
            <Text style={styles.sectionTitle}>Team</Text>
            <View style={styles.card}>
              {TEAM.map((member, idx) => {
                const rs = getRoleStyle(member.role);
                return (
                  <View key={member.id}>
                    <View style={styles.teamRow}>
                      <View style={[styles.teamAvatar, { backgroundColor: member.color }]}>
                        <Text style={styles.teamAvatarText}>{member.initials}</Text>
                      </View>
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{member.name}</Text>
                      </View>
                      <View style={[styles.rolePill, rs.pill]}>
                        <Text style={[styles.roleText, rs.text]}>{member.role}</Text>
                      </View>
                    </View>
                    {idx < TEAM.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
              <View style={styles.dividerFull} />
              <Pressable style={({ pressed }) => [styles.inviteRow, pressed && styles.pressed]} onPress={() => haptic()}>
                <View style={styles.inviteIcon}>
                  <Ionicons name="add" size={20} color={C.brand} />
                </View>
                <Text style={styles.inviteText}>Invite team member</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Subscription plan ── */}
          <Animated.View style={[styles.section, animatedSection(2)]}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.planCard}>
              <View style={styles.planInner}>
                <View style={styles.planRow}>
                  <Text style={styles.planName}>Professional</Text>
                  <Pressable style={({ pressed }) => [styles.upgradePill, pressed && styles.pressed]} onPress={() => haptic()}>
                    <Text style={styles.upgradeText}>Upgrade</Text>
                  </Pressable>
                </View>
                <Text style={styles.planRenewal}>Renews 15 Mar 2026</Text>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planFeatures}>
                {['5 sites', 'Unlimited pickups', 'Analytics', '3 users'].map((f) => (
                  <View key={f} style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={13} color={C.brand} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── Settings ── */}
          <Animated.View style={[styles.section, animatedSection(3)]}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.card}>
              {[
                { icon: 'map-outline',           label: 'Manage Sites',    meta: '4 active sites',   route: '/Business/sites' as const,         destructive: false },
                { icon: 'notifications-outline', label: 'Notifications',   meta: 'All alerts on',    route: '/Business/notifications' as const, destructive: false },
                { icon: 'help-circle-outline',   label: 'Support',         meta: 'Help & contact',   route: '/Business/support' as const,       destructive: false },
              ].map((row, idx) => (
                <View key={row.label}>
                  <Pressable
                    style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
                    onPress={() => { haptic(); router.push(row.route as any); }}
                  >
                    <View style={styles.settingsIcon}>
                      <Ionicons name={row.icon as any} size={18} color={C.brand} />
                    </View>
                    <Text style={styles.settingsLabel}>{row.label}</Text>
                    <Text style={styles.settingsMeta}>{row.meta}</Text>
                    <Ionicons name="chevron-forward" size={16} color={C.muted} />
                  </Pressable>
                  <View style={styles.divider} />
                </View>
              ))}
              <Pressable
                style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
                onPress={() => { haptic(); router.replace('/Auth/get-started' as any); }}
              >
                <View style={[styles.settingsIcon, styles.settingsIconDestructive]}>
                  <Ionicons name="log-out-outline" size={18} color="#C62828" />
                </View>
                <Text style={[styles.settingsLabel, styles.settingsLabelDestructive]}>Sign Out</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
