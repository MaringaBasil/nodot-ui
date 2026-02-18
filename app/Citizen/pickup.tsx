import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, Platform, Animated, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const useNativeDriver = Platform.OS !== 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const timeSlots = [
  { id: '1', time: '09:00 - 11:00', label: 'Morning', icon: 'wb-sunny', available: true, popular: false },
  { id: '2', time: '12:00 - 14:00', label: 'Midday', icon: 'brightness-high', available: true, popular: true },
  { id: '3', time: '15:00 - 17:00', label: 'Afternoon', icon: 'wb-twilight', available: true, popular: false },
  { id: '4', time: '17:00 - 19:00', label: 'Evening', icon: 'nightlight', available: false, popular: false },
];

const materials = [
  { id: 'plastic', label: 'Plastic', icon: 'local-drink', color: '#2196F3', rate: 'R 5/kg' },
  { id: 'paper', label: 'Paper', icon: 'description', color: '#795548', rate: 'R 3/kg' },
  { id: 'glass', label: 'Glass', icon: 'wine-bar', color: '#4CAF50', rate: 'R 4/kg' },
  { id: 'metal', label: 'Metal', icon: 'settings', color: '#9E9E9E', rate: 'R 8/kg' },
  { id: 'electronics', label: 'E-waste', icon: 'devices', color: '#FF9800', rate: 'R 12/kg' },
  { id: 'textile', label: 'Textiles', icon: 'checkroom', color: '#9C27B0', rate: 'R 2/kg' },
];

// Saved addresses
const savedAddresses = [
  { id: '1', label: 'Home', address: '123 Main Street, Rosebank', icon: 'home' },
  { id: '2', label: 'Work', address: '456 Business Park, Sandton', icon: 'business' },
];

// Driver ratings
const driverInfo = {
  name: 'Thabo M.',
  rating: 4.9,
  completedPickups: 342,
  vehicle: 'Toyota Hilux',
  avatar: 'T',
};

