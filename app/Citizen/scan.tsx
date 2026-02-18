import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View, Modal, Platform } from 'react-native';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { Camera } from '@/components/scan/Camera';
import { Theme } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LinearGradient } from 'expo-linear-gradient';

const grades = ['A', 'B', 'C'];
const confidencePercent = 82;

const recentScans = [
  { name: 'PET bottle', reward: 'R 0.50', time: '2 min ago', icon: 'local-drink', color: '#2196F3', grade: 'A', weight: '0.32 kg' },
  { name: 'Glass jar', reward: 'R 1.20', time: '18 min ago', icon: 'wine-bar', color: '#4CAF50', grade: 'B', weight: '0.85 kg' },
  { name: 'Cardboard', reward: 'R 0.85', time: '32 min ago', icon: 'inventory-2', color: '#795548', grade: 'A', weight: '1.2 kg' },
  { name: 'Aluminum can', reward: 'R 0.65', time: '45 min ago', icon: 'local-cafe', color: '#9E9E9E', grade: 'A', weight: '0.15 kg' },
];

// Scanned items basket
const initialBasket: { id: string; name: string; weight: string; value: number; icon: string; color: string }[] = [];

// Material info cards
const materialInfo = [
  { type: 'PET', label: 'Plastic bottles', rate: 'R 5/kg', tip: 'Remove caps for better rates', icon: 'local-drink', color: '#2196F3' },
  { type: 'HDPE', label: 'Milk jugs, detergent', rate: 'R 4/kg', tip: 'Rinse before scanning', icon: 'water-drop', color: '#00BCD4' },
  { type: 'Glass', label: 'Jars and bottles', rate: 'R 4/kg', tip: 'Sort by color for premium', icon: 'wine-bar', color: '#4CAF50' },
  { type: 'Aluminum', label: 'Cans and foil', rate: 'R 8/kg', tip: 'Crush to save space', icon: 'local-cafe', color: '#9E9E9E' },
];

const useNativeDriver = Platform.OS !== 'web';

// Animated scanner line component
const ScannerLine: React.FC = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.scannerLine,
        {
          transform: [{
            translateY: scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
          }],
          opacity: scanAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3],
          }),
        },
      ]}
    />
  );
};

// Animated corner brackets
const ScannerCorners: React.FC = () => (
  <>
    <View style={[styles.scannerCorner, styles.cornerTL]} />
    <View style={[styles.scannerCorner, styles.cornerTR]} />
    <View style={[styles.scannerCorner, styles.cornerBL]} />
    <View style={[styles.scannerCorner, styles.cornerBR]} />
  </>
);

