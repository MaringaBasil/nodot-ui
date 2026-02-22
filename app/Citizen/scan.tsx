import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert, Animated, Pressable, ScrollView, StyleSheet,
  Text, View, Modal, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Camera } from '@/components/scan/Camera';
import { Theme } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { SectionHeader } from '@/components/ui/Primitives';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const grades = ['A', 'B', 'C'];
const confidencePercent = 82;

const recentScans = [
  { name: 'PET bottle',    reward: 'R 0.50', time: '2 min ago',  icon: 'water-outline',    color: '#2C6E91', grade: 'A', weight: '0.32 kg' },
  { name: 'Glass jar',     reward: 'R 1.20', time: '18 min ago', icon: 'wine-outline',     color: '#3F8B7B', grade: 'B', weight: '0.85 kg' },
  { name: 'Cardboard',     reward: 'R 0.85', time: '32 min ago', icon: 'document-outline', color: '#C6A35C', grade: 'A', weight: '1.2 kg'  },
  { name: 'Aluminum can',  reward: 'R 0.65', time: '45 min ago', icon: 'cube-outline',     color: '#9E9E9E', grade: 'A', weight: '0.15 kg' },
];

const useNativeDriver = Platform.OS !== 'web';

// ─── Scanner line ────────────────────────────────────────────────────────────
const ScannerLine: React.FC = () => {
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
        {
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) }],
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
        },
      ]}
    />
  );
};

// ─── Corner brackets ─────────────────────────────────────────────────────────
const ScannerCorners: React.FC = () => (
  <>
    <View style={[styles.scannerCorner, styles.cornerTL]} />
    <View style={[styles.scannerCorner, styles.cornerTR]} />
    <View style={[styles.scannerCorner, styles.cornerBL]} />
    <View style={[styles.scannerCorner, styles.cornerBR]} />
  </>
);

// ─── Confidence bar ───────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ percent: number }> = ({ percent }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: percent, duration: 1200, useNativeDriver: false }).start();
  }, [percent]);
  return (
    <View style={styles.confidenceWrap}>
      <View style={styles.confidenceBg} />
      <Animated.View
        style={[
          styles.confidenceFill,
          { width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]}
      />
      <View style={styles.confidenceTextWrap}>
        <Text style={styles.confidenceValue}>{percent}%</Text>
        <Text style={styles.confidenceLabel}>Confidence</Text>
      </View>
    </View>
  );
};

