import React, { useState } from 'react';
import {
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
import { PressableScale } from '@/components/ui/PressableScale';
import * as Haptics from 'expo-haptics';

const BRAND = '#4EC831';
const NAVY = '#1B2C3A';
const SURFACE = '#F0F2F5';

type Field = 'firstName' | 'lastName' | 'email' | 'cell';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cell, setCell] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);

  const handleSubmit = () => {
    router.push('/Auth/create-password');
  };

  const inp = (field: Field) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused(null),
    style: [styles.input, focused === field && styles.inputFocused],
  });

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
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Personal Details</Text>
        </View>
      </View>

      {/* ── Form ── */}
      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FieldGroup label="First name" required>
          <TextInput
            placeholder="John Doe"
            placeholderTextColor="#C0C0C0"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            {...inp('firstName')}
          />
        </FieldGroup>

        <FieldGroup label="Last name" required>
          <TextInput
            placeholder="00 04 12 8746 086"
            placeholderTextColor="#C0C0C0"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            {...inp('lastName')}
          />
        </FieldGroup>

        <FieldGroup label="Email Address" required>
          <TextInput
            placeholder="John.doe@email.com"
            placeholderTextColor="#C0C0C0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            {...inp('email')}
          />
        </FieldGroup>

        <FieldGroup label="Cell Number" required>
          <TextInput
            placeholder="071 234 5678"
            placeholderTextColor="#C0C0C0"
            value={cell}
            onChangeText={setCell}
            keyboardType="phone-pad"
            {...inp('cell')}
          />
        </FieldGroup>

        {/* Terms checkbox */}
        <Pressable
          style={styles.termsRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
          hitSlop={8}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            I accept the{' '}
            <Text style={styles.termsLink}>terms of use</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>privacy policy</Text>
          </Text>
        </Pressable>

        {/* Submit */}
        <PressableScale
          style={styles.navyBtn}
          onPress={handleSubmit}
          haptic={Haptics.ImpactFeedbackStyle.Medium}
          scaleTo={0.97}
        >
          <Text style={styles.navyBtnText}>SUBMIT</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      {children}
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
    backgroundColor: SURFACE,
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
    justifyContent: 'center',
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
    marginTop: 2,
  },

  /* ── Form ── */
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  requiredStar: {
    color: '#E53935',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 15,
    color: '#1A1D1A',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: BRAND,
  },

  /* Terms */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: F.semibold,
    color: BRAND,
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
});
