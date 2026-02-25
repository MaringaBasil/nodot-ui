import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert, Animated, Image, Pressable, ScrollView, StyleSheet,
  Text, View, Modal, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Camera } from '@/components/scan/Camera';
import { Theme } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { SectionHeader } from '@/components/ui/Primitives';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const grades = ['A', 'B', 'C'];
const confidencePercent = 82;

const recentScans = [
  { name: 'PET bottle', reward: 'R 0.50', time: '2 min ago', icon: 'water-outline', color: '#2C6E91', grade: 'A', weight: '0.32 kg' },
  { name: 'Glass jar', reward: 'R 1.20', time: '18 min ago', icon: 'wine-outline', color: '#3F8B7B', grade: 'B', weight: '0.85 kg' },
  { name: 'Cardboard', reward: 'R 0.85', time: '32 min ago', icon: 'document-outline', color: '#C6A35C', grade: 'A', weight: '1.2 kg' },
  { name: 'Aluminum can', reward: 'R 0.65', time: '45 min ago', icon: 'cube-outline', color: '#9E9E9E', grade: 'A', weight: '0.15 kg' },
];

const useNativeDriver = Platform.OS !== 'web';

// ─── Scanner line ─────────────────────────────────────────────────────────────
const ScannerLine: React.FC<{ color: string }> = ({ color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver }),
        Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.scannerLine,
        { backgroundColor: color },
        {
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) }],
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
        },
      ]}
    />
  );
};

// ─── Corner brackets ─────────────────────────────────────────────────────────
const ScannerCorners: React.FC<{ color: string }> = ({ color }) => (
  <>
    <View style={[styles.scannerCorner, styles.cornerTL, { borderColor: color }]} />
    <View style={[styles.scannerCorner, styles.cornerTR, { borderColor: color }]} />
    <View style={[styles.scannerCorner, styles.cornerBL, { borderColor: color }]} />
    <View style={[styles.scannerCorner, styles.cornerBR, { borderColor: color }]} />
  </>
);

// ─── Confidence bar ───────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ percent: number }> = ({ percent }) => {
  const { colors: C, isDark } = useTheme();
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: percent, duration: 1200, useNativeDriver: false }).start();
  }, [percent]);
  return (
    <View style={styles.confidenceWrap}>
      <View style={[styles.confidenceBg, { backgroundColor: isDark ? '#2A3450' : '#E0E0E0' }]} />
      <Animated.View
        style={[
          styles.confidenceFill,
          { backgroundColor: C.green },
          { width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]}
      />
      <View style={styles.confidenceTextWrap}>
        <Text style={[styles.confidenceValue, { color: C.greenDark }]}>{percent}%</Text>
        <Text style={[styles.confidenceLabel, { color: C.muted }]}>Confidence</Text>
      </View>
    </View>
  );
};

// ─── Grade selector ───────────────────────────────────────────────────────────
const gradeColor = (g: string, C: AppColors, isDark: boolean) => {
  if (g === 'A') return {
    bg: C.brandLight,
    border: isDark ? 'rgba(78,200,49,0.40)' : 'rgba(78,200,49,0.30)',
    text: isDark ? '#66BB6A' : '#2E7D32',
  };
  if (g === 'B') return {
    bg: isDark ? '#2D1F08' : '#FFF8E1',
    border: isDark ? '#5C3A00' : '#FFE082',
    text: '#F57F17',
  };
  if (g === 'C') return {
    bg: isDark ? '#2A0A0A' : '#FFEBEE',
    border: isDark ? '#5C1A1A' : '#EF9A9A',
    text: '#C62828',
  };
  return { bg: C.wash, border: 'transparent', text: C.ink };
};

