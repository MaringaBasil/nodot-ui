/**
 * Picker/scan.tsx
 *
 * The 4-step QR scan wizard — the revenue engine of the entire NoDot platform.
 *
 * Step 1: Scan — camera scans citizen's QR (HMAC validated, geo-locked, one-time use)
 * Step 2: Photo — picker photographs the physical bag(s)
 * Step 3: Weight — picker enters weight per bag
 * Step 4: Complete — summary, next-job CTA, head-to-depot CTA
 *
 * Fraud gates enforced at each step (see nodot-product-spec.md §6):
 *  Gate 1 — Geo lock (enforced server-side; UI shows location chip)
 *  Gate 2 — HMAC + one-time-use + expiry (server-side; UI shows validation state)
 *  Gate 3 — Photo taken in-app, EXIF timestamp validated (UI disables gallery import)
 *  Gate 4/5 — Weight provisional; depot weight is source of truth
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';

const UND = Platform.OS !== 'web';
const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
const hapticM = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
const hapticS = (type: 'success' | 'error') => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(type === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error);
    }
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;
type ScanState = 'idle' | 'scanning' | 'validating' | 'success' | 'error';
type PhotoState = 'idle' | 'capturing' | 'validating' | 'success' | 'error';
type MaterialType = 'PET Plastic' | 'Cardboard' | 'Glass' | 'Metal' | 'Paper' | 'Mixed';

type ScannedBag = {
    bagId: string;
    materialType: MaterialType;
    citizenName: string;
    address: string;
    photoUrl?: string;
    declaredWeightKg?: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
    1: 'Scan QR',
    2: 'Photo',
    3: 'Weight',
    4: 'Complete',
};

const MATERIAL_COLORS: Record<MaterialType, string> = {
    'PET Plastic': '#2C6E91',
    'Cardboard': '#A0522D',
    'Glass': '#5BA392',
    'Metal': '#757575',
    'Paper': '#7B68AA',
    'Mixed': '#E28F3C',
};

const MATERIAL_ICONS: Record<MaterialType, string> = {
    'PET Plastic': 'water-outline',
    'Cardboard': 'cube-outline',
    'Glass': 'wine-outline',
    'Metal': 'hardware-chip-outline',
    'Paper': 'newspaper-outline',
    'Mixed': 'layers-outline',
};

// ─── Mock scanned result ──────────────────────────────────────────────────────

const MOCK_SCANNED: ScannedBag = {
    bagId: 'BAG-12345',
    materialType: 'PET Plastic',
    citizenName: 'Thabo M.',
    address: '321 Oak Drive, Melville',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
    const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.surface },

        // Header
        header: {
            paddingHorizontal: 20, paddingBottom: 20,
            borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            overflow: 'hidden',
        },
        headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
        },
        headerLeft: { flex: 1, gap: 1 },
        headerSub: { fontFamily: F.semibold, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
        headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFF', letterSpacing: -0.3 },

        // Step progress bar
        stepBar: { flexDirection: 'row', gap: 6, marginTop: 16 },
        stepSegment: {
            flex: 1, height: 3, borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.18)',
            overflow: 'hidden',
        },
        stepSegmentFill: {
            width: '100%', height: '100%',
            backgroundColor: '#4EC831',
        },
        stepLabelRow: { flexDirection: 'row', marginTop: 8 },
        stepLabel: { flex: 1, fontFamily: F.semibold, fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
        stepLabelActive: { color: '#4EC831' },
        stepLabelDone: { color: 'rgba(255,255,255,0.7)' },

        // Content scroll
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

        // Cards
        card: {
            backgroundColor: C.card, borderRadius: 20,
            borderWidth: 1, borderColor: cardBorder,
            padding: 16, gap: 12,
            shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },

        // ── Step 1: Scan ──────────────────────────────────────────────────────────

        viewfinder: {
            height: 260, borderRadius: 20, overflow: 'hidden',
            backgroundColor: '#000',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(78,200,49,0.3)',
        },
        viewfinderFrame: {
            width: 180, height: 180,
            alignItems: 'center', justifyContent: 'center',
        },
        viewfinderCorner: { position: 'absolute', width: 24, height: 24, borderColor: '#4EC831' },
        cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
        cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
        cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
        cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
        scanLine: {
            position: 'absolute', left: 0, right: 0, height: 2,
            backgroundColor: '#4EC831', opacity: 0.8,
        },
        viewfinderLabel: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 16, textAlign: 'center' },

        // Scan states
        scanStateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center' },
        scanStateDot: { width: 8, height: 8, borderRadius: 4 },
        scanStateText: { fontFamily: F.semibold, fontSize: 13 },

        // Geo lock chip
        geoChip: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 7,
            backgroundColor: isDark ? 'rgba(78,200,49,0.10)' : '#EBF8E5',
            borderRadius: 12, borderWidth: 1,
            borderColor: isDark ? 'rgba(78,200,49,0.22)' : 'rgba(78,200,49,0.25)',
            alignSelf: 'flex-start',
        },
        geoChipText: { fontFamily: F.semibold, fontSize: 12, color: isDark ? '#7ED45A' : '#2E7D32' },

        // Simulate scan button (demo only — replace CameraView in production)
        simulateScanBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 16,
            backgroundColor: C.brand,
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }, elevation: 3,
        },
        simulateScanBtnText: { fontFamily: F.bold, fontSize: 14, color: C.navy },

        scanErrorCard: {
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: isDark ? 'rgba(229,57,53,0.12)' : '#FFEBEE',
            borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: isDark ? 'rgba(229,57,53,0.25)' : 'rgba(229,57,53,0.2)',
        },
        scanErrorText: { fontFamily: F.semibold, fontSize: 13, color: '#E53935', flex: 1 },

        // ── Bag info card (shown after scan success) ──────────────────────────────

        bagInfoCard: {
            borderRadius: 20, borderWidth: 1.5,
            borderColor: isDark ? 'rgba(78,200,49,0.3)' : 'rgba(78,200,49,0.22)',
            overflow: 'hidden',
        },
        bagInfoTop: { padding: 16, gap: 10 },
        bagInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        bagInfoId: { fontFamily: F.black, fontSize: 20, color: C.ink, letterSpacing: 1 },
        bagInfoMaterialBadge: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        },
        bagInfoMaterialText: { fontFamily: F.bold, fontSize: 12 },
        bagInfoCitizen: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
        bagInfoAddress: { fontFamily: F.body, fontSize: 12, color: C.muted },
        bagInfoSuccessStrip: {
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: isDark ? 'rgba(78,200,49,0.10)' : '#EBF8E5',
            paddingHorizontal: 16, paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(78,200,49,0.15)' : 'rgba(78,200,49,0.2)',
        },
        bagInfoSuccessText: {
            fontFamily: F.semibold, fontSize: 12,
            color: isDark ? '#7ED45A' : '#2E7D32', flex: 1,
        },

        // ── Step 2: Photo ─────────────────────────────────────────────────────────

        photoFrame: {
            height: 220, borderRadius: 18, overflow: 'hidden',
            backgroundColor: isDark ? '#0A0F15' : C.wash,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderStyle: 'dashed',
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
        },
        photoFrameSuccess: {
            borderColor: C.brand, borderStyle: 'solid', borderWidth: 2,
        },
        photoPlaceholderText: {
            fontFamily: F.semibold, fontSize: 13,
            color: isDark ? 'rgba(255,255,255,0.5)' : C.muted, marginTop: 10, textAlign: 'center',
        },
        captureBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 16, backgroundColor: isDark ? C.brand : C.ink,
            borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'transparent',
        },
        captureBtnText: { fontFamily: F.bold, fontSize: 14, color: isDark ? C.navy : C.surface },
        retakeBtn: {
            paddingVertical: 12, borderRadius: 16, alignItems: 'center',
            borderWidth: 1, borderColor: cardBorder,
        },
        retakeBtnText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },

        photoRuleRow: { flexDirection: 'row', gap: 8 },
        photoRuleChip: {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 10, paddingVertical: 6,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : C.wash,
            borderRadius: 10,
        },
        photoRuleText: { fontFamily: F.body, fontSize: 11, color: C.muted },

        // ── Step 3: Weight ────────────────────────────────────────────────────────

        weightSummaryCard: {
            backgroundColor: C.card, borderRadius: 20,
            borderWidth: 1, borderColor: cardBorder,
            overflow: 'hidden',
        },
        weightRow: {
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: cardBorder,
        },
        weightIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
        weightBagId: { fontFamily: F.bold, fontSize: 13, color: C.ink, flex: 1 },
        weightMaterial: { fontFamily: F.body, fontSize: 11, color: C.muted },
        weightInputWrap: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : C.wash,
            borderRadius: 12, borderWidth: 1, borderColor: cardBorder, minWidth: 90,
        },
        weightInput: {
            fontFamily: F.bold, fontSize: 18, color: C.ink,
            minWidth: 52, textAlign: 'center',
        },
        weightUnit: { fontFamily: F.semibold, fontSize: 13, color: C.muted },

        weightTotalStrip: {
            flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: isDark ? 'rgba(78,200,49,0.07)' : '#EBF8E5',
        },
        weightTotalLabel: { fontFamily: F.semibold, fontSize: 13, color: isDark ? '#7ED45A' : '#2E7D32' },
        weightTotalVal: { fontFamily: F.bold, fontSize: 18, color: isDark ? '#7ED45A' : '#2E7D32' },

        weightDisclaimer: {
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
            backgroundColor: isDark ? 'rgba(255,193,7,0.08)' : '#FFFDE7',
            borderRadius: 14, padding: 12,
            borderWidth: 1, borderColor: isDark ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.35)',
        },
        weightDisclaimerText: { fontFamily: F.body, fontSize: 12, color: '#F9A825', flex: 1, lineHeight: 18 },

        // ── Step 4: Complete ──────────────────────────────────────────────────────

        completeBanner: {
            alignItems: 'center', paddingVertical: 32, gap: 12,
        },
        completeCircle: {
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: C.brandLight,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 }, elevation: 4,
        },
        completeTitle: { fontFamily: F.black, fontSize: 26, color: C.ink, letterSpacing: -0.4 },
        completeSub: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },

        summaryCard: {
            backgroundColor: C.card, borderRadius: 20,
            borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
        },
        summaryRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 13,
            borderBottomWidth: 1, borderBottomColor: cardBorder,
        },
        summaryLabel: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
        summaryVal: { fontFamily: F.bold, fontSize: 14, color: C.ink },
        summaryValGreen: { fontFamily: F.bold, fontSize: 14, color: C.brand },

        // CTA buttons
        primaryBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 15, borderRadius: 18, backgroundColor: C.brand,
            shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 }, elevation: 4,
        },
        primaryBtnText: { fontFamily: F.bold, fontSize: 15, color: C.navy },
        secondaryBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 18,
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : C.wash,
            borderWidth: 1, borderColor: cardBorder,
        },
        secondaryBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

        nextBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 15, borderRadius: 18, backgroundColor: C.brand,
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }, elevation: 3,
        },
        nextBtnText: { fontFamily: F.bold, fontSize: 15, color: C.navy },
        nextBtnDisabled: { backgroundColor: C.wash, shadowOpacity: 0 },

        pressed: { opacity: 0.75 },
    });
}

// ─── Step 1: QR Scan panel ────────────────────────────────────────────────────

function Step1Scan({
    styles, C, isDark,
    scanState, scannedBag, onSimulateScan, onScanError,
}: {
    styles: ReturnType<typeof createStyles>;
    C: ReturnType<typeof useTheme>['colors'];
    isDark: boolean;
    scanState: ScanState;
    scannedBag: ScannedBag | null;
    onSimulateScan: () => void;
    onScanError: () => void;
}) {
    // Animated scan line
    const scanLineY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(scanLineY, { toValue: 1, duration: 1800, useNativeDriver: UND, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(scanLineY, { toValue: 0, duration: 1800, useNativeDriver: UND, easing: Easing.inOut(Easing.ease) }),
        ]));
        loop.start();
        return () => loop.stop();
    }, []);

    const materialColor = scannedBag ? MATERIAL_COLORS[scannedBag.materialType] : C.brand;
    const materialIcon = scannedBag ? MATERIAL_ICONS[scannedBag.materialType] : 'layers-outline';

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Viewfinder */}
            <View style={styles.viewfinder}>
                <View style={styles.viewfinderFrame}>
                    <View style={[styles.viewfinderCorner, styles.cornerTL]} />
                    <View style={[styles.viewfinderCorner, styles.cornerTR]} />
                    <View style={[styles.viewfinderCorner, styles.cornerBL]} />
                    <View style={[styles.viewfinderCorner, styles.cornerBR]} />
                    {scanState !== 'success' && (
                        <Animated.View style={[styles.scanLine, {
                            top: scanLineY.interpolate({ inputRange: [0, 1], outputRange: [0, 176] }),
                        }]} />
                    )}
                    {scanState === 'success' && (
                        <Ionicons name="checkmark-circle" size={64} color="#4EC831" />
                    )}
                    {scanState === 'error' && (
                        <Ionicons name="close-circle" size={64} color="#E53935" />
                    )}
                </View>
                <Text style={styles.viewfinderLabel}>
                    {scanState === 'idle' && 'Point camera at citizen\'s screen'}
                    {scanState === 'scanning' && 'Scanning…'}
                    {scanState === 'validating' && 'Validating with server…'}
                    {scanState === 'success' && 'QR Verified ✓'}
                    {scanState === 'error' && 'Scan failed — try again'}
                </Text>
            </View>

            {/* Scan state chip */}
            <View style={styles.scanStateRow}>
                <View style={[styles.scanStateDot, {
                    backgroundColor: scanState === 'success' ? '#4EC831' : scanState === 'error' ? '#E53935' : '#F9A825',
                }]} />
                <Text style={[styles.scanStateText, {
                    color: scanState === 'success' ? (isDark ? '#7ED45A' : '#2E7D32')
                        : scanState === 'error' ? '#E53935'
                            : C.muted,
                }]}>
                    {scanState === 'idle' && 'Waiting for QR code'}
                    {scanState === 'scanning' && 'Detecting QR…'}
                    {scanState === 'validating' && 'Checking: HMAC · Expiry · Geo · Usage'}
                    {scanState === 'success' && 'All checks passed — bag verified'}
                    {scanState === 'error' && 'QR invalid or already used'}
                </Text>
            </View>

            {/* Geo lock indicator */}
            <View style={styles.geoChip}>
                <Ionicons name="location" size={13} color={isDark ? '#7ED45A' : '#2E7D32'} />
                <Text style={styles.geoChipText}>Geo lock active — within 150m of address</Text>
            </View>

            {/* Error card */}
            {scanState === 'error' && (
                <View style={styles.scanErrorCard}>
                    <Ionicons name="warning-outline" size={20} color="#E53935" />
                    <Text style={styles.scanErrorText}>
                        This QR was rejected. Common causes:{'\n'}
                        • QR already scanned (one-time use){'\n'}
                        • Expired QR (ask citizen to regenerate){'\n'}
                        • You are too far from the pickup address
                    </Text>
                </View>
            )}

            {/* Scanned bag info */}
            {scannedBag && scanState === 'success' && (
                <View style={styles.bagInfoCard}>
                    <View style={styles.bagInfoTop}>
                        <View style={styles.bagInfoRow}>
                            <Text style={styles.bagInfoId}>{scannedBag.bagId}</Text>
                            <View style={[styles.bagInfoMaterialBadge, { backgroundColor: `${materialColor}18` }]}>
                                <Ionicons name={materialIcon as any} size={14} color={materialColor} />
                                <Text style={[styles.bagInfoMaterialText, { color: materialColor }]}>{scannedBag.materialType}</Text>
                            </View>
                        </View>
                        <Text style={styles.bagInfoCitizen}>{scannedBag.citizenName}</Text>
                        <Text style={styles.bagInfoAddress}>{scannedBag.address}</Text>
                    </View>
                    <View style={styles.bagInfoSuccessStrip}>
                        <Ionicons name="shield-checkmark" size={16} color={isDark ? '#7ED45A' : '#2E7D32'} />
                        <Text style={styles.bagInfoSuccessText}>
                            HMAC verified · Not previously scanned · Within geo-lock radius
                        </Text>
                    </View>
                </View>
            )}

            {/* Demo scan trigger — in production this is replaced by CameraView */}
            {scanState !== 'success' && (
                <View style={{ gap: 10 }}>
                    <Pressable
                        style={({ pressed }) => [styles.simulateScanBtn, pressed && styles.pressed]}
                        onPress={onSimulateScan}
                    >
                        <Ionicons name="qr-code" size={20} color={C.navy} />
                        <Text style={styles.simulateScanBtnText}>
                            {scanState === 'idle' ? 'Simulate Scan (Demo)' : 'Retry Scan'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                        onPress={onScanError}
                    >
                        <Text style={styles.secondaryBtnText}>Simulate Failed Scan</Text>
                    </Pressable>
                </View>
            )}
        </ScrollView>
    );
}

