import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Colors';

export type CardTone = 'default' | 'muted';

export const Card = ({ children, tone = 'default', style }: PropsWithChildren<{ tone?: CardTone; style?: ViewStyle | ViewStyle[] }>) => (
  <View style={[styles.card, tone === 'muted' && styles.cardMuted, style]}>{children}</View>
);

export const Chip = ({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) => (
  <Pressable style={[styles.chip, selected && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

export const Badge = ({ label }: { label: string }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

export const PrimaryButton = ({ label, onPress }: { label: string; onPress?: () => void }) => (
  <Pressable style={styles.primaryButton} onPress={onPress}>
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

export const SectionHeader = ({
  title,
  meta,
  action,
  style,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) => (
  <View style={[styles.sectionHeader, style]}>
    <View style={styles.sectionHeaderTextWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
    {action}
  </View>
);

export const Divider = ({ inset = 0 }: { inset?: number }) => <View style={[styles.divider, { marginLeft: inset }]} />;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl,
    gap: Theme.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  cardMuted: {
    backgroundColor: Theme.colors.neutral100,
  },
  chip: {
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: 10,
    borderRadius: Theme.radius.m,
    backgroundColor: Theme.colors.wash,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Theme.colors.greenDark,
    borderColor: Theme.colors.greenDark,
  },
  chipText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
  },
  badge: {
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: 10,
    backgroundColor: Theme.colors.neutral200,
    borderRadius: Theme.radius.m,
    borderWidth: 1,
    borderColor: Theme.colors.neutral300,
  },
  badgeText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
  },
  primaryButton: {
    backgroundColor: Theme.colors.green,
    borderRadius: Theme.radius.l,
    paddingVertical: 14,
    alignItems: 'center',
    ...Theme.shadow.subtle,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.m,
  },
  sectionHeaderTextWrap: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 17,
    color: Theme.colors.ink,
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.muted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.neutral300,
    marginVertical: Theme.spacing.m,
    opacity: 0.6,
  },
});