const GradeSelector: React.FC<{
  grades: string[];
  selected: string;
  onSelect: (g: string) => void;
}> = ({ grades, selected, onSelect }) => {
  const { colors: C, isDark } = useTheme();
  return (
    <View style={styles.gradeSelector}>
      <Text style={[styles.gradeSelectorLabel, { color: C.muted }]}>Quality Grade</Text>
      <View style={styles.gradeRow}>
        {grades.map((g) => {
          const c = gradeColor(g, C, isDark);
          const active = selected === g;
          return (
            <Pressable
              key={g}
              style={({ pressed }) => [
                styles.gradeChip,
                { backgroundColor: C.wash },
                active && { backgroundColor: c.bg, borderColor: c.border },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => onSelect(g)}
            >
              <View style={[
                styles.gradeIcon,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                active && { backgroundColor: c.border },
              ]}>
                <Text style={[styles.gradeIconText, { color: C.muted }, active && { color: c.text }]}>{g}</Text>
              </View>
              <Text style={[
                styles.gradeText, { color: C.ink },
                active && { color: c.text, fontFamily: Theme.fonts.display },
              ]}>
                Grade {g}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={16} color={c.text} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CitizenScan() {
  const router = useRouter();
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors: C, isDark, shadow } = useTheme();
  const CAMERA_H = Math.round(screenH * 0.46);

  const [flash, setFlash] = useState(false);
  const [auto, setAuto] = useState(true);
  const [grade, setGrade] = useState('A');
  const [showModal, setShowModal] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const resultsAnim = useRef(new Animated.Value(0)).current;

  const tap = useCallback((fn: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  }, []);

  const handleCapture = useCallback(() => {
    setShowModal(false);
    setScanned(true);
    setToast({ visible: true, message: '✓ PET plastic detected — R 0.50 estimated', type: 'success' });
    Animated.spring(resultsAnim, { toValue: 1, useNativeDriver, friction: 7 }).start();
  }, [resultsAnim]);

  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const rowDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const pressedBg = isDark ? '#2A3450' : '#E0E0E0';

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: C.surface }]}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((t) => ({ ...t, visible: false }))}
        />

        {/* ── Top bar ── */}
        <View style={[styles.topBar, { backgroundColor: C.card, borderBottomColor: rowDivider }]}>
          <Text style={[styles.topBarTitle, { color: C.ink }]}>Scan item</Text>
          <View style={styles.topBarControls}>
            <Pressable
              style={[styles.controlBtn, { backgroundColor: C.wash }, flash && { backgroundColor: C.greenDark }]}
              onPress={() => tap(() => setFlash((v) => !v))}
            >
              <Ionicons
                name={flash ? 'flash' : 'flash-off-outline'}
                size={20}
                color={flash ? '#FFFFFF' : C.muted}
              />
            </Pressable>
            <Pressable
              style={[styles.controlBtn, { backgroundColor: C.wash }, auto && { backgroundColor: C.greenDark }]}
              onPress={() => tap(() => setAuto((v) => !v))}
            >
              <Ionicons name="sparkles-outline" size={20} color={auto ? '#FFFFFF' : C.muted} />
            </Pressable>
          </View>
        </View>

        {/* ── Camera viewfinder ── */}
        <View style={[styles.cameraContainer, { height: CAMERA_H }]}>
          <Camera />
          <View style={styles.cameraOverlay}>
            <ScannerCorners color={C.brand} />
            {auto && <ScannerLine color={C.brand} />}
            {auto && (
              <View style={styles.autoDetectBadge}>
                <View style={[styles.autoDetectDot, { backgroundColor: C.brand }]} />
                <Text style={styles.autoDetectText}>Auto-detecting</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Capture row ── */}
        <View style={[styles.captureRow, { backgroundColor: C.card, borderBottomColor: rowDivider }]}>
          <Pressable
            style={({ pressed }) => [
              styles.captureBtn,
              { backgroundColor: C.green },
              shadow.glow,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => tap(() => setShowModal(true))}
          >
            <View style={styles.captureBtnInner}>
              <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.captureBtnText}>Capture</Text>
          </Pressable>

          <View style={[
            styles.priceCard,
            { backgroundColor: C.brandLight, borderColor: isDark ? 'rgba(78,200,49,0.25)' : 'rgba(78,200,49,0.20)' },
          ]}>
            <View style={[styles.priceIconWrap, { backgroundColor: C.card }]}>
              <Ionicons name="cash-outline" size={18} color={C.greenDark} />
            </View>
            <View style={styles.priceContent}>
              <Text style={[styles.priceLabel, { color: C.muted }]}>Estimated value</Text>
              <Text style={[styles.priceValue, { color: scanned ? C.greenDark : C.muted }]}>
                {scanned ? 'R 0.50' : '—'}
              </Text>
            </View>
            {scanned && (
              <View style={[styles.priceBadge, { backgroundColor: C.greenDark }]}>
                <Text style={styles.priceBadgeText}>PET</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Scrollable results area ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.results, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Scan details — revealed after capture */}
          {scanned && (
            <Animated.View
              style={[
                styles.detailsCard,
                { backgroundColor: C.card, borderColor: cardBorder },
                shadow.soft,
                {
                  opacity: resultsAnim,
                  transform: [{ translateY: resultsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
              ]}
            >
              <SectionHeader title="Scan details" meta="Detected material and quality grade" />

              {/* Material pill */}
              <View style={[
                styles.materialPill,
                { backgroundColor: C.brandLight, borderColor: isDark ? 'rgba(78,200,49,0.30)' : 'rgba(78,200,49,0.20)' },
              ]}>
                <View style={[styles.materialPillIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="sync-outline" size={18} color={C.greenDark} />
                </View>
                <Text style={[styles.materialPillText, { color: C.greenDark }]}>PET plastic detected</Text>
                <View style={[styles.materialPillBadge, { backgroundColor: C.green }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: C.wash, borderColor: cardBorder }]}>
                  <View style={[styles.statIcon, { backgroundColor: C.brandLight }]}>
                    <Ionicons name="barbell-outline" size={18} color="#2C6E91" />
                  </View>
                  <Text style={[styles.statValue, { color: C.ink }]}>0.32 kg</Text>
                  <Text style={[styles.statLabel, { color: C.muted }]}>Est. weight</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: C.wash, borderColor: cardBorder }]}>
                  <ConfidenceBar percent={confidencePercent} />
                </View>
              </View>

              {/* Grade */}
              <GradeSelector
                grades={grades}
                selected={grade}
                onSelect={(g) => {
                  setGrade(g);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              />

              {/* Tip */}
              <View style={[
                styles.tipCard,
                { backgroundColor: isDark ? '#2D1F08' : '#FFF8E1', borderColor: isDark ? '#5C3A00' : '#FFE082' },
              ]}>
                <View style={[styles.tipIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="bulb-outline" size={18} color="#F57F17" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Pro tip</Text>
                  <Text style={[styles.tipMeta, { color: C.muted }]}>
                    Keep the item flat and fill the frame for better accuracy.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: C.green, borderColor: C.greenDark },
                    shadow.glow,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => tap(() => router.push('/Citizen/hubs'))}
                >
                  <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                  <View style={styles.actionBtnText}>
                    <Text style={styles.actionBtnTitle}>Nearest hub</Text>
                    <Text style={styles.actionBtnMeta}>Parkhurst - 1.2 km</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: C.wash, borderColor: cardBorder },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => tap(() => Alert.alert('Pickup request', 'Item added to next scheduled pickup.'))}
                >
                  <Ionicons name="car-outline" size={20} color={C.greenDark} />
                  <View style={styles.actionBtnText}>
                    <Text style={[styles.actionBtnTitle, { color: C.ink }]}>Pickup</Text>
                    <Text style={[styles.actionBtnMeta, { color: C.muted }]}>Schedule next day</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Idle hero — shown before first scan */}
          {!scanned && (
            <Image
              source={require('@/assets/images/person_scanning.webp')}
              style={styles.idleHero}
              resizeMode="cover"
            />
          )}

          {/* Recent scans */}
          <View style={[styles.historyCard, { backgroundColor: C.card, borderColor: cardBorder }, shadow.soft]}>
            <View style={styles.historyHeader}>
              <SectionHeader title="Recent scans" meta="Last 24 hours" />
              <View style={[styles.historyBadge, { backgroundColor: C.brandLight }]}>
                <Text style={[styles.historyBadgeText, { color: C.greenDark }]}>{recentScans.length}</Text>
              </View>
            </View>
            {recentScans.map((scan) => (
              <Pressable
                key={scan.name}
                style={({ pressed }) => [styles.historyRow, pressed && { backgroundColor: C.wash }]}
              >
                <View style={[styles.historyIcon, { backgroundColor: `${scan.color}20` }]}>
                  <Ionicons name={scan.icon as any} size={18} color={scan.color} />
                </View>
                <View style={styles.historyText}>
                  <Text style={[styles.historyTitle, { color: C.ink }]}>{scan.name}</Text>
                  <Text style={[styles.historyMeta, { color: C.muted }]}>{scan.time}</Text>
                </View>
                <View style={styles.historyValueWrap}>
                  <Text style={[styles.historyValue, { color: C.greenDark }]}>{scan.reward}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.muted} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ── Camera modal ── */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: C.card }, shadow.lift]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalLiveDot} />
                  <Text style={[styles.modalTitle, { color: C.ink }]}>Live capture</Text>
                </View>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    { backgroundColor: C.wash },
                    pressed && { backgroundColor: pressedBg },
                  ]}
                >
                  <Ionicons name="close" size={20} color={C.ink} />
                </Pressable>
              </View>
              <View style={styles.modalCamera}>
                <Camera />
                <View style={styles.modalCameraOverlay}>
                  <ScannerCorners color={C.brand} />
                  <ScannerLine color={C.brand} />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCapture,
                  { backgroundColor: C.wash },
                  pressed && { backgroundColor: pressedBg },
                ]}
                onPress={() => tap(handleCapture)}
              >
                <View style={[styles.modalCaptureRing, { borderColor: C.green }]}>
                  <View style={[styles.modalCaptureInner, { backgroundColor: C.green }]} />
                </View>
                <Text style={[styles.modalCaptureText, { color: C.ink }]}>Tap to capture</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ErrorBoundary>
  );
}

