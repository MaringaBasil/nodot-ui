import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const UND = Platform.OS !== 'web';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function materialColor(material: string): string {
    const map: Record<string, string> = {
        'PET Plastic': '#2C6E91',
        'Cardboard': '#A0522D',
        'Glass': '#5BA392',
        'Metal': '#757575',
        'Paper': '#7B68AA',
        'Mixed': '#E28F3C',
    };
    return map[material] ?? '#4EC831';
}

function materialIcon(material: string): string {
    const map: Record<string, string> = {
        'PET Plastic': 'water-outline',
        'Cardboard': 'cube-outline',
        'Glass': 'wine-outline',
        'Metal': 'hardware-chip-outline',
        'Paper': 'newspaper-outline',
        'Mixed': 'layers-outline',
    };
    return map[material] ?? 'layers-outline';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// qrSize is returned separately — keeping a plain number out of StyleSheet.create
// avoids the mixed ViewStyle/TextStyle inference issue.

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean, width: number) {
    const qrSize = Math.min(width - 80, 280);

    const styles = StyleSheet.create({
        root: { flex: 1, backgroundColor: isDark ? '#0F1218' : '#FAFBF9' },

        headerBar: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            paddingHorizontal: 20,
        },
        backBtn: {
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            alignItems: 'center' as const, justifyContent: 'center' as const,
        },
        headerLabel: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
        shareBtn: {
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            alignItems: 'center' as const, justifyContent: 'center' as const,
        },

        materialBadge: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            gap: 8, alignSelf: 'center' as const,
            marginTop: 4, paddingHorizontal: 14, paddingVertical: 7,
            borderRadius: 20, borderWidth: 1,
        },
        materialBadgeText: { fontFamily: F.semibold, fontSize: 13 },

        qrContainer: {
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            marginTop: 8, gap: 24,
        },
        qrWrap: {
            width: qrSize + 32, height: qrSize + 32,
            borderRadius: 28, backgroundColor: '#FFFFFF',
            alignItems: 'center' as const, justifyContent: 'center' as const,
            shadowColor: '#000', shadowOpacity: isDark ? 0.5 : 0.14,
            shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
        },

        // Validity ring
        validRing: {
            position: 'absolute' as const,
            width: qrSize + 64, height: qrSize + 64,
            borderRadius: (qrSize + 64) / 2,
            borderWidth: 2, borderColor: '#4EC831',
        },

        bagIdWrap: { alignItems: 'center' as const, gap: 6 },
        bagIdLabel: { fontFamily: F.body, fontSize: 12, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase' as const },
        bagId: { fontFamily: F.black, fontSize: 26, color: C.ink, letterSpacing: 1.5 },
        bagIdSub: { fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center' as const, lineHeight: 18 },

        instructCard: {
            marginHorizontal: 20,
            backgroundColor: isDark ? 'rgba(78,200,49,0.08)' : '#EBF8E5',
            borderRadius: 16, padding: 16,
            flexDirection: 'row' as const,
            alignItems: 'flex-start' as const,
            gap: 12, borderWidth: 1,
            borderColor: isDark ? 'rgba(78,200,49,0.20)' : 'rgba(78,200,49,0.25)',
        },
        instructText: {
            fontFamily: F.semibold, fontSize: 13,
            color: isDark ? '#7ED45A' : '#2E7D32',
            flex: 1, lineHeight: 20,
        },

        expiryWarn: {
            marginHorizontal: 20,
            backgroundColor: isDark ? 'rgba(245,124,0,0.12)' : '#FFF3E0',
            borderRadius: 16, padding: 14,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            gap: 10, borderWidth: 1,
            borderColor: isDark ? 'rgba(245,124,0,0.25)' : 'rgba(245,124,0,0.3)',
        },
        expiryWarnText: { fontFamily: F.semibold, fontSize: 13, color: '#F57C00', flex: 1 },

        expiredOverlay: {
            position: 'absolute' as const,
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 28,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center' as const, justifyContent: 'center' as const,
        },
        expiredText: { fontFamily: F.bold, fontSize: 16, color: '#FFF', marginTop: 8 },
        renewBtn: {
            paddingHorizontal: 20, paddingVertical: 11,
            borderRadius: 20, backgroundColor: '#F57C00', marginTop: 12,
        },
        renewBtnText: { fontFamily: F.bold, fontSize: 13, color: '#FFF' },

        pressed: { opacity: 0.72 },
    });

    return { styles, qrSize };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BagQRScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { colors: C, isDark } = useTheme();
    const { styles, qrSize } = useMemo(() => createStyles(C, isDark, width), [C, isDark, width]);

    const params = useLocalSearchParams<{ bagId: string; material: string; expiresAt?: string }>();
    const bagId = params.bagId ?? 'BAG-12345';
    const material = params.material ?? 'Mixed';

    // QR payload mirrors the server-generated HMAC payload structure
    const qrPayload = useMemo(() => JSON.stringify({
        bag_id: bagId,
        ts: Date.now(),
        v: 1,
    }), [bagId]);

    // Expiry countdown
    const expiresAt = useMemo(() =>
        params.expiresAt ? new Date(params.expiresAt) : new Date(Date.now() + 47 * 3_600_000),
        [params.expiresAt],
    );
    const [msLeft, setMsLeft] = useState(expiresAt.getTime() - Date.now());
    useEffect(() => {
        const t = setInterval(() => setMsLeft(expiresAt.getTime() - Date.now()), 30_000);
        return () => clearInterval(t);
    }, [expiresAt]);
    const isExpired = msLeft <= 0;
    const isUrgent = !isExpired && msLeft < 6 * 3_600_000;
    const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000));
    const minsLeft = Math.max(0, Math.floor((msLeft % 3_600_000) / 60_000));

    // Ring pulse animation (valid QRs only)
    const ringAnim = useRef(new Animated.Value(0.7)).current;
    useEffect(() => {
        if (isExpired) return;
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(ringAnim, { toValue: 1.06, duration: 1400, useNativeDriver: UND }),
            Animated.timing(ringAnim, { toValue: 0.7, duration: 1400, useNativeDriver: UND }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [isExpired]);

    const accent = materialColor(material);
    const icon = materialIcon(material);

    const handleRenew = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
    }, [router]);

    return (
        <ErrorBoundary>
            <View style={styles.root}>
                {/* ── Header ── */}
                <View style={[styles.headerBar, { paddingTop: insets.top + 12, marginBottom: 16 }]}>
                    <Pressable
                        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                    >
                        <Ionicons name="chevron-back" size={20} color={C.ink} />
                    </Pressable>
                    <Text style={styles.headerLabel}>Show to Picker</Text>
                    <Pressable style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]} onPress={() => { }}>
                        <Ionicons name="share-outline" size={20} color={C.ink} />
                    </Pressable>
                </View>

                {/* ── Material Badge ── */}
                <View style={[styles.materialBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}30` }]}>
                    <Ionicons name={icon as any} size={16} color={accent} />
                    <Text style={[styles.materialBadgeText, { color: accent }]}>{material}</Text>
                </View>

                {/* ── QR Code ── */}
                <View style={styles.qrContainer}>
                    {/* Animated validity ring */}
                    {!isExpired && (
                        <Animated.View
                            style={[styles.validRing, {
                                opacity: ringAnim.interpolate({ inputRange: [0.7, 1.06], outputRange: [0.6, 0] }),
                                transform: [{ scale: ringAnim }],
                                borderColor: isUrgent ? '#F57C00' : '#4EC831',
                            }]}
                        />
                    )}

                    {/* QR card */}
                    <View style={styles.qrWrap}>
                        <QRCode
                            value={qrPayload}
                            size={qrSize}
                            color="#1B2C3A"
                            backgroundColor="#FFFFFF"
                            quietZone={8}
                        />
                        {isExpired && (
                            <View style={styles.expiredOverlay}>
                                <Ionicons name="close-circle" size={40} color="#FFF" />
                                <Text style={styles.expiredText}>QR Expired</Text>
                                <Pressable
                                    style={({ pressed }) => [styles.renewBtn, pressed && styles.pressed]}
                                    onPress={handleRenew}
                                >
                                    <Text style={styles.renewBtnText}>Regenerate</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Bag ID */}
                    <View style={styles.bagIdWrap}>
                        <Text style={styles.bagIdLabel}>Bag ID</Text>
                        <Text style={styles.bagId}>{bagId}</Text>
                        <Text style={styles.bagIdSub}>
                            {isExpired
                                ? 'This QR has expired. Please regenerate.'
                                : isUrgent
                                    ? `Expires in ${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}m`
                                    : `Valid for ${hoursLeft}h ${minsLeft}m`}
                        </Text>
                    </View>
                </View>

                {/* ── Instructions / Urgency ── */}
                {isUrgent && !isExpired && (
                    <View style={styles.expiryWarn}>
                        <Ionicons name="time-outline" size={20} color="#F57C00" />
                        <Text style={styles.expiryWarnText}>
                            QR expires soon. If not scanned, you'll need to regenerate.
                        </Text>
                    </View>
                )}

                {!isExpired && !isUrgent && (
                    <View style={styles.instructCard}>
                        <Ionicons name="phone-portrait-outline" size={22} color={isDark ? '#7ED45A' : '#2E7D32'} />
                        <Text style={styles.instructText}>
                            Keep this screen visible and hand your device to the picker,
                            or hold it up so they can scan from their phone's camera.
                        </Text>
                    </View>
                )}
            </View>
        </ErrorBoundary>
    );
}
