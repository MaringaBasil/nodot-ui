import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Theme } from '@/constants/Colors';
import { AppIcon as MaterialIcons } from './AppIcon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon = 'inbox', title, message, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon as any} size={48} color={Theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Theme.colors.wash,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    backgroundColor: Theme.colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radius.m,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
});