// ─── Static styles (geometry / typography only — no theme colours) ────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
    letterSpacing: -0.3,
  },
  topBarControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Camera
  cameraContainer: {
    width: '100%',
    backgroundColor: '#1B2C3A',   // always dark — it's a viewfinder
    overflow: 'hidden',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  scannerLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
  },
  scannerCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  autoDetectBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',   // always dark — camera overlay
    borderRadius: 16,
  },
  autoDetectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  autoDetectText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: '#FFFFFF',
  },
  guidePill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  guideText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Capture row
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 28,
  },
  captureBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 14,
  },
  priceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
  },
  priceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContent: { flex: 1 },
  priceLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },

  // ── Results scroll
  results: {
    padding: 14,
    gap: 12,
  },

  // ── Scan details card
  detailsCard: {
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  materialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
  },
  materialPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialPillText: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
  },
  materialPillBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: Theme.radius.m,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
  },
  confidenceWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
  },
  confidenceFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 8,
    borderRadius: 4,
  },
  confidenceTextWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  confidenceValue: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
  },
  confidenceLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
  },
  gradeSelector: { gap: 10 },
  gradeSelectorLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gradeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIconText: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
  },
  gradeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: { flex: 1, gap: 2 },
  tipTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#F57F17',              // amber — always the same in both modes
  },
  tipMeta: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
  },
  actionBtnText: { flex: 1, gap: 2 },
  actionBtnTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
  actionBtnMeta: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Idle hero
  idleHero: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },

  // ── Recent scans
  historyCard: {
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.display,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderRadius: Theme.radius.s,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: { flex: 1 },
  historyTitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
  },
  historyMeta: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    marginTop: 2,
  },
  historyValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyValue: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  modalTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCamera: {
    height: 360,
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
    backgroundColor: '#1B2C3A',
  },
  modalCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
  },
  modalCapture: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: Theme.radius.m,
  },
  modalCaptureRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCaptureInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modalCaptureText: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
  },
});