// ─── Grade selector ───────────────────────────────────────────────────────────
const gradeColor = (g: string) => {
  if (g === 'A') return { bg: Theme.colors.brandLight, border: 'rgba(78,200,49,0.3)', text: '#2E7D32' };
  if (g === 'B') return { bg: '#FFF8E1', border: '#FFE082', text: '#F57F17' };
  if (g === 'C') return { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' };
  return { bg: Theme.colors.wash, border: 'transparent', text: Theme.colors.ink };
};

const GradeSelector: React.FC<{ grades: string[]; selected: string; onSelect: (g: string) => void }> = ({
  grades, selected, onSelect,
}) => (
  <View style={styles.gradeSelector}>
    <Text style={styles.gradeSelectorLabel}>Quality Grade</Text>
    <View style={styles.gradeRow}>
      {grades.map((g) => {
        const c = gradeColor(g);
        const active = selected === g;
        return (
          <Pressable
            key={g}
            style={({ pressed }) => [
              styles.gradeChip,
              active && { backgroundColor: c.bg, borderColor: c.border },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onSelect(g)}
          >
            <View style={[styles.gradeIcon, active && { backgroundColor: c.border }]}>
              <Text style={[styles.gradeIconText, active && { color: c.text }]}>{g}</Text>
            </View>
            <Text style={[styles.gradeText, active && { color: c.text, fontFamily: Theme.fonts.display }]}>
              Grade {g}
            </Text>
            {active && <Ionicons name="checkmark-circle" size={16} color={c.text} />}
          </Pressable>
        );
      })}
    </View>
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CitizenScan() {
  const router = useRouter();
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const CAMERA_H = Math.round(screenH * 0.46);

  const [flash, setFlash]           = useState(false);
  const [auto, setAuto]             = useState(true);
  const [grade, setGrade]           = useState('A');
  const [showModal, setShowModal]   = useState(false);
  const [scanned, setScanned]       = useState(false);
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

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((t) => ({ ...t, visible: false }))}
        />

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Scan item</Text>
          <View style={styles.topBarControls}>
            <Pressable
              style={[styles.controlBtn, flash && styles.controlBtnActive]}
              onPress={() => tap(() => setFlash((v) => !v))}
            >
              <Ionicons
                name={flash ? 'flash' : 'flash-off-outline'}
                size={20}
                color={flash ? '#FFFFFF' : Theme.colors.muted}
              />
            </Pressable>
            <Pressable
              style={[styles.controlBtn, auto && styles.controlBtnActive]}
              onPress={() => tap(() => setAuto((v) => !v))}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={auto ? '#FFFFFF' : Theme.colors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Camera viewfinder ── */}
        <View style={[styles.cameraContainer, { height: CAMERA_H }]}>
          <Camera />
          <View style={styles.cameraOverlay}>
            <ScannerCorners />
            {auto && <ScannerLine />}
            {auto && (
              <View style={styles.autoDetectBadge}>
                <View style={styles.autoDetectDot} />
                <Text style={styles.autoDetectText}>Auto-detecting</Text>
              </View>
            )}
            <View style={styles.guidePill}>
              <Text style={styles.guideText}>Align item inside the frame</Text>
            </View>
          </View>
        </View>

        {/* ── Capture row ── */}
        <View style={styles.captureRow}>
          <Pressable
            style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => tap(() => setShowModal(true))}
          >
            <View style={styles.captureBtnInner}>
              <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.captureBtnText}>Capture</Text>
          </Pressable>

          <View style={styles.priceCard}>
            <View style={styles.priceIconWrap}>
              <Ionicons name="cash-outline" size={18} color={Theme.colors.greenDark} />
            </View>
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Estimated value</Text>
              <Text style={[styles.priceValue, !scanned && styles.priceValueEmpty]}>
                {scanned ? 'R 0.50' : '—'}
              </Text>
            </View>
            {scanned && (
              <View style={styles.priceBadge}>
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
                {
                  opacity: resultsAnim,
                  transform: [{ translateY: resultsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
              ]}
            >
              <SectionHeader title="Scan details" meta="Detected material and quality grade" />

              {/* Material pill */}
              <View style={styles.materialPill}>
                <View style={styles.materialPillIcon}>
                  <Ionicons name="sync-outline" size={18} color={Theme.colors.greenDark} />
                </View>
                <Text style={styles.materialPillText}>PET plastic detected</Text>
                <View style={styles.materialPillBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: Theme.colors.brandLight }]}>
                    <Ionicons name="barbell-outline" size={18} color="#2C6E91" />
                  </View>
                  <Text style={styles.statValue}>0.32 kg</Text>
                  <Text style={styles.statLabel}>Est. weight</Text>
                </View>
                <View style={styles.statCard}>
                  <ConfidenceBar percent={confidencePercent} />
                </View>
              </View>

              {/* Grade */}
              <GradeSelector grades={grades} selected={grade} onSelect={(g) => { setGrade(g); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} />

              {/* Tip */}
              <View style={styles.tipCard}>
                <View style={styles.tipIcon}>
                  <Ionicons name="bulb-outline" size={18} color="#F57F17" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Pro tip</Text>
                  <Text style={styles.tipMeta}>Keep the item flat and fill the frame for better accuracy.</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                  onPress={() => tap(() => router.push('/Citizen/hubs'))}
                >
                  <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                  <View style={styles.actionBtnText}>
                    <Text style={styles.actionBtnTitle}>Nearest hub</Text>
                    <Text style={styles.actionBtnMeta}>Parkhurst - 1.2 km</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                  onPress={() => tap(() => Alert.alert('Pickup request', 'Item added to next scheduled pickup.'))}
                >
                  <Ionicons name="car-outline" size={20} color={Theme.colors.greenDark} />
                  <View style={styles.actionBtnText}>
                    <Text style={[styles.actionBtnTitle, { color: Theme.colors.ink }]}>Pickup</Text>
                    <Text style={[styles.actionBtnMeta, { color: Theme.colors.muted }]}>Schedule next day</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Recent scans — always visible */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <SectionHeader title="Recent scans" meta="Last 24 hours" />
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{recentScans.length}</Text>
              </View>
            </View>
            {recentScans.map((scan) => (
              <Pressable
                key={scan.name}
                style={({ pressed }) => [styles.historyRow, pressed && { backgroundColor: Theme.colors.wash }]}
              >
                <View style={[styles.historyIcon, { backgroundColor: `${scan.color}20` }]}>
                  <Ionicons name={scan.icon as any} size={18} color={scan.color} />
                </View>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{scan.name}</Text>
                  <Text style={styles.historyMeta}>{scan.time}</Text>
                </View>
                <View style={styles.historyValueWrap}>
                  <Text style={styles.historyValue}>{scan.reward}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Theme.colors.muted} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* ── Camera modal ── */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalLiveDot} />
                  <Text style={styles.modalTitle}>Live capture</Text>
                </View>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={({ pressed }) => [styles.closeBtn, pressed && { backgroundColor: '#E0E0E0' }]}
                >
                  <Ionicons name="close" size={20} color={Theme.colors.ink} />
                </Pressable>
              </View>
              <View style={styles.modalCamera}>
                <Camera />
                <View style={styles.modalCameraOverlay}>
                  <ScannerCorners />
                  <ScannerLine />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.modalCapture, pressed && { backgroundColor: '#E0E0E0' }]}
                onPress={() => tap(handleCapture)}
              >
                <View style={styles.modalCaptureRing}>
                  <View style={styles.modalCaptureInner} />
                </View>
                <Text style={styles.modalCaptureText}>Tap to capture</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
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
    backgroundColor: Theme.colors.wash,
  },
  controlBtnActive: {
    backgroundColor: Theme.colors.greenDark,
  },

  // ── Camera
  cameraContainer: {
    width: '100%',
    backgroundColor: '#1B2C3A',
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
    backgroundColor: Theme.colors.green,
  },
  scannerCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Theme.colors.green,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  autoDetectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.green,
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    backgroundColor: Theme.colors.green,
    borderRadius: 28,
    ...Theme.shadow.glow,
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
    backgroundColor: Theme.colors.brandLight,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: 'rgba(78,200,49,0.2)',
  },
  priceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContent: { flex: 1 },
  priceLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  priceValueEmpty: {
    fontSize: 18,
    color: Theme.colors.muted,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Theme.colors.greenDark,
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
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  materialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Theme.colors.brandLight,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(78,200,49,0.2)',
  },
  materialPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialPillText: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  materialPillBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.green,
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
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
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
    color: Theme.colors.ink,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
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
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  confidenceFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 8,
    backgroundColor: Theme.colors.green,
    borderRadius: 4,
  },
  confidenceTextWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  confidenceValue: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  confidenceLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  gradeSelector: { gap: 10 },
  gradeSelectorLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.muted,
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
    backgroundColor: Theme.colors.wash,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gradeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIconText: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.muted,
  },
  gradeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: { flex: 1, gap: 2 },
  tipTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#F57F17',
  },
  tipMeta: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
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
    backgroundColor: Theme.colors.wash,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  actionBtnPrimary: {
    backgroundColor: Theme.colors.green,
    borderColor: Theme.colors.greenDark,
    ...Theme.shadow.glow,
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

  // ── Recent scans
  historyCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Theme.colors.brandLight,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
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
    color: Theme.colors.ink,
  },
  historyMeta: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
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
    color: Theme.colors.greenDark,
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 12,
    ...Theme.shadow.lift,
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
    color: Theme.colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.wash,
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
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
  },
  modalCaptureRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCaptureInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.green,
  },
  modalCaptureText: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
});
