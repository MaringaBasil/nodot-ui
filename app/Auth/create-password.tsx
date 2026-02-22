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

const BRAND = '#4EC831';
const NAVY = '#1B2C3A';
const SURFACE = '#F0F2F5';

export default function CreatePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<'pw' | 'confirm' | null>(null);

  const handleComplete = () => {
    router.replace('/Citizen/home');
  };

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
          <Text style={styles.headerSubtitle}>Create your Password</Text>
        </View>
      </View>

      {/* ── Form ── */}
      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Password */}
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

        {/* Confirm Password */}
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

        {/* Complete button */}
        <Pressable
          style={({ pressed }) => [styles.navyBtn, pressed && { opacity: 0.85 }]}
          onPress={handleComplete}
        >
          <Text style={styles.navyBtnText}>COMPLETE</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE,
  },
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
    marginTop: 2,
  },
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
