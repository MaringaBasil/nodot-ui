import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';

const BRAND = '#4EC831';
const NAVY = '#1B2C3A';
const SURFACE = '#F0F2F5';

type Step = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('request');
  const [emailOrCell, setEmailOrCell] = useState('');
  const [cell, setCell] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleComplete = () => setShowSuccess(true);

  const handleSuccessOK = () => {
    setShowSuccess(false);
    if (step === 'request') {
      setStep('reset');
    } else {
      // Password reset done – return to sign in
      router.replace('/Auth/sign-in');
    }
  };

  const isReset = step === 'reset';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <Text style={styles.headerSubtitle}>
            {isReset
              ? 'Reset your Password'
              : 'Reset your password by using your email or cell number'}
          </Text>
        </View>
      </View>

      {/* ── Form ── */}
      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isReset ? (
          <>
            {/* Reset step: new password fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputRow, focused === 'pw' && styles.inputRowFocused]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Enter Password"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused(null)}
                />
                <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                  <Ionicons
                    name={showPw ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="#B0B0B0"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={[styles.inputRow, focused === 'confirm' && styles.inputRowFocused]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Confirm Password"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showConfirm}
                  value={confirm}
                  onChangeText={setConfirm}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={10}>
                  <Ionicons
                    name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="#B0B0B0"
                  />
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Request step: email OR cell number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.inputRow, focused === 'email' && styles.inputRowFocused]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Enter email address"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailOrCell}
                  onChangeText={setEmailOrCell}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Cell Number</Text>
              <View style={[styles.inputRow, focused === 'cell' && styles.inputRowFocused]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="071 234 5678"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="phone-pad"
                  value={cell}
                  onChangeText={setCell}
                  onFocus={() => setFocused('cell')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          </>
        )}

        {/* Complete / Submit button */}
        <Pressable
          style={({ pressed }) => [styles.navyBtn, pressed && { opacity: 0.85 }]}
          onPress={handleComplete}
        >
          <Text style={styles.navyBtnText}>COMPLETE</Text>
        </Pressable>
      </ScrollView>

      {/* ── Success modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCheckCircle}>
                <Ionicons name="checkmark" size={22} color={BRAND} />
              </View>
              <Text style={styles.modalTitle}>Success</Text>
            </View>

            <Text style={styles.modalDesc}>
              You will receive an email{'\n'}or SMS confirmation shortly.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalOKBtn, pressed && { opacity: 0.75 }]}
              onPress={handleSuccessOK}
            >
              <Text style={styles.modalOKText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 24,
    color: '#1A1D1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: F.body,
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 4,
    lineHeight: 20,
  },

  /* ── Form ── */
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: 15,
    color: '#1A1D1A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  inputRowFocused: {
    borderColor: BRAND,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#1A1D1A',
  },

  /* OR divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D8D8',
  },
  dividerText: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: '#9E9E9E',
    letterSpacing: 0.5,
  },

  /* Button */
  navyBtn: {
    backgroundColor: NAVY,
    borderRadius: 32,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  navyBtnText: {
    fontFamily: F.display,
    color: BRAND,
    fontSize: 14,
    letterSpacing: 1.4,
  },

  /* ── Success modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: BRAND,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCheckCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: F.display,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalDesc: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  modalOKBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalOKText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: NAVY,
    letterSpacing: 0.5,
  },
});
