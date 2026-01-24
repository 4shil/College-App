import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// Theme colors interface for ErrorBoundary
interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  error: string;
  primary: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  themeColors?: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Default theme colors (fallback if theme not provided)
const DEFAULT_COLORS: ThemeColors = {
  background: '#0F172A',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  error: '#EF4444',
  primary: '#6366F1',
};

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call optional error handler (for logging to Sentry, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const colors = this.props.themeColors || DEFAULT_COLORS;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.error}25` }]}>
              <Ionicons name="warning-outline" size={48} color={colors.error} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              An unexpected error occurred. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails} contentContainerStyle={styles.errorDetailsContent}>
                <Text style={[styles.errorTitle, { color: colors.error }]}>Error Details:</Text>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>{this.state.error.toString()}</Text>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={[styles.errorTitle, { color: colors.error }]}>Component Stack:</Text>
                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>{this.state.errorInfo.componentStack}</Text>
                  </>
                )}
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper component that provides theme colors via hook
export function ErrorBoundary(props: Omit<Props, 'themeColors'>) {
  const { colors } = useThemeStore();
  
  const themeColors: ThemeColors = {
    background: colors.background,
    text: colors.textPrimary,
    textSecondary: colors.textSecondary,
    error: colors.error || '#EF4444',
    primary: colors.primary,
  };

  return <ErrorBoundaryClass {...props} themeColors={themeColors} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 24,
  },
  errorDetailsContent: {
    padding: 12,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
