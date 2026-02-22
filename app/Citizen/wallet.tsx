import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { F, Theme } from '@/constants/Colors';
import { PressableScale } from '@/components/ui/PressableScale';
import * as Haptics from 'expo-haptics';

const BRAND = Theme.colors.brand;
const NAVY = Theme.colors.navy;

// ─── Mock data ────────────────────────────────────────────────────────────────
const BALANCE = { available: 325.5, pending: 24.0, points: 1240 };

const PAYMENT_METHODS = [
  { id: 'fnb', bank: 'FNB',          last4: '3821', type: 'Cheque',  primary: true  },
  { id: 'std', bank: 'Standard Bank', last4: '0047', type: 'Savings', primary: false },
];

const TRANSACTIONS = [
  { id: 't1', date: 'Today, 14:23',  desc: 'PET Plastic — 0.8 kg',     amount: +8.00,   type: 'credit' },
  { id: 't2', date: 'Today, 11:05',  desc: 'Cardboard — 1.2 kg',       amount: +4.80,   type: 'credit' },
  { id: 't3', date: 'Yesterday',     desc: 'Payout to FNB •••• 3821',  amount: -150.00, type: 'debit'  },
  { id: 't4', date: 'Mon, 19 Feb',   desc: 'Glass Bottle — 2.0 kg',    amount: +12.00,  type: 'credit' },
  { id: 't5', date: 'Mon, 19 Feb',   desc: 'Referral bonus — Sipho M.',amount: +10.00,  type: 'credit' },
  { id: 't6', date: 'Fri, 16 Feb',   desc: 'Aluminium cans — 0.5 kg',  amount: +6.50,   type: 'credit' },
  { id: 't7', date: 'Fri, 16 Feb',   desc: 'Payout to FNB •••• 3821',  amount: -80.00,  type: 'debit'  },
  { id: 't8', date: 'Wed, 14 Feb',   desc: 'PET Plastic — 1.5 kg',     amount: +15.00,  type: 'credit' },
];

// ─── Withdraw modal ────────────────────────────────────────────────────────────
const WithdrawModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  available: number;
}> = ({ visible, onClose, available }) => {
  const [amount, setAmount] = useState('');
  const parsed = parseFloat(amount) || 0;
  const valid = parsed > 0 && parsed <= available;

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Withdraw funds</Text>
          <Text style={styles.modalSub}>
            Available:{' '}
            <Text style={{ color: BRAND, fontFamily: F.bold }}>R {available.toFixed(2)}</Text>
          </Text>

          {/* Amount input */}
          <View style={[styles.amountRow, valid && styles.amountRowValid]}>
            <Text style={[styles.currencySymbol, amount.length > 0 && { color: NAVY }]}>R</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#C8C8C8"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {[50, 100, 200, available].map((v) => (
              <Pressable
                key={v}
                style={[styles.quickChip, parsed === v && styles.quickChipActive]}
                onPress={() => setAmount(v.toFixed(2))}
              >
                <Text style={[styles.quickChipText, parsed === v && styles.quickChipTextActive]}>
                  {v === available ? 'All' : `R${v}`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Destination */}
          <View style={styles.destinationRow}>
            <Ionicons name="card-outline" size={18} color="#7A7A7A" />
            <Text style={styles.destinationText}>FNB Cheque •••• 3821</Text>
            <Text style={styles.destinationChange}>Change</Text>
          </View>

          <Pressable
            style={[styles.actionBtn, !valid && styles.actionBtnDisabled]}
            onPress={valid ? handleClose : undefined}
          >
            <Text style={[styles.actionBtnText, !valid && styles.actionBtnTextDisabled]}>
              {valid ? `Withdraw R ${parsed.toFixed(2)}` : 'Enter an amount'}
            </Text>
          </Pressable>

          <Text style={styles.modalNote}>
            Funds arrive within 1–2 business days. No withdrawal fees.
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
};

