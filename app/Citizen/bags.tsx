import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';

const UND = Platform.OS !== 'web';
const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

// ─── Types ───────────────────────────────────────────────────────────────────

type MaterialType = 'PET Plastic' | 'Cardboard' | 'Glass' | 'Mixed' | 'Metal' | 'Paper';
type BagStatus = 'open' | 'pending_pickup' | 'in_transit' | 'at_depot' | 'collected' | 'expired';

type DigitalBag = {
    id: string;
    materialType: MaterialType;
    status: BagStatus;
    createdAt: Date;
    qrExpiresAt: Date;
    pickupType?: 'home_pickup' | 'self_dropoff';
    pickerName?: string;
    pickerEta?: string;
};

// ─── Material Config ─────────────────────────────────────────────────────────

const MATERIALS: { type: MaterialType; icon: string; color: string; desc: string }[] = [
    { type: 'PET Plastic', icon: 'water-outline', color: '#2C6E91', desc: 'Bottles, containers' },
    { type: 'Cardboard', icon: 'cube-outline', color: '#A0522D', desc: 'Boxes, packaging' },
    { type: 'Glass', icon: 'wine-outline', color: '#5BA392', desc: 'Bottles, jars' },
    { type: 'Metal', icon: 'hardware-chip-outline', color: '#757575', desc: 'Cans, tins' },
    { type: 'Paper', icon: 'newspaper-outline', color: '#7B68AA', desc: 'Paper, magazines' },
    { type: 'Mixed', icon: 'layers-outline', color: '#E28F3C', desc: 'Assorted recyclables' },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

let _idCounter = 1;
const genId = () => `BAG-${String(++_idCounter * 10000 + Math.floor(Math.random() * 9999)).padStart(5, '0')}`;
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);

const MOCK_BAGS: DigitalBag[] = [
    {
        id: 'BAG-12345', materialType: 'PET Plastic', status: 'in_transit',
        createdAt: new Date(Date.now() - 2 * 3600000), qrExpiresAt: hoursFromNow(22),
        pickupType: 'home_pickup', pickerName: 'Sipho M.', pickerEta: 'En route',
    },
    {
        id: 'BAG-67890', materialType: 'Cardboard', status: 'open',
        createdAt: new Date(Date.now() - 30 * 60000), qrExpiresAt: hoursFromNow(5.5),
    },
    {
        id: 'BAG-11223', materialType: 'Glass', status: 'pending_pickup',
        createdAt: new Date(Date.now() - 60 * 60000), qrExpiresAt: hoursFromNow(41),
        pickupType: 'home_pickup',
    },
];

const MAX_BAGS = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: BagStatus): string {
    switch (status) {
        case 'open': return 'Ready';
        case 'pending_pickup': return 'Awaiting Picker';
        case 'in_transit': return 'En Route to Depot';
        case 'at_depot': return 'At Depot';
        case 'collected': return 'Collected ✓';
        case 'expired': return 'Expired';
    }
}

function statusColor(status: BagStatus, C: ReturnType<typeof useTheme>['colors']): string {
    switch (status) {
        case 'open': return C.brand;
        case 'pending_pickup': return '#F57C00';
        case 'in_transit': return '#2196F3';
        case 'at_depot': return '#7B68AA';
        case 'collected': return C.brand;
        case 'expired': return C.muted;
    }
}

function expiryText(expiresAt: Date): { text: string; urgent: boolean } {
    const ms = expiresAt.getTime() - Date.now();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (ms <= 0) return { text: 'Expired', urgent: true };
    if (h < 1) return { text: `${m}m left`, urgent: true };
    if (h < 6) return { text: `${h}h ${m}m left`, urgent: true };
    return { text: `${h}h left`, urgent: false };
}

