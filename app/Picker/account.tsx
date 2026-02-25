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
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const DRIVER = {
  initials: 'TN',
  name: 'Themba Nkosi',
  id: 'PKR-0042',
  rating: '4.8',
  since: 'Member since Jan 2025',
  verified: true,
};

const VEHICLE = {
  type: 'Bakkie / Light truck',
  reg: 'GP 42 ABC',
  capacity: '500 kg',
};

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },

    /* Profile card */
    profileCard: {
      borderRadius: 22, overflow: 'hidden', padding: 22,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    profileBlobTL: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, left: -40 },
    profileBlobBR: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(78,200,49,0.08)', bottom: -30, right: -20 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarCircle: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.30)',
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: F.display, fontSize: 22, color: '#FFFFFF' },
    profileInfo: { flex: 1, gap: 3 },
    profileName: { fontFamily: F.display, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },
    profileId: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    profileSince: { fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.50)' },
    profileFooter: { flexDirection: 'row', gap: 10, marginTop: 18 },
    profileStat: {
      flex: 1, alignItems: 'center', gap: 2,
      paddingVertical: 10, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    profileStatValue: { fontFamily: F.bold, fontSize: 15, color: '#FFFFFF' },
    profileStatLabel: { fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    verifiedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start',
      backgroundColor: 'rgba(78,200,49,0.20)', borderWidth: 1, borderColor: 'rgba(78,200,49,0.40)',
      marginTop: 14,
    },
    verifiedText: { fontFamily: F.semibold, fontSize: 12, color: '#4EC831' },

    /* Generic card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },
    dividerFull: { height: 1, backgroundColor: cardBorder },

    /* Vehicle row */
    vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    vehicleIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    vehicleInfo: { flex: 1, gap: 2 },
    vehicleLabel: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    vehicleMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },

    /* Settings rows */
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
    settingIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink },
    settingDestructive: { color: '#C62828' },
    settingIconDestructive: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },

    pressed: { opacity: 0.7 },
  });
}

export default function PickerAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [toast, setToast] = React.useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.root}>
          <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
          >
            {/* ── Profile card ── */}
            <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
              <View style={styles.profileBlobTL} />
              <View style={styles.profileBlobBR} />
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{DRIVER.initials}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{DRIVER.name}</Text>
                  <Text style={styles.profileId}>Driver ID: {DRIVER.id}</Text>
                  <Text style={styles.profileSince}>{DRIVER.since}</Text>
                </View>
              </View>
              {DRIVER.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#4EC831" />
                  <Text style={styles.verifiedText}>Verified driver</Text>
                </View>
              )}
              <View style={styles.profileFooter}>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>{DRIVER.rating}</Text>
                  <Text style={styles.profileStatLabel}>Rating</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>42</Text>
                  <Text style={styles.profileStatLabel}>Total jobs</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>R 1,240</Text>
                  <Text style={styles.profileStatLabel}>Earned</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Vehicle ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <View style={styles.card}>
                {[
                  { icon: 'car-outline' as const,    label: 'Vehicle type',  meta: VEHICLE.type },
                  { icon: 'id-card-outline' as const, label: 'Registration', meta: VEHICLE.reg  },
                  { icon: 'scale-outline' as const,  label: 'Max capacity',  meta: VEHICLE.capacity },
                ].map((v, idx, arr) => (
                  <View key={v.label}>
                    <View style={styles.vehicleRow}>
                      <View style={styles.vehicleIcon}>
                        <Ionicons name={v.icon} size={18} color={C.brand} />
                      </View>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleLabel}>{v.label}</Text>
                        <Text style={styles.vehicleMeta}>{v.meta}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Settings ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.card}>
                {[
                  { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => { haptic(); router.push('/Picker/notifications' as any); } },
                  { icon: 'help-circle-outline' as const,   label: 'Support',       onPress: () => { haptic(); router.push('/Picker/support' as any); }       },
                  { icon: 'pencil-outline' as const,        label: 'Edit profile',  onPress: () => { haptic(); toast_('Edit profile — coming soon', 'info'); } },
                ].map((s, idx, arr) => (
                  <View key={s.label}>
                    <Pressable style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]} onPress={s.onPress}>
                      <View style={styles.settingIcon}>
                        <Ionicons name={s.icon} size={18} color={C.brand} />
                      </View>
                      <Text style={styles.settingLabel}>{s.label}</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.muted} />
                    </Pressable>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Sign out ── */}
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
                onPress={() => { haptic(); toast_('Sign out — coming soon', 'info'); }}
              >
                <View style={[styles.settingIcon, styles.settingIconDestructive]}>
                  <Ionicons name="log-out-outline" size={18} color="#C62828" />
                </View>
                <Text style={[styles.settingLabel, styles.settingDestructive]}>Sign Out</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
