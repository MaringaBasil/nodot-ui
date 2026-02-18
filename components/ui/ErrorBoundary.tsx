import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Theme } from '@/constants/Colors';
import { AppIcon as MaterialIcons } from './AppIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="error-outline" size={48} color={Theme.colors.orange} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry for the inconvenience. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          )}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.colors.paper,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Theme.colors.wash,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Theme.fonts.mono,
    color: Theme.colors.orange,
    marginBottom: 16,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#FFF5ED',
    borderRadius: Theme.radius.m,
  },
  button: {
    backgroundColor: Theme.colors.green,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Theme.radius.m,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
});