// ─── Step 2: Photo panel ──────────────────────────────────────────────────────

function Step2Photo({
    styles, C, isDark,
    photoState, onCapture, onRetake,
}: {
    styles: ReturnType<typeof createStyles>;
    C: ReturnType<typeof useTheme>['colors'];
    isDark: boolean;
    photoState: PhotoState;
    onCapture: () => void;
    onRetake: () => void;
}) {
    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>Photograph the Bag</Text>
                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19 }}>
                    Take a clear photo of the bag with visible contents. This is required to verify the pickup.
                </Text>

                {/* Photo rules */}
                <View style={styles.photoRuleRow}>
                    {[
                        { icon: 'camera-outline', text: 'Live camera only' },
                        { icon: 'time-outline', text: 'Taken now' },
                        { icon: 'eye-outline', text: 'Bag must be visible' },
                    ].map(r => (
                        <View key={r.text} style={styles.photoRuleChip}>
                            <Ionicons name={r.icon as any} size={12} color={C.muted} />
                            <Text style={styles.photoRuleText}>{r.text}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Photo frame */}
            <View style={[styles.photoFrame, photoState === 'success' && styles.photoFrameSuccess]}>
                {photoState === 'success' ? (
                    <Ionicons name="checkmark-circle" size={56} color="#4EC831" />
                ) : photoState === 'validating' ? (
                    <Ionicons name="sync-outline" size={40} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"} />
                ) : (
                    <>
                        <Ionicons name="camera-outline" size={44} color={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"} />
                        <Text style={styles.photoPlaceholderText}>
                            {photoState === 'error' ? 'Photo rejected — try again' : 'No photo taken yet'}
                        </Text>
                    </>
                )}
            </View>

            {/* AI validation result */}
            {photoState === 'success' && (
                <View style={[styles.card, { borderColor: isDark ? 'rgba(78,200,49,0.25)' : 'rgba(78,200,49,0.2)', borderWidth: 1.5 }]}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <Ionicons name="shield-checkmark" size={20} color={isDark ? '#7ED45A' : '#2E7D32'} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: F.bold, fontSize: 13, color: isDark ? '#7ED45A' : '#2E7D32' }}>
                                Photo Verified
                            </Text>
                            <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted, lineHeight: 18, marginTop: 3 }}>
                                AI confirmed bag present · Unique perceptual hash · EXIF timestamp matches scan time
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {photoState === 'error' && (
                <View style={styles.scanErrorCard}>
                    <Ionicons name="warning-outline" size={18} color="#E53935" />
                    <Text style={styles.scanErrorText}>
                        Photo rejected. Ensure the bag is clearly visible and well-lit.
                    </Text>
                </View>
            )}

            <Pressable
                style={({ pressed }) => [styles.captureBtn, pressed && styles.pressed]}
                onPress={onCapture}
            >
                <Ionicons name="camera" size={18} color={isDark ? C.navy : C.surface} />
                <Text style={styles.captureBtnText}>
                    {photoState === 'success' ? 'Photo Accepted' : 'Take Photo (Demo)'}
                </Text>
            </Pressable>
            {photoState === 'success' && (
                <Pressable style={({ pressed }) => [styles.retakeBtn, pressed && styles.pressed]} onPress={onRetake}>
                    <Text style={styles.retakeBtnText}>Retake Photo</Text>
                </Pressable>
            )}
        </ScrollView>
    );
}