// Animated confidence ring
const ConfidenceRing: React.FC<{ percent: number }> = ({ percent }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={styles.confidenceRing}>
      <View style={styles.confidenceBackground} />
      <Animated.View
        style={[
          styles.confidenceFill,
          {
            width: fillAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
      <View style={styles.confidenceTextWrap}>
        <Text style={styles.confidenceValue}>{percent}%</Text>
        <Text style={styles.confidenceLabel}>Confidence</Text>
      </View>
    </View>
  );
};

// Grade selector component
const GradeSelector: React.FC<{
  grades: string[];
  selected: string;
  onSelect: (grade: string) => void;
}> = ({ grades, selected, onSelect }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' };
      case 'B': return { bg: '#FFF8E1', border: '#FFE082', text: '#F57F17' };
      case 'C': return { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' };
      default: return { bg: Theme.colors.wash, border: 'transparent', text: Theme.colors.ink };
    }
  };

  return (
    <View style={styles.gradeSelector}>
      <Text style={styles.gradeSelectorLabel}>Quality Grade</Text>
      <View style={styles.gradeRow}>
        {grades.map((grade) => {
          const colors = getGradeColor(grade);
          const isSelected = selected === grade;
          return (
            <Pressable
              key={grade}
              style={({ pressed }) => [
                styles.gradeChip,
                isSelected && { backgroundColor: colors.bg, borderColor: colors.border },
                pressed && styles.gradeChipPressed,
              ]}
              onPress={() => onSelect(grade)}
            >
              <View style={[styles.gradeIcon, isSelected && { backgroundColor: colors.border }]}>
                <Text style={[styles.gradeIconText, isSelected && { color: colors.text }]}>{grade}</Text>
              </View>
              <Text style={[styles.gradeText, isSelected && { color: colors.text, fontFamily: Theme.fonts.display }]}>
                Grade {grade}
              </Text>
              {isSelected && (
                <MaterialIcons name="check-circle" size={16} color={colors.text} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default function CitizenScan() {
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [showCamera, setShowCamera] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  // Animations
  const blocks = useMemo(() => Array.from({ length: 5 }, () => new Animated.Value(0)), []);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      100,
      blocks.map((block) => Animated.spring(block, { toValue: 1, useNativeDriver, friction: 6 }))
    ).start();

    // Glow animation for the price card
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver }),
      ])
    ).start();
  }, [blocks]);

  const handlePress = useCallback((action: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const handleGradeSelect = useCallback((grade: string) => {
    setSelectedGrade(grade);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* Background Gradient */}
        <LinearGradient
          colors={['#F1F8F1', Theme.colors.paper]}
          style={styles.backgroundGradient}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <Animated.View
            style={[
              styles.headerCard,
              {
                opacity: blocks[0],
                transform: [{ translateY: blocks[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIconWrap}>
                <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Scan item</Text>
                <Text style={styles.headerMeta}>Align the item and capture for instant pricing</Text>
              </View>
            </View>
            <View style={styles.toggleRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.toggleChip,
                  flashEnabled && styles.toggleChipActive,
                  pressed && styles.toggleChipPressed,
                ]}
                onPress={() => handlePress(() => setFlashEnabled((v) => !v))}
              >
                <MaterialIcons
                  name={flashEnabled ? 'flash-on' : 'flash-off'}
                  size={16}
                  color={flashEnabled ? '#FFFFFF' : Theme.colors.muted}
                />
                <Text style={[styles.toggleText, flashEnabled && styles.toggleTextActive]}>Flash</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.toggleChip,
                  autoDetect && styles.toggleChipActive,
                  pressed && styles.toggleChipPressed,
                ]}
                onPress={() => handlePress(() => setAutoDetect((v) => !v))}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={16}
                  color={autoDetect ? '#FFFFFF' : Theme.colors.muted}
                />
                <Text style={[styles.toggleText, autoDetect && styles.toggleTextActive]}>Auto</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Camera Card with Scanner Effect */}
          <Animated.View
            style={[
              styles.cameraCard,
              {
                opacity: blocks[1],
                transform: [{ translateY: blocks[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <View style={styles.cameraContainer}>
              <Camera />
              <View style={styles.cameraOverlay}>
                <ScannerCorners />
                {autoDetect && <ScannerLine />}
                {autoDetect && (
                  <View style={styles.autoDetectBadge}>
                    <View style={styles.autoDetectDot} />
                    <Text style={styles.autoDetectText}>Auto-detecting</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Capture Actions */}
            <View style={styles.cameraActions}>
              <Pressable
                style={({ pressed }) => [styles.captureButton, pressed && styles.captureButtonPressed]}
                onPress={() => handlePress(() => setShowCamera(true))}
              >
                <View style={styles.captureButtonInner}>
                  <MaterialIcons name="camera-alt" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.captureText}>Capture</Text>
              </Pressable>

              {/* Price Estimate Card */}
              <Animated.View style={[styles.priceCard, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]}>
                <View style={styles.priceIconWrap}>
                  <MaterialIcons name="payments" size={18} color={Theme.colors.greenDark} />
                </View>
                <View style={styles.priceContent}>
                  <Text style={styles.priceLabel}>Estimated value</Text>
                  <Text style={styles.priceValue}>R 0.50</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>PET</Text>
                </View>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Scan Details Card */}
          <Animated.View
            style={[
              styles.detailsCard,
              {
                opacity: blocks[2],
                transform: [{ translateY: blocks[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <SectionHeader title="Scan details" meta="Detected material and quality grade" />

            {/* Material Pill */}
            <View style={styles.materialPill}>
              <View style={styles.materialPillIcon}>
                <MaterialIcons name="recycling" size={18} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.materialPillText}>PET plastic detected</Text>
              <View style={styles.materialPillBadge}>
                <MaterialIcons name="verified" size={12} color="#FFFFFF" />
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialIcons name="scale" size={18} color="#1976D2" />
                </View>
                <Text style={styles.statValue}>0.32 kg</Text>
                <Text style={styles.statLabel}>Est. weight</Text>
              </View>
              <View style={styles.statCard}>
                <ConfidenceRing percent={confidencePercent} />
              </View>
            </View>

            {/* Grade Selector */}
            <GradeSelector
              grades={grades}
              selected={selectedGrade}
              onSelect={handleGradeSelect}
            />

            {/* Tip Card */}
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <MaterialIcons name="lightbulb" size={18} color="#F57F17" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Pro tip</Text>
                <Text style={styles.tipMeta}>Keep the item flat and fill the frame for better accuracy.</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.actionButton, styles.actionButtonPrimary, pressed && styles.actionButtonPressed]}
                onPress={() => handlePress(() => Alert.alert('Hub drop-off', 'Item added to basket for Parkhurst hub.'))}
              >
                <MaterialIcons name="store" size={20} color="#FFFFFF" />
                <View style={styles.actionButtonText}>
                  <Text style={styles.actionButtonTitle}>Nearest hub</Text>
                  <Text style={styles.actionButtonMeta}>Parkhurst - 1.2 km</Text>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                onPress={() => handlePress(() => Alert.alert('Pickup request', 'Item added to next scheduled pickup.'))}
              >
                <MaterialIcons name="local-shipping" size={20} color={Theme.colors.greenDark} />
                <View style={styles.actionButtonText}>
                  <Text style={[styles.actionButtonTitle, { color: Theme.colors.ink }]}>Pickup</Text>
                  <Text style={styles.actionButtonMeta}>Schedule next day</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Recent Scans Card */}
          <Animated.View
            style={[
              styles.historyCard,
              {
                opacity: blocks[3],
                transform: [{ translateY: blocks[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <View style={styles.historyHeader}>
              <SectionHeader title="Recent scans" meta="Last 24 hours" />
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{recentScans.length}</Text>
              </View>
            </View>

            {recentScans.map((scan, idx) => (
              <Pressable
                key={scan.name}
                style={({ pressed }) => [styles.historyRow, pressed && styles.historyRowPressed]}
              >
                <View style={[styles.historyIcon, { backgroundColor: `${scan.color}15` }]}>
                  <MaterialIcons name={scan.icon as any} size={18} color={scan.color} />
                </View>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{scan.name}</Text>
                  <Text style={styles.historyMeta}>{scan.time}</Text>
                </View>
                <View style={styles.historyValueWrap}>
                  <Text style={styles.historyValue}>{scan.reward}</Text>
                  <MaterialIcons name="chevron-right" size={16} color={Theme.colors.muted} />
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* Camera Modal */}
          <Modal visible={showCamera} transparent animationType="fade" onRequestClose={() => setShowCamera(false)}>
            <View style={styles.modalOverlay}>
              <Animated.View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalLiveIndicator} />
                    <Text style={styles.modalTitle}>Live capture</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowCamera(false)}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                  >
                    <MaterialIcons name="close" size={20} color={Theme.colors.ink} />
                  </Pressable>
                </View>
                <View style={styles.modalCameraBody}>
                  <Camera />
                  <View style={styles.modalCameraOverlay}>
                    <ScannerCorners />
                    <ScannerLine />
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.modalCapture, pressed && styles.modalCapturePressed]}
                  onPress={() => handlePress(() => {
                    setShowCamera(false);
                    setToast({ visible: true, message: 'Scan captured! Processing...', type: 'success' });
                  })}
                >
                  <View style={styles.modalCaptureRing}>
                    <View style={styles.modalCaptureInner} />
                  </View>
                  <Text style={styles.modalCaptureText}>Tap to capture</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.paper,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    padding: 14,
    paddingBottom: 120,
    gap: 12,
  },

  // Header Card
  headerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.glow,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.3,
  },
  headerMeta: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginTop: 2,
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Theme.colors.wash,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleChipActive: {
    backgroundColor: Theme.colors.greenDark,
    borderColor: Theme.colors.greenDark,
  },
  toggleChipPressed: {
    opacity: 0.85,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
  },

  // Camera Card
  cameraCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  cameraContainer: {
    height: 240,
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },

  // Scanner effects
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
    width: 24,
    height: 24,
    borderColor: Theme.colors.green,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  autoDetectBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
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

  // Camera Actions
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captureButton: {
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
  captureButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  captureButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
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
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  priceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContent: {
    flex: 1,
  },
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

  // Details Card
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
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
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

  // Stats Row
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

  // Confidence Ring
  confidenceRing: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBackground: {
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

  // Grade Selector
  gradeSelector: {
    gap: 10,
  },
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
  gradeChipPressed: {
    opacity: 0.85,
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

  // Tip Card
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
  tipContent: {
    flex: 1,
    gap: 2,
  },
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

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
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
  actionButtonPrimary: {
    backgroundColor: Theme.colors.green,
    borderColor: Theme.colors.greenDark,
    ...Theme.shadow.glow,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    flex: 1,
    gap: 2,
  },
  actionButtonTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
  actionButtonMeta: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: 'rgba(255,255,255,0.8)',
  },

  // History Card
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
    backgroundColor: '#E8F5E9',
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
  historyRowPressed: {
    backgroundColor: Theme.colors.wash,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
  },
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

  // Modal
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
  modalLiveIndicator: {
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  modalCameraBody: {
    height: 360,
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
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
  modalCapturePressed: {
    backgroundColor: '#E0E0E0',
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
