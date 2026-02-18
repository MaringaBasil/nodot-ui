import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Theme } from '@/constants/Colors';

interface BalanceProps {
  amount: number;
  onWithdraw?: () => void;
  onHistory?: () => void;
}

export const Balance = ({ amount, onWithdraw, onHistory }: BalanceProps) => (
  <View style={styles.container}>
    <View style={styles.left}>
      <View style={styles.labelRow}>
        <AppIcon name="account-balance-wallet" size={14} color={Theme.colors.greenDark} />
        <Text style={styles.label}>Wallet balance</Text>
      </View>
      <Text style={styles.amount}>R {amount.toFixed(2)}</Text>
      <Pressable style={({ pressed }) => [styles.historyLink, pressed && styles.linkPressed]} onPress={onHistory}>
        <Text style={styles.historyText}>View history</Text>
        <AppIcon name="chevron-right" size={14} color={Theme.colors.greenDark} />
      </Pressable>
    </View>
    <View style={styles.actions}>
      <Pressable style={({ pressed }) => [styles.actionBtn, styles.withdrawBtn, pressed && styles.btnPressed]} onPress={onWithdraw}>
        <AppIcon name="arrow-upward" size={18} color="#FFFFFF" />
        <Text style={styles.withdrawText}>Withdraw</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  left: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.greenDark,
  },
  amount: {
    fontSize: 26,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  linkPressed: {
    opacity: 0.7,
  },
  historyText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.greenDark,
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.s,
  },
  withdrawBtn: {
    backgroundColor: Theme.colors.green,
    ...Theme.shadow.glow,
  },
  btnPressed: {
    opacity: 0.85,
  },
  withdrawText: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
});