function materialIcon(type: MaterialType): { icon: string; color: string } {
    return MATERIALS.find(m => m.type === type) ?? { icon: 'layers-outline', color: '#E28F3C' };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
    const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.surface },

        // Header
        header: {
            paddingHorizontal: 20, paddingBottom: 20,
            borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 }, elevation: 5,
        },
        headerBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
        headerBlob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
        headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        headerLeft: { gap: 2 },
        headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
        headerTitle: { fontFamily: F.display, fontSize: 22, color: '#FFF', letterSpacing: -0.4 },
        addBtn: {
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(78,200,49,0.25)',
            borderWidth: 1, borderColor: 'rgba(78,200,49,0.5)',
            alignItems: 'center', justifyContent: 'center',
        },
        disabledAddBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' },

        // Count chips
        countRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
        countChip: {
            flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
        },
        countVal: { fontFamily: F.bold, fontSize: 18, color: '#FFF' },
        countLbl: { fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

        // Content
        content: { paddingTop: 16, paddingHorizontal: 16, gap: 12 },
        sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
        sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
        requestCta: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 8,
            backgroundColor: C.brand, borderRadius: 20,
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
        },
        requestCtaText: { fontFamily: F.bold, fontSize: 12, color: C.navy },

        // Bag card
        bagCard: {
            backgroundColor: C.card, borderRadius: 18,
            borderWidth: 1, borderColor: border,
            overflow: 'hidden',
            shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },
        bagCardActive: {
            borderColor: isDark ? 'rgba(78,200,49,0.35)' : 'rgba(78,200,49,0.28)',
            borderWidth: 1.5,
        },
        accentBar: { width: 4, backgroundColor: C.brand },
        bagRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
        bagIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        bagInfo: { flex: 1, gap: 3 },
        bagId: { fontFamily: F.semibold, fontSize: 14, color: C.ink, letterSpacing: 0.2 },
        bagMaterial: { fontFamily: F.body, fontSize: 12, color: C.muted },
        bagRight: { alignItems: 'flex-end', gap: 5 },
        statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
        statusText: { fontFamily: F.semibold, fontSize: 11 },
        expiryText: { fontFamily: F.body, fontSize: 11 },

        // Picker banner (for in_transit bags)
        pickerBanner: {
            flexDirection: 'row', alignItems: 'center', gap: 10,
            paddingHorizontal: 14, paddingVertical: 10,
            backgroundColor: isDark ? 'rgba(33,150,243,0.12)' : 'rgba(33,150,243,0.08)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.15)',
        },
        pickerBannerText: { fontFamily: F.semibold, fontSize: 12, color: '#2196F3', flex: 1 },
        qrChip: {
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 10, paddingVertical: 5,
            backgroundColor: isDark ? 'rgba(78,200,49,0.18)' : C.brandLight,
            borderRadius: 12,
        },
        qrChipText: { fontFamily: F.semibold, fontSize: 11, color: C.brand },

        // Empty state
        emptyCard: {
            alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24,
            backgroundColor: C.card, borderRadius: 20,
            borderWidth: 1.5, borderColor: border, borderStyle: 'dashed',
        },
        emptyIcon: {
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        },
        emptyTitle: { fontFamily: F.bold, fontSize: 16, color: C.ink, marginBottom: 6 },
        emptyBody: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
        emptyBtn: {
            marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 22, paddingVertical: 12,
            backgroundColor: C.brand, borderRadius: 24,
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
        },
        emptyBtnText: { fontFamily: F.bold, fontSize: 13, color: C.navy },

        // Create modal
        backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
        modalSheet: {
            backgroundColor: isDark ? '#1E2535' : '#FFF',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, gap: 16,
            borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        },
        modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)', alignSelf: 'center', marginBottom: 4 },
        modalTitle: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
        modalSub: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: -8 },
        materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        materialChip: {
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 14, paddingVertical: 10,
            borderRadius: 14, borderWidth: 1.5, borderColor: border,
            backgroundColor: C.wash, minWidth: '45%', flex: 1,
        },
        materialChipActive: { borderColor: C.brand, backgroundColor: C.brandLight },
        materialChipText: { fontFamily: F.semibold, fontSize: 12, color: C.muted, flex: 1 },
        materialChipTextActive: { color: C.brand },
        createBtn: {
            backgroundColor: C.brand, borderRadius: 24, paddingVertical: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
        },
        createBtnDisabled: { backgroundColor: C.wash, shadowOpacity: 0 },
        createBtnText: { fontFamily: F.bold, fontSize: 14, color: C.navy },

        pressed: { opacity: 0.75 },
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BagCard({
    bag, styles, C, onShowQR, onPress,
}: {
    bag: DigitalBag;
    styles: ReturnType<typeof createStyles>;
    C: ReturnType<typeof useTheme>['colors'];
    onShowQR: (bag: DigitalBag) => void;
    onPress: (bag: DigitalBag) => void;
}) {
    const { icon, color } = materialIcon(bag.materialType);
    const sc = statusColor(bag.status, C);
    const { text: expText, urgent } = expiryText(bag.qrExpiresAt);
    const isActive = bag.status === 'open' || bag.status === 'pending_pickup';
    const isTransit = bag.status === 'in_transit';

    // Pulse animation for in_transit bags
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (!isTransit) return;
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: UND }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: UND }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [isTransit]);

    return (
        <Pressable
            style={({ pressed }) => [styles.bagCard, isActive && styles.bagCardActive, pressed && styles.pressed]}
            onPress={() => { haptic(); onPress(bag); }}
        >
            <View style={{ flexDirection: 'row' }}>
                {isActive && <View style={styles.accentBar} />}
                <View style={[styles.bagRow, { flex: 1 }]}>
                    <View style={[styles.bagIconWrap, { backgroundColor: `${color}20` }]}>
                        <Ionicons name={icon as any} size={22} color={color} />
                    </View>
                    <View style={styles.bagInfo}>
                        <Text style={styles.bagId}>{bag.id}</Text>
                        <Text style={styles.bagMaterial}>{bag.materialType}</Text>
                    </View>
                    <View style={styles.bagRight}>
                        <View style={[styles.statusPill, { backgroundColor: `${sc}18` }]}>
                            <Text style={[styles.statusText, { color: sc }]}>{statusLabel(bag.status)}</Text>
                        </View>
                        {bag.status !== 'collected' && bag.status !== 'at_depot' && (
                            <Text style={[styles.expiryText, { color: urgent ? '#F57C00' : C.muted }]}>{expText}</Text>
                        )}
                    </View>
                </View>
            </View>

            {/* In-transit picker banner */}
            {isTransit && bag.pickerName && (
                <View style={styles.pickerBanner}>
                    <Animated.View style={{ opacity: pulseAnim }}>
                        <Ionicons name="navigate" size={14} color="#2196F3" />
                    </Animated.View>
                    <Text style={styles.pickerBannerText}>{bag.pickerName} is on the way · {bag.pickerEta}</Text>
                </View>
            )}

            {/* Open bags: show QR chip */}
            {(bag.status === 'open' || bag.status === 'pending_pickup') && (
                <Pressable
                    style={({ pressed }) => [styles.pickerBanner, pressed && styles.pressed]}
                    onPress={() => { haptic(); onShowQR(bag); }}
                >
                    <View style={styles.qrChip}>
                        <Ionicons name="qr-code-outline" size={13} color={C.brand} />
                        <Text style={styles.qrChipText}>Show QR to Picker</Text>
                    </View>
                    <Text style={{ fontFamily: F.body, fontSize: 11, color: C.muted, flex: 1, marginLeft: 8 }}>
                        Tap to reveal full-screen QR
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={C.muted} />
                </Pressable>
            )}
        </Pressable>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CitizenBags() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors: C, gradients: G, isDark } = useTheme();
    const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

    const [bags, setBags] = useState<DigitalBag[]>(MOCK_BAGS);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

    const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') =>
        setToast({ visible: true, message: msg, type }), []);

    const enterAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(enterAnim, { toValue: 1, duration: 360, useNativeDriver: UND }).start();
    }, []);

    const activeBags = useMemo(() => bags.filter(b => b.status !== 'collected'), [bags]);
    const openBags = useMemo(() => bags.filter(b => b.status === 'open'), [bags]);
    const atMax = activeBags.length >= MAX_BAGS;

    const handleCreateBag = useCallback(() => {
        if (!selectedMaterial) return;
        haptic();
        const newBag: DigitalBag = {
            id: genId(),
            materialType: selectedMaterial,
            status: 'open',
            createdAt: new Date(),
            qrExpiresAt: hoursFromNow(48),
        };
        setBags(prev => [newBag, ...prev]);
        setModalVisible(false);
        setSelectedMaterial(null);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast_(`${selectedMaterial} bag created — BAG ID ready`, 'success');
    }, [selectedMaterial, toast_]);

    const handleRequestPickup = useCallback(() => {
        haptic();
        toast_(`Pickup request sent for ${openBags.length} bag${openBags.length > 1 ? 's' : ''}`, 'success');
        setBags(prev => prev.map(b => b.status === 'open' ? { ...b, status: 'pending_pickup' } : b));
    }, [openBags.length, toast_]);

    const handleShowQR = useCallback((bag: DigitalBag) => {
        router.push({ pathname: '/Citizen/bag-qr', params: { bagId: bag.id, material: bag.materialType } } as any);
    }, [router]);

    const handleBagPress = useCallback((bag: DigitalBag) => {
        if (bag.status === 'open' || bag.status === 'pending_pickup') {
            handleShowQR(bag);
        }
    }, [handleShowQR]);

    return (
        <ErrorBoundary>
            <Animated.View style={[{ flex: 1 }, {
                opacity: enterAnim,
                transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }]}>
                <View style={styles.root}>
                    <Toast
                        visible={toast.visible} message={toast.message} type={toast.type}
                        onHide={() => setToast(t => ({ ...t, visible: false }))}
                    />

                    {/* ── Header ── */}
                    <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[styles.header, { paddingTop: insets.top + 12 }]}>
                        <View style={styles.headerBlob1} />
                        <View style={styles.headerBlob2} />
                        <View style={styles.headerRow}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.headerSub}>Manage your recyclables</Text>
                                <Text style={styles.headerTitle}>My Bags</Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => [styles.addBtn, atMax && styles.disabledAddBtn, pressed && styles.pressed]}
                                onPress={() => {
                                    if (atMax) { toast_(`Maximum ${MAX_BAGS} active bags allowed`, 'warning'); return; }
                                    haptic(); setModalVisible(true);
                                }}
                            >
                                <Ionicons name="add" size={22} color={atMax ? 'rgba(255,255,255,0.4)' : '#4EC831'} />
                            </Pressable>
                        </View>

                        {/* Stats chips */}
                        <View style={styles.countRow}>
                            <View style={styles.countChip}>
                                <Text style={styles.countVal}>{activeBags.length}/{MAX_BAGS}</Text>
                                <Text style={styles.countLbl}>Active Bags</Text>
                            </View>
                            <View style={styles.countChip}>
                                <Text style={styles.countVal}>{openBags.length}</Text>
                                <Text style={styles.countLbl}>Ready for Pickup</Text>
                            </View>
                            <View style={styles.countChip}>
                                <Text style={styles.countVal}>{bags.filter(b => b.status === 'collected').length}</Text>
                                <Text style={styles.countLbl}>Collected</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* ── Content ── */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
                    >
                        {activeBags.length === 0 ? (
                            /* Empty state */
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="bag-outline" size={30} color={C.brand} />
                                </View>
                                <Text style={styles.emptyTitle}>No active bags yet</Text>
                                <Text style={styles.emptyBody}>
                                    Create your first Digital Bag to get started.{'\n'}
                                    A picker will collect it or drop it off at a depot.
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
                                    onPress={() => { haptic(); setModalVisible(true); }}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color={C.navy} />
                                    <Text style={styles.emptyBtnText}>Create Your First Bag</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                {/* Request pickup CTA */}
                                {openBags.length > 0 && (
                                    <View style={styles.sectionRow}>
                                        <Text style={styles.sectionTitle}>
                                            {activeBags.length} Active Bag{activeBags.length !== 1 ? 's' : ''}
                                        </Text>
                                        <Pressable
                                            style={({ pressed }) => [styles.requestCta, pressed && styles.pressed]}
                                            onPress={handleRequestPickup}
                                        >
                                            <Ionicons name="bicycle-outline" size={14} color={C.navy} />
                                            <Text style={styles.requestCtaText}>Request Pickup</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {activeBags.map(bag => (
                                    <BagCard
                                        key={bag.id}
                                        bag={bag}
                                        styles={styles}
                                        C={C}
                                        onShowQR={handleShowQR}
                                        onPress={handleBagPress}
                                    />
                                ))}
                            </>
                        )}
                    </ScrollView>

                    {/* ── Create Bag Modal ── */}
                    <Modal
                        visible={modalVisible} animationType="slide" transparent
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
                            <Pressable style={styles.modalSheet} onPress={() => { }}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>New Digital Bag</Text>
                                <Text style={styles.modalSub}>Select the type of material you're recycling</Text>

                                <View style={styles.materialGrid}>
                                    {MATERIALS.map(m => (
                                        <Pressable
                                            key={m.type}
                                            style={({ pressed }) => [
                                                styles.materialChip,
                                                selectedMaterial === m.type && styles.materialChipActive,
                                                pressed && styles.pressed,
                                            ]}
                                            onPress={() => { haptic(); setSelectedMaterial(m.type); }}
                                        >
                                            <Ionicons
                                                name={m.icon as any} size={18}
                                                color={selectedMaterial === m.type ? C.brand : m.color}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.materialChipText, selectedMaterial === m.type && styles.materialChipTextActive]}>
                                                    {m.type}
                                                </Text>
                                                <Text style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>{m.desc}</Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>

                                <Pressable
                                    style={({ pressed }) => [styles.createBtn, !selectedMaterial && styles.createBtnDisabled, pressed && selectedMaterial && styles.pressed]}
                                    onPress={handleCreateBag}
                                    disabled={!selectedMaterial}
                                >
                                    <Ionicons name="qr-code-outline" size={18} color={selectedMaterial ? C.navy : C.muted} />
                                    <Text style={[styles.createBtnText, !selectedMaterial && { color: C.muted }]}>
                                        Generate Bag & QR Code
                                    </Text>
                                </Pressable>
                            </Pressable>
                        </Pressable>
                    </Modal>
                </View>
            </Animated.View>
        </ErrorBoundary>
    );
}