export default function CitizenPickup() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const [formError, setFormError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'later'>('today');
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver }),
    ]).start();

    // Stagger card animations
    Animated.stagger(100, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver, friction: 6 })
    )).start();

    // Pulse animation for confirm button when form is valid
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const selectSavedAddress = useCallback((addr: typeof savedAddresses[0]) => {
    setAddress(addr.address);
    setShowAddressModal(false);
    showToast(`${addr.label} address selected`, 'success');
  }, [showToast]);

  const handlePress = useCallback((action: () => void) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, [isWeb]);

  const toggleMaterial = useCallback((id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Pickup slots refreshed', 'success');
    }, 1000);
  }, [showToast]);

  const estimatedReward = weight ? Math.round(Number(weight) * 5) : 0;

  const handleConfirm = useCallback(() => {
    const trimmedAddress = address.trim();
    const trimmedWeight = weight.trim();
    const parsedWeight = Number(trimmedWeight);
    if (!trimmedAddress) {
      setFormError('Please enter a pickup address');
      showToast('Please enter a pickup address', 'error');
      return;
    }
    if (!trimmedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setFormError('Add a valid estimated weight in kg');
      showToast('Please enter a valid estimated weight', 'error');
      return;
    }
    if (!selectedSlot) {
      setFormError('Please select a time slot');
      showToast('Please select a time slot', 'error');
      return;
    }
    if (selectedMaterials.length === 0) {
      setFormError('Please select at least one material type');
      showToast('Please select at least one material', 'error');
      return;
    }
    setFormError('');
    if (!isWeb) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('Pickup confirmed! Driver assigned.', 'success');
    setTimeout(() => {
      router.replace('/Citizen/home');
    }, 1500);
  }, [address, weight, selectedSlot, selectedMaterials, router, showToast, isWeb]);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.greenDark} />}
        >
          <Animated.View style={[styles.headerCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={['rgba(46,125,50,0.1)', 'rgba(46,125,50,0.02)', 'transparent']}
              style={styles.headerGradient}
            />
            <View style={styles.headerRow}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="local-shipping" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Request pickup</Text>
                <Text style={styles.subtitle}>Schedule a collection and get paid after verification</Text>
              </View>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <MaterialIcons name="verified" size={14} color={Theme.colors.greenDark} />
                <Text style={styles.headerStatText}>Free pickup</Text>
              </View>
              <View style={styles.headerStatDot} />
              <View style={styles.headerStat}>
                <MaterialIcons name="timer" size={14} color={Theme.colors.greenDark} />
                <Text style={styles.headerStatText}>Same day available</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.summaryRow}>
            <Pressable style={({ pressed }) => [styles.summaryCard, pressed && styles.cardPressed]} onPress={() => handlePress(() => showToast('Fastest available slot', 'info'))}>
              <View style={styles.summaryIcon}>
                <MaterialIcons name="schedule" size={16} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.summaryLabel}>Next window</Text>
              <Text style={styles.summaryValue}>Today 15:30</Text>
              <Text style={styles.summaryMeta}>Fastest slot</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.summaryCard, pressed && styles.cardPressed]} onPress={() => handlePress(() => showToast('Average verification time', 'info'))}>
              <View style={styles.summaryIcon}>
                <MaterialIcons name="verified" size={16} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.summaryLabel}>Verification</Text>
              <Text style={styles.summaryValue}>~2h</Text>
              <Text style={styles.summaryMeta}>Average payout</Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            <SectionHeader title="Location" meta="Where should we pick up?" />
            {!!formError && (
              <View style={styles.errorBadge}>
                <MaterialIcons name="error-outline" size={14} color="#B3261E" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}
            <View style={styles.inputWrap}>
              <MaterialIcons name="place" size={18} color={Theme.colors.muted} style={styles.inputIcon} />
              <TextInput
                placeholder="Pickup address"
                placeholderTextColor="#7A817B"
                style={styles.inputWithIcon}
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <View style={styles.inputWrap}>
              <MaterialIcons name="door-front" size={18} color={Theme.colors.muted} style={styles.inputIcon} />
              <TextInput
                placeholder="Apartment, unit, or gate code"
                placeholderTextColor="#7A817B"
                style={styles.inputWithIcon}
                value={unit}
                onChangeText={setUnit}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <SectionHeader title="Materials" meta="What are you recycling?" />
            <View style={styles.materialsRow}>
              {materials.map((m) => (
                <Pressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.materialChip,
                    selectedMaterials.includes(m.id) && styles.materialChipActive,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => handlePress(() => toggleMaterial(m.id))}
                >
                  <MaterialIcons
                    name={m.icon as any}
                    size={16}
                    color={selectedMaterials.includes(m.id) ? '#FFFFFF' : Theme.colors.muted}
                  />
                  <Text style={[styles.materialText, selectedMaterials.includes(m.id) && styles.materialTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.weightRow}>
              <View style={styles.weightInputWrap}>
                <MaterialIcons name="scale" size={18} color={Theme.colors.muted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Estimated weight"
                  placeholderTextColor="#7A817B"
                  keyboardType="numeric"
                  style={styles.inputWithIcon}
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={styles.weightUnit}>
                <Text style={styles.weightUnitText}>kg</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <SectionHeader title="Time slot" meta="When works best?" />
            <View style={styles.slotsGrid}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot.id}
                  style={({ pressed }) => [
                    styles.slotCard,
                    selectedSlot === slot.id && styles.slotCardActive,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handlePress(() => setSelectedSlot(slot.id))}
                >
                  <Text style={[styles.slotLabel, selectedSlot === slot.id && styles.slotLabelActive]}>{slot.label}</Text>
                  <Text style={[styles.slotTime, selectedSlot === slot.id && styles.slotTimeActive]}>{slot.time}</Text>
                  {selectedSlot === slot.id && (
                    <View style={styles.slotCheck}>
                      <MaterialIcons name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <SectionHeader title="Notes" meta="Optional instructions" />
            <TextInput
              placeholder="Add notes for the driver (gate code, landmarks, etc.)"
              placeholderTextColor="#7A817B"
              style={styles.notesInput}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <Animated.View style={[styles.estimateCard, { opacity: fadeAnim }]}>
            <View style={styles.estimateRow}>
              <View style={styles.estimateIcon}>
                <MaterialIcons name="payments" size={20} color={Theme.colors.greenDark} />
              </View>
              <View style={styles.estimateText}>
                <Text style={styles.estimateLabel}>Estimated reward</Text>
                <Text style={styles.estimateValue}>R {estimatedReward || '20'} - R {(estimatedReward || 20) + 20}</Text>
              </View>
              <View style={styles.estimateBadge}>
                <MaterialIcons name="trending-up" size={14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.estimateMeta}>Final amount depends on verified weight and quality</Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (!address.trim() || !weight.trim() || !selectedSlot || selectedMaterials.length === 0) && styles.primaryButtonDisabled,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={handleConfirm}
              disabled={!address.trim() || !weight.trim() || !selectedSlot || selectedMaterials.length === 0}
            >
              <LinearGradient
                colors={[Theme.colors.green, Theme.colors.greenDark]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Confirm pickup</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.paper },
  content: { padding: 14, paddingBottom: 100, gap: 12 },

  // Header
  headerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontFamily: Theme.fonts.display, color: Theme.colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 4, lineHeight: 16 },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)'
  },
  headerStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerStatText: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.greenDark },
  headerStatDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Theme.colors.muted, marginHorizontal: 10 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.m,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.subtle
  },
  summaryIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 10, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  summaryValue: { fontSize: 16, fontFamily: Theme.fonts.display, color: Theme.colors.ink, marginTop: 2 },
  summaryMeta: { fontSize: 10, fontFamily: Theme.fonts.body, color: Theme.colors.greenDark, marginTop: 2 },
  cardPressed: { opacity: 0.8 },

  // Form
  formCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: Theme.radius.s,
    borderWidth: 1,
    borderColor: '#FFCDD2'
  },
  errorText: { fontSize: 12, fontFamily: Theme.fonts.body, color: '#B3261E', flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.paper,
    borderRadius: Theme.radius.m,
    borderWidth: 1.5,
    borderColor: Theme.colors.border
  },
  inputIcon: { marginLeft: 12 },
  inputWithIcon: { flex: 1, padding: 12, fontFamily: Theme.fonts.body, color: Theme.colors.ink, fontSize: 14 },

  // Materials
  materialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Theme.colors.wash,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  materialChipActive: { backgroundColor: Theme.colors.greenDark, borderColor: Theme.colors.greenDark },
  chipPressed: { opacity: 0.8 },
  materialText: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  materialTextActive: { color: '#FFFFFF', fontFamily: Theme.fonts.display },

  // Weight
  weightRow: { flexDirection: 'row', gap: 10 },
  weightInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.paper,
    borderRadius: Theme.radius.m,
    borderWidth: 1.5,
    borderColor: Theme.colors.border
  },
  weightUnit: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    alignItems: 'center',
    justifyContent: 'center'
  },
  weightUnitText: { fontSize: 14, fontFamily: Theme.fonts.display, color: Theme.colors.ink },

  // Slots
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    width: '47%',
    padding: 14,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  slotCardActive: { backgroundColor: '#E8F5E9', borderColor: Theme.colors.green },
  slotLabel: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  slotLabelActive: { color: Theme.colors.greenDark, fontFamily: Theme.fonts.display },
  slotTime: { fontSize: 14, fontFamily: Theme.fonts.display, color: Theme.colors.ink, marginTop: 4 },
  slotTimeActive: { color: Theme.colors.greenDark },
  slotCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Notes
  notesInput: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.m,
    padding: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
    backgroundColor: Theme.colors.paper,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top'
  },

  // Estimate
  estimateCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.l,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 8
  },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  estimateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  estimateText: { flex: 1 },
  estimateLabel: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.greenDark },
  estimateValue: { fontSize: 20, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  estimateMeta: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  estimateBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: Theme.radius.l,
    backgroundColor: Theme.colors.green,
    shadowColor: Theme.colors.greenDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryButtonText: { fontSize: 16, fontFamily: Theme.fonts.display, color: '#FFFFFF', letterSpacing: 0.3 },
});
