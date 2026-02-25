import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  Animated,
  Modal,
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

const SITES = [
  { id: 's1', name: 'Parkhurst Hub',    address: '21 4th Ave, Parkhurst, JHB',     type: 'Community', status: 'Active',   pickups: 14, materials: 'Mixed, PET, Cardboard', contact: 'Sipho Dlamini · 082 000 1111' },
  { id: 's2', name: 'Rosebank Dock',    address: 'The Zone Dock, Rosebank, JHB',   type: 'Mall',      status: 'Active',   pickups: 8,  materials: 'PET, Cardboard',          contact: 'Lerato Mokoena · 082 000 2222' },
  { id: 's3', name: 'Melville Campus',  address: 'UJ Melville Campus, Auckland Pk', type: 'Campus',    status: 'Active',   pickups: 6,  materials: 'Cardboard, Mixed',        contact: 'Johan Botha · 082 000 3333' },
  { id: 's4', name: 'Sandton City Hub', address: 'Sandton City P5 Dock, Sandton',  type: 'Mall',      status: 'Active',   pickups: 12, materials: 'Glass, Mixed, PET',       contact: 'Amahle Zulu · 082 000 4444' },
  { id: 's5', name: 'Bryanston Depot',  address: '14 Bryanston Dr, Bryanston',     type: 'Depot',     status: 'Pending',  pickups: 0,  materials: 'TBD',                     contact: 'Verify in progress' },
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
    headerInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerLeft: { flex: 1, gap: 1 },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 12 },

    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    siteRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    siteIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    siteIconPending: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    siteInfo: { flex: 1, gap: 2 },
    siteName: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    siteMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    statusActive: { backgroundColor: isDark ? 'rgba(78,200,49,0.15)' : 'rgba(78,200,49,0.10)' },
    statusPending: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    statusText: { fontFamily: F.semibold, fontSize: 11 },
    statusActiveText: { color: '#4EC831' },
    statusPendingText: { color: '#F57C00' },

    /* FAB */
    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center',
      shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }, elevation: 10,
      borderWidth: 1, borderColor: 'rgba(78,200,49,0.40)',
    },

    /* Modal */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: isDark ? 'rgba(20,26,44,0.97)' : 'rgba(255,255,255,0.97)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, gap: 16,
      borderWidth: 1, borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', alignSelf: 'center' },
    modalTitle: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
    modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    modalInfo: { flex: 1, gap: 2 },
    modalLabel: { fontFamily: F.body, fontSize: 13, color: C.muted },
    modalValue: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 28, backgroundColor: C.navy, alignItems: 'center' },
    primaryBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand, letterSpacing: 0.5 },
    secondaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0', alignItems: 'center' },
    secondaryBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessSites() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [selected, setSelected] = useState<typeof SITES[0] | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, {
        opacity: enterAnim,
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }]}>
        <View style={styles.root}>
          <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

          {/* ── Header ── */}
          <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerBlobTL} />
            <View style={styles.headerBlobBR} />
            <View style={styles.headerInner}>
              <Pressable style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>Manage your locations</Text>
                <Text style={styles.headerTitle}>Sites</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          >
            <View style={styles.card}>
              {SITES.map((site, idx) => {
                const isActive = site.status === 'Active';
                return (
                  <View key={site.id}>
                    <Pressable
                      style={({ pressed }) => [styles.siteRow, pressed && styles.pressed]}
                      onPress={() => { haptic(); setSelected(site); }}
                    >
                      <View style={[styles.siteIcon, !isActive && styles.siteIconPending]}>
                        <Ionicons name="storefront-outline" size={18} color={isActive ? C.brand : '#F57C00'} />
                      </View>
                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName}>{site.name}</Text>
                        <Text style={styles.siteMeta}>{site.type} · {site.pickups} pickups</Text>
                      </View>
                      <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusPending]}>
                        <Text style={[styles.statusText, isActive ? styles.statusActiveText : styles.statusPendingText]}>{site.status}</Text>
                      </View>
                    </Pressable>
                    {idx < SITES.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Add site FAB ── */}
          <Pressable
            style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 32 }, pressed && { opacity: 0.85, transform: [{ scale: 0.93 }] }]}
            onPress={() => { haptic(); toast_('Add site — coming soon', 'info'); }}
            accessibilityLabel="Add site"
          >
            <Ionicons name="add" size={28} color={C.brand} />
          </Pressable>

          {/* ── Site detail modal ── */}
          <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
            <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
              <Pressable style={styles.modalCard} onPress={() => {}}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{selected?.name}</Text>

                <View style={styles.modalRow}>
                  <View style={styles.modalIcon}><Ionicons name="location-outline" size={18} color={C.brand} /></View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Address</Text>
                    <Text style={styles.modalValue}>{selected?.address}</Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <View style={styles.modalIcon}><Ionicons name="cube-outline" size={18} color={C.brand} /></View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Materials accepted</Text>
                    <Text style={styles.modalValue}>{selected?.materials}</Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <View style={styles.modalIcon}><Ionicons name="person-outline" size={18} color={C.brand} /></View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Site contact</Text>
                    <Text style={styles.modalValue}>{selected?.contact}</Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <View style={styles.modalIcon}><Ionicons name="checkmark-done-outline" size={18} color={C.brand} /></View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Total pickups</Text>
                    <Text style={styles.modalValue}>{selected?.pickups}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setSelected(null)}>
                    <Text style={styles.secondaryBtnText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => { setSelected(null); toast_('Edit site — coming soon', 'info'); }}
                  >
                    <Text style={styles.primaryBtnText}>EDIT SITE</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