// ─── Statement modal ───────────────────────────────────────────────────────────
const StatementModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('john.doe@email.com');
  const [emailSent, setEmailSent] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleClose = () => {
    setEmailSent(false);
    setDownloaded(false);
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Get statement</Text>
          <Text style={styles.modalSub}>February 2026 · All transactions</Text>

          {/* Download option */}
          <Pressable
            style={({ pressed }) => [
              styles.statementOption,
              pressed && { backgroundColor: '#F0F2F5' },
              downloaded && styles.statementOptionDone,
            ]}
            onPress={() => setDownloaded(true)}
          >
            <View style={[styles.statementIconWrap, { backgroundColor: `${NAVY}12` }]}>
              <Ionicons
                name={downloaded ? 'checkmark-outline' : 'download-outline'}
                size={20}
                color={downloaded ? Theme.colors.greenDark : NAVY}
              />
            </View>
            <View style={styles.statementOptionText}>
              <Text style={styles.statementOptionLabel}>
                {downloaded ? 'Downloaded' : 'Download PDF'}
              </Text>
              <Text style={styles.statementOptionDesc}>Saves to your device</Text>
            </View>
            {!downloaded && <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />}
          </Pressable>

          <View style={styles.statementDivider}>
            <View style={styles.statementDividerLine} />
            <Text style={styles.statementDividerText}>OR</Text>
            <View style={styles.statementDividerLine} />
          </View>

          {/* Email option */}
          <Text style={styles.emailLabel}>Send to email</Text>
          <View style={styles.emailInputRow}>
            <Ionicons name="mail-outline" size={16} color="#9A9A9A" style={{ marginLeft: 14 }} />
            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#C0C0C0"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              emailSent && styles.actionBtnSuccess,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setEmailSent(true)}
          >
            <Ionicons
              name={emailSent ? 'checkmark-circle-outline' : 'send-outline'}
              size={16}
              color={emailSent ? NAVY : BRAND}
            />
            <Text style={[styles.actionBtnText, emailSent && { color: NAVY }]}>
              {emailSent ? 'Statement sent!' : 'Send statement'}
            </Text>
          </Pressable>

          <Text style={styles.modalNote}>
            PDF includes all transactions for the selected period.
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top },
        {
          opacity: enterAnim,
          transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wallet & Payouts</Text>
          <Text style={styles.headerSub}>Your earnings in one place</Text>
        </View>
        {/* Transparent spacer keeps title centred */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── Balance card ── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceBlob1} />
          <View style={styles.balanceBlob2} />

          {/* Top: label + points pill */}
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <View style={styles.pointsPill}>
              <Ionicons name="trophy" size={11} color={BRAND} />
              <Text style={styles.pointsPillText}>{BALANCE.points.toLocaleString()} pts</Text>
            </View>
          </View>

          <Text style={styles.balanceAmount}>R {BALANCE.available.toFixed(2)}</Text>

          {BALANCE.pending > 0 && (
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.55)" />
              <Text style={styles.pendingText}>+ R {BALANCE.pending.toFixed(2)} processing</Text>
            </View>
          )}

          {/* Separator */}
          <View style={styles.balanceSeparator} />

          {/* Actions */}
          <View style={styles.balanceActions}>
            <PressableScale
              style={styles.withdrawPrimary}
              onPress={() => setWithdrawOpen(true)}
              haptic={Haptics.ImpactFeedbackStyle.Medium}
              scaleTo={0.95}
            >
              <Ionicons name="arrow-down-outline" size={15} color={NAVY} />
              <Text style={styles.withdrawPrimaryText}>Withdraw</Text>
            </PressableScale>
            <PressableScale
              style={styles.statementBtn}
              onPress={() => setStatementOpen(true)}
              scaleTo={0.95}
            >
              <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
              <Text style={styles.statementBtnText}>Statement</Text>
            </PressableScale>
          </View>
        </View>

        {/* ── Payment methods ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Payment methods</Text>
          <View style={styles.card}>
            {PAYMENT_METHODS.map((method, idx) => (
              <View key={method.id}>
                <View style={styles.methodRow}>
                  <View style={styles.methodIcon}>
                    <Ionicons name="card-outline" size={18} color={BRAND} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.bank} · {method.type}</Text>
                    <Text style={styles.methodDetail}>•••• {method.last4}</Text>
                  </View>
                  {method.primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                {idx < PAYMENT_METHODS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            <View style={styles.divider} />
            <Pressable style={({ pressed }) => [styles.addMethodRow, pressed && { backgroundColor: '#F8F8F8' }]}>
              <View style={[styles.methodIcon, { backgroundColor: '#F0F2F5' }]}>
                <Ionicons name="add-outline" size={18} color="#7A7A7A" />
              </View>
              <Text style={styles.addMethodText}>Add payment method</Text>
              <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
            </Pressable>
          </View>
        </View>

        {/* ── Transaction history ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Recent transactions</Text>
          <View style={styles.card}>
            {TRANSACTIONS.map((tx, idx) => (
              <View key={tx.id}>
                <View style={styles.txRow}>
                  <View style={[
                    styles.txIcon,
                    { backgroundColor: tx.type === 'credit' ? `${BRAND}18` : '#FFF0F0' },
                  ]}>
                    <Ionicons
                      name={tx.type === 'credit' ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={15}
                      color={tx.type === 'credit' ? Theme.colors.greenDark : '#B3261E'}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc}>{tx.desc}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.type === 'credit' ? Theme.colors.greenDark : '#B3261E' },
                  ]}>
                    {tx.type === 'credit' ? '+' : '−'}R {Math.abs(tx.amount).toFixed(2)}
                  </Text>
                </View>
                {idx < TRANSACTIONS.length - 1 && (
                  <View style={[styles.divider, { marginLeft: 58 }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Security notice */}
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#9A9A9A" />
          <Text style={styles.noticeText}>
            Bank integrations are powered by a secure payment gateway. Your details are never stored on our servers.
          </Text>
        </View>
      </ScrollView>

      <WithdrawModal
        visible={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        available={BALANCE.available}
      />
      <StatementModal
        visible={statementOpen}
        onClose={() => setStatementOpen(false)}
      />
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  /* Content */
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 20,
  },

  /* Balance card */
  balanceCard: {
    backgroundColor: NAVY,
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
  },
  balanceBlob1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: `${BRAND}10`,
    top: -70,
    right: -70,
  },
  balanceBlob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -50,
    left: -40,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceLabel: {
    fontFamily: F.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${BRAND}30`,
  },
  pointsPillText: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: BRAND,
  },
  balanceAmount: {
    fontFamily: F.black,
    fontSize: 44,
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  pendingText: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  balanceSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  withdrawPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  withdrawPrimaryText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: NAVY,
  },
  statementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statementBtnText: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Sections */
  section: {
    gap: 8,
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#7A7A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 16,
  },

  /* Payment methods */
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${BRAND}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodName: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: NAVY,
  },
  methodDetail: {
    fontFamily: F.body,
    fontSize: 12,
    color: '#7A7A7A',
  },
  primaryBadge: {
    backgroundColor: `${BRAND}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  primaryBadgeText: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: Theme.colors.greenDark,
  },
  addMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  addMethodText: {
    flex: 1,
    fontFamily: F.semibold,
    fontSize: 14,
    color: '#7A7A7A',
  },

  /* Transactions */
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: NAVY,
  },
  txDate: {
    fontFamily: F.body,
    fontSize: 11,
    color: '#9A9A9A',
  },
  txAmount: {
    fontFamily: F.bold,
    fontSize: 14,
    flexShrink: 0,
  },

  /* Security notice */
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  noticeText: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 12,
    color: '#9A9A9A',
    lineHeight: 18,
  },

  /* Shared modal styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: F.display,
    fontSize: 22,
    color: NAVY,
    letterSpacing: -0.4,
  },
  modalSub: {
    fontFamily: F.body,
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: -6,
  },
  modalNote: {
    fontFamily: F.body,
    fontSize: 12,
    color: '#9A9A9A',
    textAlign: 'center',
    lineHeight: 17,
  },

  /* Shared action button */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NAVY,
    borderRadius: 28,
    paddingVertical: 16,
  },
  actionBtnDisabled: {
    backgroundColor: '#EBEBEB',
  },
  actionBtnSuccess: {
    backgroundColor: `${BRAND}20`,
    borderWidth: 1,
    borderColor: BRAND,
  },
  actionBtnText: {
    fontFamily: F.display,
    fontSize: 15,
    color: BRAND,
    letterSpacing: 0.3,
  },
  actionBtnTextDisabled: {
    color: '#B0B0B0',
  },

  /* Withdraw modal */
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
    gap: 4,
  },
  amountRowValid: {
    borderBottomColor: BRAND,
  },
  currencySymbol: {
    fontFamily: F.bold,
    fontSize: 26,
    color: '#C8C8C8',
    paddingBottom: 4,
  },
  amountInput: {
    flex: 1,
    fontFamily: F.black,
    fontSize: 40,
    color: NAVY,
    letterSpacing: -1,
    paddingVertical: 0,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickChipActive: {
    backgroundColor: `${BRAND}15`,
    borderColor: BRAND,
  },
  quickChipText: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: '#5A5A5A',
  },
  quickChipTextActive: {
    color: Theme.colors.greenDark,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  destinationText: {
    flex: 1,
    fontFamily: F.semibold,
    fontSize: 14,
    color: NAVY,
  },
  destinationChange: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: BRAND,
  },

  /* Statement modal */
  statementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8F8F8',
  },
  statementOptionDone: {
    backgroundColor: `${BRAND}10`,
  },
  statementIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statementOptionText: {
    flex: 1,
    gap: 2,
  },
  statementOptionLabel: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: NAVY,
  },
  statementOptionDesc: {
    fontFamily: F.body,
    fontSize: 12,
    color: '#7A7A7A',
  },
  statementDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: -2,
  },
  statementDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  statementDividerText: {
    fontFamily: F.semibold,
    fontSize: 12,
    color: '#B0B0B0',
    letterSpacing: 0.5,
  },
  emailLabel: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: NAVY,
    marginBottom: -6,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    gap: 8,
  },
  emailInput: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 14,
    color: NAVY,
    paddingVertical: 13,
    paddingRight: 14,
  },
});