// ─── Step 3: Weight entry ─────────────────────────────────────────────────────

function Step3Weight({
    styles, C, isDark, bag, weightKg, onWeightChange,
}: {
    styles: ReturnType<typeof createStyles>;
    C: ReturnType<typeof useTheme>['colors'];
    isDark: boolean;
    bag: ScannedBag;
    weightKg: string;
    onWeightChange: (v: string) => void;
}) {
    const materialColor = MATERIAL_COLORS[bag.materialType];
    const materialIcon = MATERIAL_ICONS[bag.materialType];
    const weightNum = parseFloat(weightKg) || 0;
    // Estimated payout based on material rate (picker gets ~82% of depot value)
    const estPayout = (weightNum * (bag.materialType === 'PET Plastic' ? 8 : bag.materialType === 'Metal' ? 6 : 3) * 0.82).toFixed(2);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Instruction */}
                <View style={styles.card}>
                    <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>Enter Bag Weight</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19 }}>
                        Weigh the bag and enter the weight below. This is a provisional entry —
                        the depot's weigh-in is the official source of truth for your payout.
                    </Text>
                </View>

                {/* Weight input table */}
                <View style={styles.weightSummaryCard}>
                    <View style={styles.weightRow}>
                        <View style={[styles.weightIconWrap, { backgroundColor: `${materialColor}18` }]}>
                            <Ionicons name={materialIcon as any} size={20} color={materialColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.weightBagId}>{bag.bagId}</Text>
                            <Text style={styles.weightMaterial}>{bag.materialType}</Text>
                        </View>
                        <View style={styles.weightInputWrap}>
                            <TextInput
                                style={styles.weightInput}
                                keyboardType="decimal-pad"
                                value={weightKg}
                                onChangeText={v => {
                                    // Only allow valid decimal numbers
                                    if (/^\d*\.?\d{0,2}$/.test(v)) onWeightChange(v);
                                }}
                                placeholder="0.0"
                                placeholderTextColor={C.muted}
                                maxLength={5}
                            />
                            <Text style={styles.weightUnit}>kg</Text>
                        </View>
                    </View>

                    {/* Total strip */}
                    <View style={styles.weightTotalStrip}>
                        <Text style={styles.weightTotalLabel}>Declared Total</Text>
                        <Text style={styles.weightTotalVal}>{weightNum.toFixed(2)} kg · ~R{estPayout}</Text>
                    </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.weightDisclaimer}>
                    <Ionicons name="information-circle-outline" size={18} color="#F9A825" />
                    <Text style={styles.weightDisclaimerText}>
                        Declared weight is provisional. Your final payout is based on the
                        depot's confirmed weight. Repeated discrepancies (&gt;15%) will trigger a review.
                    </Text>
                </View>

                {/* High/low weight flags */}
                {weightNum > 20 && (
                    <View style={[styles.weightDisclaimer, { borderColor: isDark ? 'rgba(229,57,53,0.3)' : 'rgba(229,57,53,0.25)', backgroundColor: isDark ? 'rgba(229,57,53,0.10)' : '#FFEBEE' }]}>
                        <Ionicons name="warning-outline" size={18} color="#E53935" />
                        <Text style={[styles.weightDisclaimerText, { color: '#E53935' }]}>
                            Weight over 20 kg will be flagged for manual review.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Step 4: Complete ─────────────────────────────────────────────────────────

function Step4Complete({
    styles, C, isDark, bag, weightKg, onNextJob, onGoToDepot,
}: {
    styles: ReturnType<typeof createStyles>;
    C: ReturnType<typeof useTheme>['colors'];
    isDark: boolean;
    bag: ScannedBag;
    weightKg: string;
    onNextJob: () => void;
    onGoToDepot: () => void;
}) {
    const celebrateAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        hapticS('success');
        Animated.spring(celebrateAnim, { toValue: 1, useNativeDriver: UND, tension: 60, friction: 8 }).start();
    }, []);

    const weightNum = parseFloat(weightKg) || 0;
    const estEarnings = (weightNum * (bag.materialType === 'PET Plastic' ? 8 : 3) * 0.82).toFixed(2);

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.completeBanner, {
                opacity: celebrateAnim,
                transform: [{ scale: celebrateAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            }]}>
                <View style={styles.completeCircle}>
                    <Ionicons name="checkmark-circle" size={44} color={C.brand} />
                </View>
                <Text style={styles.completeTitle}>Bag Scanned!</Text>
                <Text style={styles.completeSub}>
                    {bag.bagId} is now in transit.{'\n'}
                    Head to the depot to confirm and unlock your earnings.
                </Text>
            </Animated.View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                {[
                    { label: 'Bag ID', val: bag.bagId, green: false },
                    { label: 'Material', val: bag.materialType, green: false },
                    { label: 'Citizen', val: bag.citizenName, green: false },
                    { label: 'Declared Wt', val: `${weightNum.toFixed(2)} kg`, green: false },
                    { label: 'Est. Earnings', val: `R${estEarnings}`, green: true },
                    { label: 'Settlement', val: 'After depot confirms', green: false },
                ].map((row, i, arr) => (
                    <View key={row.label} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={styles.summaryLabel}>{row.label}</Text>
                        <Text style={row.green ? styles.summaryValGreen : styles.summaryVal}>{row.val}</Text>
                    </View>
                ))}
            </View>

            {/* CTAs */}
            <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={onGoToDepot}
            >
                <Ionicons name="business-outline" size={18} color={C.navy} />
                <Text style={styles.primaryBtnText}>Head to Depot</Text>
            </Pressable>
            <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={onNextJob}
            >
                <Ionicons name="list-outline" size={16} color={C.ink} />
                <Text style={styles.secondaryBtnText}>Back to Jobs</Text>
            </Pressable>
        </ScrollView>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PickerScan() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors: C, gradients: G, isDark } = useTheme();
    const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

    const [step, setStep] = useState<Step>(1);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [photoState, setPhotoState] = useState<PhotoState>('idle');
    const [scannedBag, setScannedBag] = useState<ScannedBag | null>(null);
    const [weightKg, setWeightKg] = useState('');
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'error' | 'warning' }>({
        visible: false, message: '', type: 'info',
    });

    const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') =>
        setToast({ visible: true, message: msg, type }), []);

    // Step progress animation
    const progressAnims = useRef([1, 2, 3, 4].map(() => new Animated.Value(0))).current;

    const advanceProgress = useCallback((targetStep: Step) => {
        const idx = targetStep - 1;
        Animated.timing(progressAnims[idx], { toValue: 1, duration: 400, useNativeDriver: false }).start();
    }, []);

    useEffect(() => { advanceProgress(step); }, [step]);

    // ── Step 1 handlers ──────────────────────────────────────────────────────────

    const handleSimulateScan = useCallback(() => {
        hapticM();
        setScanState('scanning');
        setTimeout(() => {
            setScanState('validating');
            setTimeout(() => {
                hapticS('success');
                setScanState('success');
                setScannedBag(MOCK_SCANNED);
            }, 1200);
        }, 800);
    }, []);

    const handleScanError = useCallback(() => {
        hapticS('error');
        setScanState('error');
    }, []);

    // ── Step 2 handlers ──────────────────────────────────────────────────────────

    const handleCapture = useCallback(() => {
        hapticM();
        setPhotoState('capturing');
        setTimeout(() => {
            setPhotoState('validating');
            setTimeout(() => {
                hapticS('success');
                setPhotoState('success');
            }, 1000);
        }, 600);
    }, []);

    const handleRetake = useCallback(() => {
        setPhotoState('idle');
    }, []);

    // ── Step advance ─────────────────────────────────────────────────────────────

    const canAdvance = useMemo(() => {
        if (step === 1) return scanState === 'success';
        if (step === 2) return photoState === 'success';
        if (step === 3) return parseFloat(weightKg) > 0;
        return false;
    }, [step, scanState, photoState, weightKg]);

    const handleNext = useCallback(() => {
        if (!canAdvance) return;
        haptic();
        const next = (step + 1) as Step;
        setStep(next);
        advanceProgress(next);
    }, [canAdvance, step, advanceProgress]);

    const handleGoToDepot = useCallback(() => {
        haptic();
        router.push('/Picker/navigate' as any);
    }, [router]);

    const handleNextJob = useCallback(() => {
        haptic();
        router.push('/Picker/jobs' as any);
    }, [router]);

    return (
        <ErrorBoundary>
            <View style={[styles.root, { flex: 1 }]}>
                <Toast
                    visible={toast.visible} message={toast.message} type={toast.type}
                    onHide={() => setToast(t => ({ ...t, visible: false }))}
                />

                {/* ── Header ── */}
                <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <View style={styles.headerRow}>
                        <Pressable
                            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                            onPress={() => { haptic(); step > 1 ? setStep(s => (s - 1) as Step) : router.back(); }}
                        >
                            <Ionicons name="chevron-back" size={20} color="#FFF" />
                        </Pressable>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerSub}>Step {step} of 4</Text>
                            <Text style={styles.headerTitle}>{STEP_LABELS[step]}</Text>
                        </View>
                    </View>

                    {/* Step progress bar */}
                    <View style={styles.stepBar}>
                        {([1, 2, 3, 4] as Step[]).map(s => (
                            <View key={s} style={styles.stepSegment}>
                                <Animated.View style={[styles.stepSegmentFill, {
                                    opacity: progressAnims[s - 1].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                                    transform: [{ scaleX: progressAnims[s - 1] }],
                                    transformOrigin: 'left' as any,
                                }]} />
                            </View>
                        ))}
                    </View>
                    <View style={styles.stepLabelRow}>
                        {([1, 2, 3, 4] as Step[]).map(s => (
                            <Text
                                key={s}
                                style={[
                                    styles.stepLabel,
                                    s === step && styles.stepLabelActive,
                                    s < step && styles.stepLabelDone,
                                ]}
                            >
                                {STEP_LABELS[s]}
                            </Text>
                        ))}
                    </View>
                </LinearGradient>

                {/* ── Step panels ── */}
                {step === 1 && (
                    <Step1Scan
                        styles={styles} C={C} isDark={isDark}
                        scanState={scanState} scannedBag={scannedBag}
                        onSimulateScan={handleSimulateScan} onScanError={handleScanError}
                    />
                )}
                {step === 2 && (
                    <Step2Photo
                        styles={styles} C={C} isDark={isDark}
                        photoState={photoState} onCapture={handleCapture} onRetake={handleRetake}
                    />
                )}
                {step === 3 && scannedBag && (
                    <Step3Weight
                        styles={styles} C={C} isDark={isDark}
                        bag={scannedBag} weightKg={weightKg} onWeightChange={setWeightKg}
                    />
                )}
                {step === 4 && scannedBag && (
                    <Step4Complete
                        styles={styles} C={C} isDark={isDark}
                        bag={scannedBag} weightKg={weightKg}
                        onNextJob={handleNextJob} onGoToDepot={handleGoToDepot}
                    />
                )}

                {/* ── Next step button (sticky) ── */}
                {step < 4 && (
                    <View style={{
                        paddingHorizontal: 16,
                        paddingBottom: Math.max(insets.bottom + 10, 24),
                        paddingTop: 10,
                        backgroundColor: C.surface,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    }}>
                        <Pressable
                            style={({ pressed }) => [styles.nextBtn, !canAdvance && styles.nextBtnDisabled, pressed && canAdvance && styles.pressed]}
                            onPress={handleNext}
                            disabled={!canAdvance}
                        >
                            <Text style={[styles.nextBtnText, !canAdvance && { color: C.muted }]}>
                                {step === 1 && 'Continue to Photo →'}
                                {step === 2 && 'Continue to Weight →'}
                                {step === 3 && 'Confirm & Complete →'}
                            </Text>
                        </Pressable>
                        {!canAdvance && (
                            <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 8 }}>
                                {step === 1 && 'Scan a valid QR code to continue'}
                                {step === 2 && 'Take a photo to continue'}
                                {step === 3 && 'Enter bag weight to continue'}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </ErrorBoundary>
    );
}
